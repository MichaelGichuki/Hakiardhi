import { Context, Contract } from 'fabric-contract-api';
export declare class LandContract extends Contract {
    initLedger(ctx: Context): Promise<void>;
    registerInitialTitle(ctx: Context, parcelNumber: string, titleNumber: string, recordHash: string, ownerNationalIdHash: string): Promise<void>;
    initiateTransfer(ctx: Context, transferId: string, parcelNumber: string, titleNumber: string, currentOwnerHash: string, buyerHash: string): Promise<void>;
    landownerRespond(ctx: Context, transferId: string, confirmed: boolean, method: 'WEB_PORTAL' | 'USSD'): Promise<void>;
    verifyDocuments(ctx: Context, transferId: string, notes: string): Promise<void>;
    approveTransfer(ctx: Context, transferId: string, newTitleNumber: string, newRecordHash: string): Promise<void>;
    verifyRecord(ctx: Context, parcelNumber: string, calculatedDbHash: string): Promise<string>;
    getTitle(ctx: Context, parcelNumber: string): Promise<string>;
}
//# sourceMappingURL=landContract.d.ts.map