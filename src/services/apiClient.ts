import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { getLocalIp, prewarmLocalIpDetection } from "../utils/getLocalIp";
import { getHostname, prewarmHostnameDetection } from "../utils/getHostname";
import { AUDIT_FEATURES } from "../config/audit";

// Use env var or fallback to absolute API URL
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const apiClient = axios.create({
  baseURL,
  withCredentials: true, // For httpOnly cookies
  headers: {
    "Content-Type": "application/json",
  },
});

const authSessionClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Pre-warm detection on module load
prewarmLocalIpDetection();
prewarmHostnameDetection();

export async function clearServerSessionSilently() {
  try {
    await authSessionClient.post("/auth/logout");
  } catch {
    // A missing or expired session is fine before login/logout.
  }
}

export function isMustChangePasswordError(error: any) {
  return error?.response?.data?.error?.code === "MUST_CHANGE_PASSWORD";
}

function routeToChangePassword() {
  if (window.location.pathname === "/change-password") return;
  window.history.replaceState({}, "", "/change-password");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// Request interceptor: Attach Bearer token and client identity headers
apiClient.interceptors.request.use(async (config) => {
  const url = config.url || "";
  const isPublicAuthRequest = url.endsWith("/auth/login");
  if (isPublicAuthRequest) {
    if (config.headers) delete config.headers.Authorization;
    return config;
  }

  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach client identity headers for audit logging
  if (config.headers) {
    if (AUDIT_FEATURES.sendPrivateIp) {
      const localIp = await getLocalIp();
      if (localIp) {
        config.headers["x-client-local-ip"] = localIp;
      }
    }
    if (AUDIT_FEATURES.sendHostname) {
      const hostname = await getHostname();
      if (hostname) {
        config.headers["x-client-hostname"] = hostname;
      }
    }
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
    const errorCode = data?.error?.code;

    if (status === 401) {
      // Clear auth state and redirect
      useAuthStore.getState().logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    } else if (status === 403 && errorCode === "MUST_CHANGE_PASSWORD") {
      useAuthStore.getState().setMustChangePassword(true);
      routeToChangePassword();
    } else if (status === 403) {
      console.error("Permission denied", data);
    }

    return Promise.reject(error);
  },
);