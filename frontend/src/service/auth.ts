import api from "../api/axios";
import type { LoginRequest, LoginResponse, User } from "../types/auth.types";

export const authApi = {
  signin: (data: LoginRequest) => api.post<LoginResponse>("/auth/signin", data),

  signout: () => api.post("/auth/signout"),

  signup: () => api.post("/auth/signout"),

  refresh: () => api.post<{ accessToken: string }>("/auth/refresh"),

  getProfile: () => api.get<User>("/auth/profile"),
};
