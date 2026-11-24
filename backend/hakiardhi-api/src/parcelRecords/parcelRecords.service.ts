import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { InitiatedTransferResult, ParcelDetailsDto, parcelDto } from "./parcelrecords.types.js";
import { FabricService } from "../fabric/fabric.service.js";
import { createHash, randomUUID } from "node:crypto";
import { AuthService } from "../auth/auth.service.js";

@Injectable()
export class ParcelRecordsService {

    constructor (private readonly prisma: PrismaService, 
        private readonly fabric: FabricService,
        private readonly auth: AuthService
    ){}

    async GetParcelRecord(id: string):Promise<ParcelDetailsDto>{
        let a = await this.prisma.landParcels
            .findFirst({
                where: { parcelNumber: {
                    equals: id,
                    mode: "insensitive"
                }},
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
                                    registration: true
                                }
                            },
                            landOwnerId: true,
                            titleNumber: true,
                            titleVersionNumber: true,
                            sha256: true,
                            registeredAt: true,
                            createdAt: true,
                            updateAt: true
                        }
                    }
                }
            });

        if(a == null){
            throw new NotFoundException('record not found');
        }


        let p : ParcelDetailsDto = {
            bdRecord: true,
            blockchainTransaction: true,
            county: a?.county,
            ownerName: a?.ownershipRecords?.landOwner.name ?? "",
            parcelId: a?.id,
            parcelNumber: a?.parcelNumber,
            registrationDate: a?.createdAt,
            Sha: 'true',
            size: a?.Size,
            tenure: 'Freehold',//a?.tenure?? 
            titleVersion: a?.ownershipRecords?.titleNumber ?? "",
            ledgerConfirmed: true,
            ownerId: a.ownershipRecords?.landOwnerId ?? "",
            ownerReg: a.ownershipRecords?.landOwner.registration ?? "",
            ownerPhone: a.ownershipRecords?.landOwner.phoneNumber ?? "",
            registrationArea: a.ownershipRecords?.registeredAt ?? "",
            sha256: a.ownershipRecords?.sha256 ?? "" ,
            status: "Acive",
            createdAt: a.ownershipRecords?.createdAt ?? new Date(),
            updateAt: a.ownershipRecords?.updateAt ?? new Date()
        };
        return p;
    }

    async SearchPercel(params: string): Promise<parcelDto[]>{
        const records = await this.prisma.landParcels
            .findMany({where: {parcelNumber: {
                contains: params,
                mode: "insensitive"
            }}, select : {
                parcelNumber: true,
                id: true,
                county: true,
                ownershipRecords: {
                    select: {
                        landOwner: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
            });

        const l = records.map<parcelDto>((value: any) => {
            return {
                parcelId: value.id,
                county: value.county,
                ownerName: value.ownershipRecords?.landOwner.name,
                parcelNumber: value.parcelNumber
            }
        })

        return l
    }

    async UpladSupportDocument(filename: string ,documentType: string){
        
        const document = await this.prisma.transferDocuments
            .create({
                data : {
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
                    fileName: true
                }
            })
        return document
    }

    async Transfer(data: InitiatedTransferResult, sesseionId: string){
        try {
            // chack if buyer landlord exist
            let buyerlandOwnerId =( await this.prisma.landOwner
                .findFirst({
                    where: {
                        registration: data.buyerId
                    },
                    select:{
                        id: true
                    }
                }))?.id;
            
            if (buyerlandOwnerId == null){
                // create landowner
                const landowner = await this.prisma.landOwner.create({
                    data: {
                        createdAt: Date.now().toString(),
                        name: data.buyerName,
                        phoneNumber: data.buyerPhone,
                        registration: data.buyerId,
                        id: randomUUID(),
                        updateAt: Date.now().toString()
                    }
                });
                buyerlandOwnerId = landowner["id"];
            }
    
            const actorId = await this.auth.getUserId(sesseionId)
            // add transaction history
            const transId = await this.prisma.transactionHistory
                .create({
                    data: {
                        id: randomUUID(),
                        action: "Transfer",
                        actorId: actorId,
                        cost: 0,
                        createdAt: Date.now.toString(),
                        refrerence: data.reference,
                        stage: 'LandOwnerApproval',
                        transactionType: data.transferType,
                        updateAt: Date.now().toString(),
                        buyerId: buyerlandOwnerId,
                        landOwnerId: data.parcel.ownerId,
                        landParcelId: data.parcel.parcelId
                    },
                    select: {
                        id: true
                    }
                });
    
            // add landlord request to authenticate
            await this.prisma.requestLogs
                .createMany({
                    data: [
                        {
                            createdAt: Date.now().toString(),
                            transactionId: transId.id,
                            id: randomUUID(),
                            updateat: Date.now().toString(),
                            status: null,
                            userId: data.parcel.ownerId
                        }
                    ]
                });

        } catch (e){
            console.log(e);
            throw new BadRequestException("An error occured");
        }


    }

    async Initialtitle(id: string) {
        try{
            const details = await this.GetParcelRecord(id);
    
            const result = await this.fabric.initiateTile({
                county: details.county,
                docType: "TitleRecord",
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
                version: details.titleVersion
            });
    
            return result;
        } catch (e) {
            console.log(e);
            throw new BadRequestException("An Error occured")
        }
    }

    async GetBlockchainTitleRecord(id: string){
        try{
            const res = await this.fabric.getTitleDetails(id);
            return res;
        } catch (e){
            console.log(e);
            throw new BadRequestException("An error occured");
        }
    }

    sha256(value: string): string {
        return createHash('sha256')
            .update(value, 'utf8')
            .digest('hex');
    }

}