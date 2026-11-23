import { Controller, Get, Param, Query } from "@nestjs/common";
import { ParcelRecordsService } from "./parcelRecords.service.js";


@Controller("parcelRecords")
export class ParcelRecordsController{

    constructor(private readonly parcelService: ParcelRecordsService){}


    
    @Get('')
    async SearchParcels(@Query('search') search: string){
        return this.parcelService.SearchPercel(search);
    }

    @Get("/test")
    async test(){
        return this.parcelService.test();
    }
    
    @Get(":id")
    async getParcelRecord(@Param("id")id: string){
        return this.parcelService.GetParcelRecord(id);
    }
}