import api from "../api/axios";
import type { CommandCenter } from "../types/commandService.types";

export const commandService = {
    dashdetails: () => api.get<CommandCenter>('/commandCenter')
}