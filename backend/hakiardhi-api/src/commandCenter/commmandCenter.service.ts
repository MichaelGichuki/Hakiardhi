import { Injectable } from "@nestjs/common";
import { CommandCenterResponse } from "./commmandCenter.types.js";

@Injectable()
export class CommandCenterService {

    CommandcenterDetails(): CommandCenterResponse{
        return {
            dashDetails: {
                awaitingOwnerConcent: 2,
                completedToday: 1,
                pendingtransfers: 0,
                verifiedParecels: 4
            },
            logs: [],
            processQueue: []
        }
    }

}