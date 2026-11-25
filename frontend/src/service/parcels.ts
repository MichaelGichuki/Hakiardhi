import api from "../api/axios";
import type {
  InitiatedTransferResult,
  ParcelDetailsDto,
  parcelDto,
  Uploadresponse,
  ValidateTamper,
} from "../types/parcels.type";

export const parcelRecords = {
  searchParcels: (search: string) =>
    api.get<parcelDto[]>("/parcelRecords", {
      params: {
        search,
      },
    }),
  getParcels: (id: string) =>
    api.get<ParcelDetailsDto>(`/parcelRecords/${encodeURIComponent(id)}`),
  validateTitle: (id: string) =>
    api.get<ValidateTamper>(`/parcelRecords/${encodeURIComponent(id)}`),
  uploadSupportDocuments: (type: string, data: FormData) =>
    api.post<Uploadresponse>(`/parcelRecords/upload-support`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: { type },
    }),
  initiateTransferPage: (data: InitiatedTransferResult) => api.post(`/parcelRecords/trasfer`, data)
  
};
