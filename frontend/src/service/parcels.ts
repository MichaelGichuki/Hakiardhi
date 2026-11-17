import api from "../api/axios";
import type { parcelDto } from "../types/parcels.type";

export const parcelRecords = {
    searchParcels: (search: string) => api.get<parcelDto[]>("/parcelRecords", {
        params: {
            search
        }
    }),

    getParcels: (id: string) => api.get<parcelDto[]>(`/parcelRecords/${id}`),
} 