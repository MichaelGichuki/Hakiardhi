import api from "../api/axios";
import type { CommandCenter } from "../types/commandService.types";
import type { AuditDash, TransactionHistory } from "../types/parcels.type";

export const commandService = {
    dashdetails: () => api.get<CommandCenter>('/commandCenter'),
    auditTrailDash: () => api.get<AuditDash>('/commandCenter/imutable-info'),
    transactionHistory: (search: string) => api.get<TransactionHistory[]>('/commandCenter/transaction-history', {
        params: {
            search
        }
    })
}