import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id?: string;
  employee_id?: string;
  email: string;
  role: string;
  role_name?: string;
  must_change_password?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  activeRole: string; // Used for UI simulation/testing if needed, but normally just user.role

  setAuth: (user: User, token?: string) => void;
  setPermissions: (permissions: string[]) => void;
  setMustChangePassword: (mustChange: boolean) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isRole: (role: string) => boolean;
  setActiveRole: (role: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      activeRole: "employee", // default fallback

      setAuth: (user, token) => {
        set((state) => ({
          user,
          token: token || state.token,
          isAuthenticated: true,
          activeRole: user.role_name || user.role || "employee",
        }));
      },

      setPermissions: (permissions) => {
        set({ permissions });
      },

      setMustChangePassword: (mustChange) => {
        set((state) => ({
          user: state.user
            ? { ...state.user, must_change_password: mustChange }
            : state.user,
        }));
      },

      logout: () => {
        set({
          user: null,
          token: null,
          permissions: [],
          isAuthenticated: false,
          activeRole: "employee",
        });
        // Also clear any legacy items
        localStorage.removeItem("ems_user");
        localStorage.removeItem("ems_token");
      },

      hasPermission: (permission) => {
        const { permissions, user } = get();
        if (user?.role === "super_admin") return true; // super_admin bypasses all
        return permissions.includes(permission);
      },

      isRole: (role) => {
        const { user } = get();
        return user?.role === role || user?.role_name === role;
      },

      setActiveRole: (role) => {
        set({ activeRole: role });
      },
    }),
    {
      name: "auth-storage", // unique name
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
        activeRole: state.activeRole,
      }), // Save these fields to localStorage
    },
  ),
);
