import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { TitleRecordOnChain, LandTransferOnChain, TitleStatus, TransferWorkflowStatus, VerificationResult } from './types';

@Info({ title: 'LandContract', description: 'Land record verification and transfer contract' })
export class LandContract extends Contract {

  @Transaction()
  public async initLedger(ctx: Context): Promise<void> {
    // Initial setup hook
  }

  @Transaction()
  public async registerInitialTitle(
    ctx: Context,
    parcelNumber: string,
    titleNumber: string,
    recordHash: string,
    ownerNationalIdHash: string
  ): Promise<void> {
    const key = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
    const existing = await ctx.stub.getState(key);
    if (existing && existing.length > 0) {
      throw new Error(`Parcel ${parcelNumber} is already registered on the ledger.`);
    }

    const titleRecord: TitleRecordOnChain = {
      docType: 'TitleRecord',
      parcelNumber,
      titleNumber,
      version: 1,
      recordHash,
      ownerNationalIdHash,
      status: TitleStatus.ACTIVE,
      updatedAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString(),
      updatedBy: ctx.clientIdentity.getID()
    };

    await ctx.stub.putState(key, Buffer.from(JSON.stringify(titleRecord)));
  }

  @Transaction()
  public async initiateTransfer(
    ctx: Context,
    transferId: string,
    parcelNumber: string,
    titleNumber: string,
    currentOwnerHash: string,
    buyerHash: string
  ): Promise<void> {
    const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
    const titleBytes = await ctx.stub.getState(titleKey);
    if (!titleBytes || titleBytes.length === 0) {
      throw new Error(`Parcel ${parcelNumber} does not exist.`);
    }

    const title: TitleRecordOnChain = JSON.parse(titleBytes.toString());
    if (title.status !== TitleStatus.ACTIVE) {
      throw new Error(`Parcel ${parcelNumber} is not ACTIVE (current: ${title.status}).`);
    }

    if (title.ownerNationalIdHash !== currentOwnerHash) {
      throw new Error(`Owner hash mismatch for parcel ${parcelNumber}.`);
    }

    const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
    const existingTransfer = await ctx.stub.getState(transferKey);
    if (existingTransfer && existingTransfer.length > 0) {
      throw new Error(`Transfer ${transferId} already exists.`);
    }

    title.status = TitleStatus.UNDER_TRANSFER;
    title.activeTransferId = transferId;
    await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(title)));

    const transfer: LandTransferOnChain = {
      docType: 'LandTransfer',
      transferId,
      parcelNumber,
      titleNumber,
      currentOwnerHash,
      buyerHash,
      workflowStatus: TransferWorkflowStatus.INITIATED,
      createdAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString()
    };

    await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
  }

  @Transaction()
  public async landownerRespond(
    ctx: Context,
    transferId: string,
    confirmed: boolean,
    method: 'WEB_PORTAL' | 'USSD'
  ): Promise<void> {
    const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
    const transferBytes = await ctx.stub.getState(transferKey);
    if (!transferBytes || transferBytes.length === 0) {
      throw new Error(`Transfer ${transferId} not found.`);
    }

    const transfer: LandTransferOnChain = JSON.parse(transferBytes.toString());
    if (transfer.workflowStatus !== TransferWorkflowStatus.INITIATED) {
      throw new Error(`Cannot respond: transfer status is ${transfer.workflowStatus}.`);
    }

    const titleKey = ctx.stub.createCompositeKey('TITLE', [transfer.parcelNumber]);
    const titleBytes = await ctx.stub.getState(titleKey);
    const title: TitleRecordOnChain = JSON.parse(titleBytes.toString());

    if (!confirmed) {
      transfer.workflowStatus = TransferWorkflowStatus.LANDOWNER_REJECTED;
      title.status = TitleStatus.ACTIVE;
      delete title.activeTransferId;
    } else {
      transfer.workflowStatus = TransferWorkflowStatus.LANDOWNER_CONFIRMED;
      transfer.landownerConfirmationMethod = method;
      transfer.landownerConfirmedAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    }

    await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
    await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(title)));
  }

  @Transaction()
  public async verifyDocuments(
    ctx: Context,
    transferId: string,
    notes: string
  ): Promise<void> {
    const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
    const transferBytes = await ctx.stub.getState(transferKey);
    if (!transferBytes || transferBytes.length === 0) {
      throw new Error(`Transfer ${transferId} not found.`);
    }

    const transfer: LandTransferOnChain = JSON.parse(transferBytes.toString());
    if (transfer.workflowStatus !== TransferWorkflowStatus.LANDOWNER_CONFIRMED) {
      throw new Error(`Cannot verify documents before landowner confirmation.`);
    }

    transfer.workflowStatus = TransferWorkflowStatus.DOCUMENTS_VERIFIED;
    transfer.officerVerifiedAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    transfer.verificationNotes = notes;

    await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
  }

  @Transaction()
  public async approveTransfer(
    ctx: Context,
    transferId: string,
    newTitleNumber: string,
    newRecordHash: string
  ): Promise<void> {
    const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
    const transferBytes = await ctx.stub.getState(transferKey);
    if (!transferBytes || transferBytes.length === 0) {
      throw new Error(`Transfer ${transferId} not found.`);
    }

    const transfer: LandTransferOnChain = JSON.parse(transferBytes.toString());
    if (transfer.workflowStatus !== TransferWorkflowStatus.DOCUMENTS_VERIFIED) {
      throw new Error(`Cannot approve: transfer must have verified documents.`);
    }

    const titleKey = ctx.stub.createCompositeKey('TITLE', [transfer.parcelNumber]);
    const currentTitleBytes = await ctx.stub.getState(titleKey);
    const currentTitle: TitleRecordOnChain = JSON.parse(currentTitleBytes.toString());

    const historyKey = ctx.stub.createCompositeKey('TITLE_HISTORY', [transfer.parcelNumber, currentTitle.version.toString()]);
    currentTitle.status = TitleStatus.SUPERSEDED;
    await ctx.stub.putState(historyKey, Buffer.from(JSON.stringify(currentTitle)));

    const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    const newTitle: TitleRecordOnChain = {
      docType: 'TitleRecord',
      parcelNumber: transfer.parcelNumber,
      titleNumber: newTitleNumber,
      version: currentTitle.version + 1,
      recordHash: newRecordHash,
      ownerNationalIdHash: transfer.buyerHash,
      status: TitleStatus.ACTIVE,
      updatedAt: timestamp,
      updatedBy: ctx.clientIdentity.getID()
    };

    transfer.workflowStatus = TransferWorkflowStatus.APPROVED;
    transfer.registrarApprovedAt = timestamp;

    await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(newTitle)));
    await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
  }

  @Transaction(false)
  @Returns('string')
  public async verifyRecord(
    ctx: Context,
    parcelNumber: string,
    calculatedDbHash: string
  ): Promise<string> {
    const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
    const titleBytes = await ctx.stub.getState(titleKey);
    if (!titleBytes || titleBytes.length === 0) {
      throw new Error(`Parcel ${parcelNumber} not found.`);
    }

    const title: TitleRecordOnChain = JSON.parse(titleBytes.toString());
    const isHashValid = (title.recordHash === calculatedDbHash);

    const result: VerificationResult = {
      parcelNumber: title.parcelNumber,
      titleNumber: title.titleNumber,
      version: title.version,
      status: title.status,
      isHashValid,
      onChainHash: title.recordHash,
      submittedHash: calculatedDbHash
    };

    return JSON.stringify(result);
  }

  @Transaction(false)
  @Returns('string')
  public async getTitle(ctx: Context, parcelNumber: string): Promise<string> {
    const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
    const titleBytes = await ctx.stub.getState(titleKey);
    if (!titleBytes || titleBytes.length === 0) {
      throw new Error(`Parcel ${parcelNumber} not found.`);
    }
    return titleBytes.toString();
  }
}
