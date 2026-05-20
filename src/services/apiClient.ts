import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Use env var or fallback to absolute API URL
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // For httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Attach Bearer token if available
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle global errors like 401, 403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If not an axios error or no response, return rejection
    if (!error.response) {
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    if (status === 401) {
      // Clear auth state and redirect
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      console.error("Permission denied", data);
      if (window.location.pathname !== "/unauthorized") {
        window.location.href = "/unauthorized";
      }
    }

    return Promise.reject(error);
  },
);
