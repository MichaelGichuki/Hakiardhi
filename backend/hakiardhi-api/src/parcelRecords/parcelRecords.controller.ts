import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParcelRecordsService } from "./parcelRecords.service.js";


@Controller("parcelRecords")
export class ParcelRecordsController{

    constructor(private readonly parcelService: ParcelRecordsService){}


    @Get(":id")
    async getParcelRecord(@Param("id")id: string){
        return this.parcelService.GetParcelRecord(id);
    }

    @Get('')
    async SearchParcels(@Query('search') search: string){
        return this.parcelService.SearchPercel(search);
    }

}