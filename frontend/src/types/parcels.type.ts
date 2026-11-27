export type parcelDto = {
    parcelId: string;
    parcelNumber: string;
    county: string;
    ownerName: string;
    size?: number
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
    ownerReg: string;
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

export interface Uploadresponse {
  id : string;
  documentHash : string;
  fileName : string;
}

export interface ParcelIntegrityRecord {
  parcelNumber: string;
  owner: string;
  size: string;
  county: string;
  registrationArea: string;
  tenure: "Freehold" | "Leasehold";
  titleVersion: string;
  lastVerified: string;
  anchoredSha256: string;
  txId: string;
}

export type ValidateTamper = {
  bdRecord: ParcelIntegrityRecord;
  anchorRecord: ParcelIntegrityRecord;
}

export type Request = {
  requestId: string;
  transferId: string;
  parcelNumber: string;
  ProposedBy: string;
  transactionType: string;
  applicationDate: Date;
}

export type LandOwnerDash = {
  properties: number;
  incommingRequest: number;
  completedRequest: number;
  propertyList: parcelDto[];
  request: Request[]
}

export type TransactionHistory = {
  timestamp: Date;
  actor: string;
  action: string;
  reference: string;
  transactionsId: string;
  status: string;
}

export type AuditDash = {
  ledgerTransactions: number;
  currentBlock: number;
  networkPeers: number;
  integrityIssues: number;
}