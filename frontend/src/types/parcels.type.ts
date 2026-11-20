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
    tenure: 'Freehold' | 'Leasehold';
    registrationDate: Date;
    size: number;
    ownerName: string;
    bdRecord: Boolean;
    Sha: string;
    blockchainTransaction: Boolean;
    titleVersion: string;
    ownerId: string;
    ownerPhone: string;
    registrationArea: string;
    status: string;
    sha256: string;
    ledgerConfirmed: boolean;
}