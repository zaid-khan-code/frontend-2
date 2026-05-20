import React, { createContext, useContext, ReactNode, useEffect } from "react";
import { useAuthStore, User as ZustandUser } from "../store/useAuthStore";
import { apiClient } from "../services/apiClient";

export interface User {
  username: string;
  name?: string;
  role: "super_admin" | "head_hr" | "branch_hr" | "department_hr" | "employee";
  employeeId?: string;
  branch?: string | null;
  departments?: string[];
  mustChangePassword?: boolean;
}

export type LoginResult =
  | { ok: true; mustChangePassword?: boolean }
  | { ok: false; error: string };

interface AuthContextType {
  user: User | null;
  activeRole:
    | "super_admin"
    | "head_hr"
    | "branch_hr"
    | "department_hr"
    | "employee";
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  switchRole: (
    role:
      | "super_admin"
      | "head_hr"
      | "branch_hr"
      | "department_hr"
      | "employee",
  ) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_DEBUG = import.meta.env.DEV;

function authLog(...args: unknown[]) {
  if (AUTH_DEBUG) console.log("[EMS Auth]", ...args);
}

// Ensure the user role maps correctly to the expected types
function mapRole(backendRole: string = ""): User["role"] {
  const normalized = backendRole.toLowerCase().trim();
  if (
    normalized === "super_admin" ||
    normalized === "superadmin" ||
    normalized === "admin"
  )
    return "super_admin";
  if (normalized === "head_hr" || normalized === "headoffice_hr")
    return "head_hr";
  if (normalized === "branch_hr") return "branch_hr";
  if (normalized === "department_hr" || normalized === "dept_hr")
    return "department_hr";
  if (normalized === "hr") return "head_hr";
  return "employee";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user: zUser,
    activeRole: zActiveRole,
    setAuth,
    setPermissions,
    setMustChangePassword,
    logout: zLogout,
  } = useAuthStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    // Attempt to restore session
    const initSession = async () => {
      try {
        // Fetch session
        const sessionRes = await apiClient.get("/auth/session");
        if (sessionRes.data?.success) {
          const udata = sessionRes.data.data;
          const existingEmail = zUser?.email || "";
          const existingEmployeeId = zUser?.employee_id;
          let roleName = zUser?.role_name || zUser?.role || "employee";

          // Fetch permissions (authoritative role_name)
          const permsRes = await apiClient.get("/auth/permissions");
          if (permsRes.data?.success) {
            const permData = permsRes.data.data || {};
            roleName = permData.role_name || roleName;
            setPermissions(permData.permissions || []);
          }

          // Refresh user data in store
          setAuth({
            email: udata.email || existingEmail,
            role: roleName || udata.role || "employee",
            role_name: roleName || udata.role,
            employee_id: udata.employee_id || existingEmployeeId,
            must_change_password: !!udata.must_change_password,
          });
          setMustChangePassword(!!udata.must_change_password);
        } else {
          zLogout();
        }
      } catch (err) {
        authLog("Session restore failed", err);
        zLogout();
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const heartbeat = setInterval(initSession, 5 * 60 * 1000);
    return () => clearInterval(heartbeat);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      authLog("POST /auth/login", { email: email.trim() });

      const res = await apiClient.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (res.data?.success) {
        const token = res.data.token;
        const udata = res.data.user || {};
        let roleName = udata.role_name || udata.role || "employee";
        const mustChangePassword = !!udata.must_change_password;

        // Fetch permissions right after login (authoritative role_name)
        try {
          const permsRes = await apiClient.get("/auth/permissions");
          if (permsRes.data?.success) {
            const permData = permsRes.data.data || {};
            roleName = permData.role_name || roleName;
            setPermissions(permData.permissions || []);
          }
        } catch (e) {
          authLog("Failed to load permissions after login", e);
        }

        setAuth(
          {
            email: udata.email || email.trim(),
            role: roleName,
            role_name: roleName,
            employee_id: udata.employee_id,
            must_change_password: mustChangePassword,
          },
          token,
        );

        setMustChangePassword(mustChangePassword);

        return { ok: true, mustChangePassword };
      } else {
        return { ok: false, error: "Login failed" };
      }
    } catch (e: any) {
      authLog("login exception", e);
      const errorMsg =
        e.response?.data?.error?.message ||
        e.response?.data?.message ||
        "Login failed";
      return { ok: false, error: errorMsg };
    }
  };

  const logout = () => {
    zLogout();
    // Also notify backend if needed
    apiClient.post("/auth/logout").catch(() => {});
  };

  const switchRole = (role: User["role"]) => {
    useAuthStore.getState().setActiveRole(role);
  };

  // Map Zustand user to the Legacy User object shape expected by UI
  let legacyUser: User | null = null;
  if (zUser) {
    legacyUser = {
      username: zUser.email,
      name: (zUser as any).name || zUser.email,
      role: mapRole(zUser.role),
      employeeId: zUser.employee_id,
      mustChangePassword: zUser.must_change_password,
    };
  }

  return (
    <AuthContext.Provider
      value={{
        user: legacyUser,
        activeRole: mapRole(zActiveRole),
        loading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
