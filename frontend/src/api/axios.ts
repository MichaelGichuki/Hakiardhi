
import axios, {
  AxiosError,
  type InternalAxiosRequestConfig
} from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

interface RefreshResponse {
  accessToken: string;
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach access token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  }
);

// Prevent multiple simultaneous refresh requests
let refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post<RefreshResponse>(
            `${BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          )
          .then((response) => {
            const token = response.data.accessToken;

            localStorage.setItem("accessToken", token);

            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return api(originalRequest);

    } catch (refreshError) {
      localStorage.removeItem("accessToken");
      
      if(window.location.pathname !== "/"){
        window.location.href = "/";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default api;
