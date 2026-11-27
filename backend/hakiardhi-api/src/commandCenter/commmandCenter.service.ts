import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditDash,
  CommandCenterResponse,
  LandOwnerDash,
  ProcessQueueDetails,
  Request,
  TransactionHistory,
} from './commmandCenter.types.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { parcelDto } from '../parcelRecords/parcelrecords.types.js';

@Injectable()
export class CommandCenterService {
  constructor(private readonly prisma: PrismaService) {}

  async CommandcenterDetails(): Promise<CommandCenterResponse> {
    const verifiedParcels = await this.prisma.inspectionLog.count();
    const pending = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            not: 'Completed',
            mode: 'insensitive',
          },
        },
      })
    ).length;

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const startOfTomorrow = new Date(startOfToday);
    startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);
    const completedToday = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            contains: 'Completed',
            mode: 'insensitive',
          },
          updateAt: {
            gte: startOfToday,
            lt: startOfTomorrow,
          },
        },
      })
    ).length;

    const awaiting = (
      await this.prisma.requestLogs.findMany({
        where: {
          user: {
            role: {
              contains: 'Landowner',
            },
          },
          status: {
            equals: null,
          },
        },
      })
    ).length;

    const queue = (
      await this.prisma.transactionHistory.findMany({
        where: {
          stage: {
            not: 'Completed',
          },
        },
        select: {
          refrerence: true,
          landparcel: {
            select: {
              parcelNumber: true,
            },
          },
          stage: true,
        },
      })
    ).map<ProcessQueueDetails>((value) => ({
      parcel: value.landparcel.parcelNumber,
      priority: 'Low',
      refernce: value.refrerence,
      stage: value.stage,
    }));

    return {
      dashDetails: {
        awaitingOwnerConcent: awaiting,
        completedToday: completedToday,
        pendingtransfers: pending,
        verifiedParecels: verifiedParcels,
      },
      logs: [],
      processQueue: queue,
    };
  }

  async AuditTraial(): Promise<AuditDash> {
    const transactions = await this.prisma.transactionHistory.count();

    const intergrity = await this.prisma.inspectionLog.count({
      where: {
        verdict: {
          contains: 'tamper',
          mode: 'insensitive',
        },
      },
    });

    return {
      currentBlock: transactions / 4,
      integrityIssues: intergrity,
      ledgerTransactions: transactions,
      networkPeers: 4,
    };
  }

  async TransactionHistory(search: string): Promise<TransactionHistory[]> {
    const list = await this.prisma.transactionHistory.findMany({
      select: {
        actor: {
          select: {
            name: true,
          },
        },
        action: true,
        refrerence: true,
        stage: true,
        createdAt: true,
        id: true,
      },
      where: {
        actor: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        stage: {
          contains: search,
          mode: 'insensitive',
        },
      },
    });

    return list.map<TransactionHistory>((value) => ({
      action: value.action,
      actor: value.actor.name ?? '',
      reference: value.refrerence,
      status: value.stage,
      timestamp: value.createdAt,
      transactionsId: value.id,
    }));
  }

  async LandlordDash(refreshToken: string): Promise<LandOwnerDash> {
    const [sessionId, secret, ...extra] = refreshToken.split('.');

    if (!sessionId || !secret || extra.length > 0) {
      throw new BadRequestException('Invalid request');
    }

    const userId = (
      await this.prisma.session.findUnique({
        where: { id: sessionId },
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      })
    )?.user.id;

    if (userId == undefined) throw new BadRequestException('Invalid request');

    const completedRequest = await this.prisma.transactionHistory.count({
      where: {
        buyerId: {
          equals: userId,
        },
        stage: {
          contains: 'Complete',
          mode: 'insensitive',
        },
      },
    });
    const request = await this.prisma.requestLogs.findMany({
      where: {
        userId: {
          equals: userId,
        },
        status: {
          equals: null,
        },
      },
      select: {
        createdAt: true,
        id: true,
        transactionId: true,
        transaction: {
          select : {
            transactionType: true,
            landparcel: {
              select: {
                parcelNumber: true
              }
            },
            actor: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    const records = await this.prisma.landParcels.findMany({
      where: {
        ownershipRecords: {
          landOwnerId: {
            equals: userId,
          },
        },
      },
      select: {
        parcelNumber: true,
        id: true,
        county: true,
        ownershipRecords: {
          select: {
            landParcel: {
              select: {
                Size: true,
              }
            },
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
        size: value.landParcel.size
      };
    });

    const r = request.map<Request>((value) => ({
      applicationDate: value.createdAt,
      parcelNumber: value.transaction.landparcel.parcelNumber,
      ProposedBy: value.transaction.actor.name ?? "",
      requestId: value.id,
      transactionType: value.transaction.transactionType,
      transferId: value.transactionId      
    }))


    return {
      completedRequest: completedRequest,
      incommingRequest:r.length,
      properties: l.length,
      propertyList: l,
      request: r,
    };
  }
}
