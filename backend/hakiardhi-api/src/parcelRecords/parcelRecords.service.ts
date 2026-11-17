import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { ParcelDetailsDto, parcelDto } from "./parcelrecords.types.js";

@Injectable()
export class ParcelRecordsService {

    constructor (private readonly prisma: PrismaService){}

    async GetParcelRecord(id: string){

        let a = await this.prisma.landParcels
            .findFirst({
                where: { parcelNumber: "id"},
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
                            }
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
            tenure: a?.tenure,
            titleVersion: true
        };
    }


    async SearchPercel(params: string): Promise<parcelDto[]>{
        const records = await this.prisma.landParcels
            .findMany({where: {parcelNumber: params}, select : {
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
                parcelId: value.parcelNumber,
                county: value.county,
                ownerName: value.ownershipRecords?.landOwner.name,
                parcelNumber: value.parcelNumber
            }
        })

        return l
    }


}