import { Module } from "@nestjs/common";
import { ParcelRecordsController } from "./parcelRecords.controller.js";
import { ParcelRecordsService } from "./parcelRecords.service.js";
import { FabricService } from "../fabric/fabric.service.js";
import { AuthService } from "../auth/auth.service.js";
import { JwtService } from "@nestjs/jwt";

@Module({
    controllers: [ParcelRecordsController],
    providers: [ParcelRecordsService, FabricService, AuthService, JwtService],
    exports: [ParcelRecordsService]
})
export class ParcelRecordsModule{}