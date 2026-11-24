import api from "../api/axios";
import type {
  ParcelDetailsDto,
  parcelDto,
  Uploadresponse,
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
  uploadSupportDocuments: (type: string, data: FormData) =>
    api.post<Uploadresponse>(`/parcelRecords/upload-support`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      params: { type },
    }),
};
