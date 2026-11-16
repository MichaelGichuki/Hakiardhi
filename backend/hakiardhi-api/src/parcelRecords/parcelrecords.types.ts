export type ParcelDetailsDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    tenure: string;
    registrationDate: Date;
    size: number;
    ownerName: string;
    bdRecord: Boolean;
    Sha: Boolean;
    blockchainTransaction: Boolean;
    titleVersion: Boolean;
}

export type parcelDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    ownerName: string;
}