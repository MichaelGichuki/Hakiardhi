import { Module } from "@nestjs/common";
import { CommandCenterController } from "./commandCenter.controller.js";
import { CommandCenterService } from "./commmandCenter.service.js";

@Module({
    controllers: [
        CommandCenterController
    ],
    providers: [
        CommandCenterService
    ],
    exports: [CommandCenterService]
})
export class CommandCenterModule{}