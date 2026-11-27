import { Controller, Cookies, Get, Query, Search } from "@nestjs/common";
import { CommandCenterService } from "./commmandCenter.service.js";
import { COOKIE_NAME } from "../auth/auth.controller.js";

@Controller('commandCenter')
export class CommandCenterController {

    constructor(private readonly commandCenterService: CommandCenterService){}

    @Get()
    GetDashdetails(){
        return this.commandCenterService.CommandcenterDetails()
    }

    @Get('/imutable-info')
    ImmutableInfo(){
        return this.commandCenterService.AuditTraial()
    }

    @Get('/transaction-history')
    TransactionHistory(@Query('search')search: string){
        return this.commandCenterService.TransactionHistory(search)
    }

    @Get('/landlord-dash')
    LandlordDash(@Cookies(COOKIE_NAME) refreshToken: string,){
        return this.commandCenterService.LandlordDash(refreshToken)
    }
    

}