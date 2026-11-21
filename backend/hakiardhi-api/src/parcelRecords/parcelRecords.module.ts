import { Module } from "@nestjs/common";
import { ParcelRecordsController } from "./parcelRecords.controller.js";
import { ParcelRecordsService } from "./parcelRecords.service.js";
import { FabricService } from "../fabric/fabric.service.js";

@Module({
    controllers: [ParcelRecordsController],
    providers: [ParcelRecordsService, FabricService],
    exports: [ParcelRecordsService]
})
export class ParcelRecordsModule{}