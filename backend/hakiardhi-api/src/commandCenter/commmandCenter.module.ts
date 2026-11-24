import { Module } from "@nestjs/common";
import { CommandCenterController } from "./commandCenter.controller.js";
import { CommandCenterService } from "./commmandCenter.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

@Module({
    controllers: [
        CommandCenterController
    ],
    providers: [
        CommandCenterService, PrismaService
    ],
    exports: [CommandCenterService]
})
export class CommandCenterModule{}