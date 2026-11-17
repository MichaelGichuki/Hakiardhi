export type parcelDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    ownerName: string;
}

export type ParcelDetailsDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    tenure: string;
    registrationDate: Date;
    size: number;
    ownerName: string;
    bdRecord: Boolean;
    Sha: string;
    blockchainTransaction: Boolean;
    titleVersion: Boolean;
}