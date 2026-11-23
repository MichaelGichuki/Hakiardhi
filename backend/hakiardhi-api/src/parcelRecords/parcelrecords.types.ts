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
    createdAt: Date;
    updateAt: Date;
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

export enum TitleStatus {
  ACTIVE = 'ACTIVE',
  UNDER_TRANSFER = 'UNDER_TRANSFER',
  SUPERSEDED = 'SUPERSEDED',
  REVOKED = 'REVOKED'
}

export interface TitleRecordOnChain {
  docType: 'TitleRecord';
  parcelNumber: string;
  titleNumber: string;
  version: string;
  recordHash: string;
  ownerNationalIdHash: string;
  owner: string;
  size: string;
  county: string;
  tenuer: string;
  status: string;
  activeTransferId?: string;
  updatedAt: string;
  updatedBy: string;
}