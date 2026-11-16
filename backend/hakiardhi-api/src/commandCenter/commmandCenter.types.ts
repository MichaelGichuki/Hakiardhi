
export type CommandCenterResponse = {
    dashDetails : DashdetailsDto;
    processQueue: ProcessQueueDetails[],
    logs: logDetails[]
}

export type DashdetailsDto = {
    pendingtransfers : number;
    verifiedParecels : number;
    awaitingOwnerConcent : number;
    completedToday : number;
}

export type ProcessQueueDetails = {
    refernce: string;
    parcel: string;
    stage: string;
    priority: string;
}

export type logDetails = {
    log: string;
    refernce: string;
    role: string;
    time: string;
    status: string;
}