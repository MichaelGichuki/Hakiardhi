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

export type parcelDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    ownerName: string;
}

export type TransferType = 'Sale / Transfer' | 'Subdivision' | 'Succession / Transmission' | 'Charge / Leasehold Assignment'

export interface SupportingDocument {
  id: string
  docType: string
  fileName: string
  fileSizeLabel: string
  hashPreview: string
  verified: boolean
}

export interface InitiatedTransferResult {
  reference: string
  initiatedAt: string
  officerName: string
  registryOffice: string
  parcel: ParcelDetailsDto
  transferType: TransferType
  buyerName: string
  buyerId: string
  buyerPhone: string
  considerationKes: string
  consentChannel: 'Landowner Portal' | 'USSD (*483*55#)' | 'Both (Portal + USSD)'
  documents: SupportingDocument[]
  payloadDigest: string
  txId: string
}