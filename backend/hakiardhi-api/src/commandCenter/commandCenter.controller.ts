import { Controller, Get } from "@nestjs/common";
import { CommandCenterService } from "./commmandCenter.service.js";

@Controller('commandCenter')
export class CommandCenterController {

    constructor(private readonly commandCenterService: CommandCenterService){}

    @Get()
    GetDashdetails(){
        return this.commandCenterService.CommandcenterDetails()
    }

    

}