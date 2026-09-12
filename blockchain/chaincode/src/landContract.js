"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandContract = void 0;
const fabric_contract_api_1 = require("fabric-contract-api");
const types_1 = require("./types");
@(0, fabric_contract_api_1.Info)({ title: 'LandContract', description: 'Land record verification and transfer contract' })
class LandContract extends fabric_contract_api_1.Contract {
    @(0, fabric_contract_api_1.Transaction)()
    async initLedger(ctx) {
        // Initial setup hook
    }
    @(0, fabric_contract_api_1.Transaction)()
    async registerInitialTitle(ctx, parcelNumber, titleNumber, recordHash, ownerNationalIdHash) {
        const key = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
        const existing = await ctx.stub.getState(key);
        if (existing && existing.length > 0) {
            throw new Error(`Parcel ${parcelNumber} is already registered on the ledger.`);
        }
        const titleRecord = {
            docType: 'TitleRecord',
            parcelNumber,
            titleNumber,
            version: 1,
            recordHash,
            ownerNationalIdHash,
            status: types_1.TitleStatus.ACTIVE,
            updatedAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString(),
            updatedBy: ctx.clientIdentity.getID()
        };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(titleRecord)));
    }
    @(0, fabric_contract_api_1.Transaction)()
    async initiateTransfer(ctx, transferId, parcelNumber, titleNumber, currentOwnerHash, buyerHash) {
        const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
        const titleBytes = await ctx.stub.getState(titleKey);
        if (!titleBytes || titleBytes.length === 0) {
            throw new Error(`Parcel ${parcelNumber} does not exist.`);
        }
        const title = JSON.parse(titleBytes.toString());
        if (title.status !== types_1.TitleStatus.ACTIVE) {
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
        title.status = types_1.TitleStatus.UNDER_TRANSFER;
        title.activeTransferId = transferId;
        await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(title)));
        const transfer = {
            docType: 'LandTransfer',
            transferId,
            parcelNumber,
            titleNumber,
            currentOwnerHash,
            buyerHash,
            workflowStatus: types_1.TransferWorkflowStatus.INITIATED,
            createdAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString()
        };
        await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
    }
    @(0, fabric_contract_api_1.Transaction)()
    async landownerRespond(ctx, transferId, confirmed, method) {
        const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
        const transferBytes = await ctx.stub.getState(transferKey);
        if (!transferBytes || transferBytes.length === 0) {
            throw new Error(`Transfer ${transferId} not found.`);
        }
        const transfer = JSON.parse(transferBytes.toString());
        if (transfer.workflowStatus !== types_1.TransferWorkflowStatus.INITIATED) {
            throw new Error(`Cannot respond: transfer status is ${transfer.workflowStatus}.`);
        }
        const titleKey = ctx.stub.createCompositeKey('TITLE', [transfer.parcelNumber]);
        const titleBytes = await ctx.stub.getState(titleKey);
        const title = JSON.parse(titleBytes.toString());
        if (!confirmed) {
            transfer.workflowStatus = types_1.TransferWorkflowStatus.LANDOWNER_REJECTED;
            title.status = types_1.TitleStatus.ACTIVE;
            delete title.activeTransferId;
        }
        else {
            transfer.workflowStatus = types_1.TransferWorkflowStatus.LANDOWNER_CONFIRMED;
            transfer.landownerConfirmationMethod = method;
            transfer.landownerConfirmedAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        }
        await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
        await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(title)));
    }
    @(0, fabric_contract_api_1.Transaction)()
    async verifyDocuments(ctx, transferId, notes) {
        const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
        const transferBytes = await ctx.stub.getState(transferKey);
        if (!transferBytes || transferBytes.length === 0) {
            throw new Error(`Transfer ${transferId} not found.`);
        }
        const transfer = JSON.parse(transferBytes.toString());
        if (transfer.workflowStatus !== types_1.TransferWorkflowStatus.LANDOWNER_CONFIRMED) {
            throw new Error(`Cannot verify documents before landowner confirmation.`);
        }
        transfer.workflowStatus = types_1.TransferWorkflowStatus.DOCUMENTS_VERIFIED;
        transfer.officerVerifiedAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        transfer.verificationNotes = notes;
        await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
    }
    @(0, fabric_contract_api_1.Transaction)()
    async approveTransfer(ctx, transferId, newTitleNumber, newRecordHash) {
        const transferKey = ctx.stub.createCompositeKey('TRANSFER', [transferId]);
        const transferBytes = await ctx.stub.getState(transferKey);
        if (!transferBytes || transferBytes.length === 0) {
            throw new Error(`Transfer ${transferId} not found.`);
        }
        const transfer = JSON.parse(transferBytes.toString());
        if (transfer.workflowStatus !== types_1.TransferWorkflowStatus.DOCUMENTS_VERIFIED) {
            throw new Error(`Cannot approve: transfer must have verified documents.`);
        }
        const titleKey = ctx.stub.createCompositeKey('TITLE', [transfer.parcelNumber]);
        const currentTitleBytes = await ctx.stub.getState(titleKey);
        const currentTitle = JSON.parse(currentTitleBytes.toString());
        const historyKey = ctx.stub.createCompositeKey('TITLE_HISTORY', [transfer.parcelNumber, currentTitle.version.toString()]);
        currentTitle.status = types_1.TitleStatus.SUPERSEDED;
        await ctx.stub.putState(historyKey, Buffer.from(JSON.stringify(currentTitle)));
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        const newTitle = {
            docType: 'TitleRecord',
            parcelNumber: transfer.parcelNumber,
            titleNumber: newTitleNumber,
            version: currentTitle.version + 1,
            recordHash: newRecordHash,
            ownerNationalIdHash: transfer.buyerHash,
            status: types_1.TitleStatus.ACTIVE,
            updatedAt: timestamp,
            updatedBy: ctx.clientIdentity.getID()
        };
        transfer.workflowStatus = types_1.TransferWorkflowStatus.APPROVED;
        transfer.registrarApprovedAt = timestamp;
        await ctx.stub.putState(titleKey, Buffer.from(JSON.stringify(newTitle)));
        await ctx.stub.putState(transferKey, Buffer.from(JSON.stringify(transfer)));
    }
    @(0, fabric_contract_api_1.Transaction)(false)
    @(0, fabric_contract_api_1.Returns)('string')
    async verifyRecord(ctx, parcelNumber, calculatedDbHash) {
        const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
        const titleBytes = await ctx.stub.getState(titleKey);
        if (!titleBytes || titleBytes.length === 0) {
            throw new Error(`Parcel ${parcelNumber} not found.`);
        }
        const title = JSON.parse(titleBytes.toString());
        const isHashValid = (title.recordHash === calculatedDbHash);
        const result = {
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
    @(0, fabric_contract_api_1.Transaction)(false)
    @(0, fabric_contract_api_1.Returns)('string')
    async getTitle(ctx, parcelNumber) {
        const titleKey = ctx.stub.createCompositeKey('TITLE', [parcelNumber]);
        const titleBytes = await ctx.stub.getState(titleKey);
        if (!titleBytes || titleBytes.length === 0) {
            throw new Error(`Parcel ${parcelNumber} not found.`);
        }
        return titleBytes.toString();
    }
}
exports.LandContract = LandContract;
//# sourceMappingURL=landContract.js.map