export declare enum TitleStatus {
    ACTIVE = "ACTIVE",
    UNDER_TRANSFER = "UNDER_TRANSFER",
    SUPERSEDED = "SUPERSEDED",
    REVOKED = "REVOKED"
}
export declare enum TransferWorkflowStatus {
    INITIATED = "INITIATED",
    LANDOWNER_CONFIRMED = "LANDOWNER_CONFIRMED",
    LANDOWNER_REJECTED = "LANDOWNER_REJECTED",
    DOCUMENTS_VERIFIED = "DOCUMENTS_VERIFIED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export interface TitleRecordOnChain {
    docType: 'TitleRecord';
    parcelNumber: string;
    titleNumber: string;
    version: number;
    recordHash: string;
    ownerNationalIdHash: string;
    status: TitleStatus;
    activeTransferId?: string;
    updatedAt: string;
    updatedBy: string;
}
export interface LandTransferOnChain {
    docType: 'LandTransfer';
    transferId: string;
    parcelNumber: string;
    titleNumber: string;
    currentOwnerHash: string;
    buyerHash: string;
    workflowStatus: TransferWorkflowStatus;
    landownerConfirmationMethod?: 'WEB_PORTAL' | 'USSD';
    landownerConfirmedAt?: string;
    officerVerifiedAt?: string;
    verificationNotes?: string;
    registrarApprovedAt?: string;
    rejectionReason?: string;
    createdAt: string;
}
export interface VerificationResult {
    parcelNumber: string;
    titleNumber: string;
    version: number;
    status: TitleStatus;
    isHashValid: boolean;
    onChainHash: string;
    submittedHash: string;
}
//# sourceMappingURL=types.d.ts.map