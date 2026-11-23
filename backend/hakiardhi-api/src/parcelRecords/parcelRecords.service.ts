import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { InitiatedTransferResult, ParcelDetailsDto, parcelDto } from "./parcelrecords.types.js";
import { FabricService } from "../fabric/fabric.service.js";
import { randomUUID } from "node:crypto";
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
                                    name: true
                                }
                            },
                            landOwnerId: true,
                            titleNumber: true,
                            titleVersionNumber: true
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
            ownerPhone: '',
            registrationArea: '',
            sha256: '',
            status: ''
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

    async Transfer(data: InitiatedTransferResult, sesseionId: string){
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
                    landOwnerId: data.parcel.ownerId
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


    }


    async Initialtitle(id: string) {
        const details = await this.GetParcelRecord(id);
        this.fabric.initiateTile({
            county: details.county,
            docType: "TitleRecord",
            owner: details.ownerName,
            ownerNationalIdHash: "",
            parcelNumber: "",
            recordHash: "",
            size: String(details.size),
            status: "",
            tenuer: "",
            titleNumber: details.titleVersion,
            updatedAt: "",
            updatedBy: "",
            version: details.titleVersion
        })
    }

}