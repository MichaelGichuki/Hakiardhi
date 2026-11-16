import { Module } from "@nestjs/common";
import { ParcelRecordsController } from "./parcelRecords.controller.js";
import { ParcelRecordsService } from "./parcelRecords.service.js";

@Module({
    controllers: [ParcelRecordsController],
    providers: [ParcelRecordsService],
    exports: [ParcelRecordsService]
})
export class ParcelRecordsModule{}