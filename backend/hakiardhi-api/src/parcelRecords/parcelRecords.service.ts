import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  InitiatedTransferResult,
  ParcelDetailsDto,
  parcelDto,
} from './parcelrecords.types.js';
import { FabricService } from '../fabric/fabric.service.js';
import { createHash, randomUUID } from 'node:crypto';
import { AuthService } from '../auth/auth.service.js';

@Injectable()
export class ParcelRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fabric: FabricService,
    private readonly auth: AuthService,
  ) {}

  async GetParcelRecord(id: string): Promise<ParcelDetailsDto> {
    let a = await this.prisma.landParcels.findFirst({
      where: {
        parcelNumber: {
          equals: id,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        parcelNumber: true,
        county: true,
        tenure: true,
        createdAt: true,
        Size: true,
        ownershipRecords: {
          select: {
            landOwner: {
              select: {
                name: true,
                phoneNumber: true,
                registration: true,
              },
            },
            landOwnerId: true,
            titleNumber: true,
            titleVersionNumber: true,
            sha256: true,
            registeredAt: true,
            createdAt: true,
            updateAt: true,
          },
        },
      },
    });

    if (a == null) {
      throw new NotFoundException('record not found');
    }

    let p: ParcelDetailsDto = {
      bdRecord: true,
      blockchainTransaction: true,
      county: a?.county,
      ownerName: a?.ownershipRecords?.landOwner.name ?? '',
      parcelId: a?.id,
      parcelNumber: a?.parcelNumber,
      registrationDate: a?.createdAt,
      Sha: 'true',
      size: a?.Size,
      tenure: 'Freehold', //a?.tenure??
      titleVersion: a?.ownershipRecords?.titleNumber ?? '',
      ledgerConfirmed: true,
      ownerId: a.ownershipRecords?.landOwnerId ?? '',
      ownerReg: a.ownershipRecords?.landOwner.registration ?? '',
      ownerPhone: a.ownershipRecords?.landOwner.phoneNumber ?? '',
      registrationArea: a.ownershipRecords?.registeredAt ?? '',
      sha256: a.ownershipRecords?.sha256 ?? '',
      status: 'Acive',
      createdAt: a.ownershipRecords?.createdAt ?? new Date(),
      updateAt: a.ownershipRecords?.updateAt ?? new Date(),
    };
    return p;
  }

  async SearchPercel(params: string): Promise<parcelDto[]> {
    const records = await this.prisma.landParcels.findMany({
      where: {
        parcelNumber: {
          contains: params,
          mode: 'insensitive',
        },
      },
      select: {
        parcelNumber: true,
        id: true,
        county: true,
        ownershipRecords: {
          select: {
            landOwner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const l = records.map<parcelDto>((value: any) => {
      return {
        parcelId: value.id,
        county: value.county,
        ownerName: value.ownershipRecords?.landOwner.name,
        parcelNumber: value.parcelNumber,
      };
    });

    return l;
  }

  async UpladSupportDocument(filename: string, documentType: string) {
    const document = await this.prisma.transferDocuments.create({
      data: {
        createdAt: new Date().toISOString(),
        documentHash: this.sha256(filename),
        documentType: documentType,
        fileName: filename,
        id: randomUUID(),
        isDeleted: false,
      },
      select: {
        id: true,
        documentHash: true,
        fileName: true,
      },
    });
    return document;
  }

  async Transfer(data: InitiatedTransferResult, sesseionId: string) {
    try {
      // Get actor before opening the transaction
      const actorId = await this.auth.getUserId(sesseionId);

      // Perform database operations atomically
      const result = await this.prisma.$transaction(
        async (tx) => {
          // 1. Find or create buyer
          let buyerLandOwner = await tx.landOwner.findFirst({
            where: {
              registration: data.buyerId,
            },
            select: {
              id: true,
            },
          });

          let buyerLandOwnerId = buyerLandOwner?.id;

          if (!buyerLandOwnerId) {
            const landowner = await tx.landOwner.create({
              data: {
                createdAt: new Date().toISOString(),
                name: data.buyerName,
                phoneNumber: data.buyerPhone,
                registration: data.buyerId,
                id: randomUUID(),
                updateAt: new Date().toISOString(),
              },
              select: {
                id: true,
              },
            });

            buyerLandOwnerId = landowner.id;
          }

          // 2. Create transaction history
          const transaction = await tx.transactionHistory.create({
            data: {
              id: randomUUID(),
              action: 'Transfer',
              actorId,
              cost: 0,
              createdAt: new Date(),
              refrerence: data.reference,
              stage: 'LandOwnerApproval',
              transactionType: data.transferType,
              updateAt: new Date(),
              buyerId: buyerLandOwnerId,
              landOwnerId: data.parcel.ownerId,
              landParcelId: data.parcel.parcelId,
            },
            select: {
              id: true,
            },
          });

          const transId = transaction.id;

          // 3. Update supporting documents
          await Promise.all(
            data.documents.map((v) =>
              tx.transferDocuments.update({
                where: {
                  id: v.id,
                },
                data: {
                  trasnferId: transId,
                },
              }),
            ),
          );

          // 4. Create request logs
          await tx.requestLogs.createMany({
            data: [
              {
                createdAt: new Date(),
                transactionId: transId,
                id: randomUUID(),
                updateat: new Date(),
                status: null,
                userId: data.parcel.ownerId,
              },
            ],
          });

          const result = {
            transId,
            parcelId: data.parcel.parcelNumber,
            titleVersion: data.parcel.titleVersion,
            sha: data.parcel.Sha,
            buyerId: data.buyerId,
          };
          // 5. Communicate with Fabric AFTER database transaction commits
          await this.fabric.initiateTransfer(
            result.transId,
            result.parcelId,
            result.titleVersion,
            result.sha,
            this.sha256(result.buyerId),
          );
        },
        {
          maxWait: 10000,
          timeout: 30000,
        },
      );

      return 'Transfer initiated';
    } catch (e) {
      console.error('Transfer failed:', e);

      throw new InternalServerErrorException(
        'An error occurred while initiating the transfer',
      );
    }
  }

  async Initialtitle(id: string) {
    try {
      const details = await this.GetParcelRecord(id);

      const result = await this.fabric.initiateTile({
        county: details.county,
        docType: 'TitleRecord',
        owner: details.ownerName,
        ownerNationalIdHash: this.sha256(details.ownerId),
        parcelNumber: details.parcelNumber,
        recordHash: details.sha256,
        size: String(details.size),
        status: details.status,
        tenuer: details.tenure,
        titleNumber: details.titleVersion,
        updatedAt: details.createdAt.toString(),
        updatedBy: details.createdAt.toString(),
        version: details.titleVersion,
      });

      return result;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('An Error occured');
    }
  }

  async SyncToBlockchain(){
    var records = await this.prisma.ownershipRecords
      .findMany({
        select: {
          landParcel : {
            select: {
              parcelNumber: true
            }
          }
        }
      });

      for (let index = 0; index < records.length; index++) {
        await this.Initialtitle(records[index].landParcel.parcelNumber);
      }
  }

  async GetBlockchainTitleRecord(id: string) {
    try {
      const res = await this.fabric.getTitleDetails(id);
      return res;
    } catch (e) {
      console.log(e);
      throw new BadRequestException('An error occured');
    }
  }

  sha256(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }
}
