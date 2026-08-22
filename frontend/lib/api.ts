import axios, { AxiosError, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { getToken } from "@/lib/auth";

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api", headers: { "Content-Type": "application/json" } });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status = 0, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type ApiFetchResponse<T> = {
  data: T;
  error?: ApiError;
};

export async function apiFetch<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const response: AxiosResponse = await api.request(config);

    if (response.data && typeof response.data === "object" && "data" in response.data) {
      return response.data.data as T;
    }

    return response.data as T;
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status ?? 0;

      if (status === 401 && typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-expired"));
      }

      const responseData = error.response?.data as { message?: string; error?: string } | undefined;
      throw new ApiError(
        responseData?.message ?? responseData?.error ?? error.message,
        status,
        error.response?.data,
      );
    }

    throw error;
  }
}
