import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, mapRole, useAuth } from "./AuthContext";
import { useAuthStore } from "../store/useAuthStore";

const apiGetMock = vi.fn();
const apiPostMock = vi.fn();
const clearServerSessionSilentlyMock = vi.fn();

vi.mock("../services/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: (...args: unknown[]) => apiPostMock(...args),
  },
  clearServerSessionSilently: (...args: unknown[]) =>
    clearServerSessionSilentlyMock(...args),
  isMustChangePasswordError: (error: any) =>
    error?.response?.data?.error?.code === "MUST_CHANGE_PASSWORD",
}));

function AuthProbe() {
  const { user, activeRole, loading, login } = useAuth();
  if (loading) return <div>Loading</div>;
  return (
    <div>
      <div data-testid="user-email">{user?.username || "no-user"}</div>
      <div data-testid="user-role">{user?.role || "no-role"}</div>
      <div data-testid="active-role">{activeRole}</div>
      <div data-testid="employee-id">{user?.employeeId || "no-employee-id"}</div>
      <div data-testid="must-change">
        {user?.mustChangePassword ? "yes" : "no"}
      </div>
      <button
        type="button"
        onClick={() => {
          login("new.employee@example.com", "Temp@123!");
        }}
      >
        Login
      </button>
    </div>
  );
}

describe("AuthProvider session restore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearServerSessionSilentlyMock.mockResolvedValue(undefined);
    useAuthStore.setState({
      user: {
        email: "new.employee@example.com",
        role: "employee",
        role_name: "employee",
        employee_id: "EMP001",
        must_change_password: true,
      },
      token: "new-employee-token",
      permissions: [],
      isAuthenticated: true,
      activeRole: "employee",
    });
  });

  it("keeps a new employee session when session endpoint requires password change", async () => {
    apiGetMock.mockRejectedValue({
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "MUST_CHANGE_PASSWORD",
            message: "Password must be changed before continuing.",
          },
        },
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-email").textContent).toBe(
        "new.employee@example.com",
      );
    });
    expect(screen.getByTestId("must-change").textContent).toBe("yes");
  });

  it("creates a password-change session when only the cookie-backed session remains", async () => {
    useAuthStore.setState({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      activeRole: "employee",
    });
    apiGetMock.mockRejectedValue({
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "MUST_CHANGE_PASSWORD",
            message: "Password must be changed before continuing.",
          },
        },
      },
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("must-change").textContent).toBe("yes");
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("treats a login MUST_CHANGE_PASSWORD response as a forced password-change session", async () => {
    useAuthStore.setState({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      activeRole: "employee",
    });
    apiGetMock.mockResolvedValue({ data: { success: false } });
    const { fireEvent } = await import("@testing-library/react");

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeTruthy();
    });

    const loginError = {
      response: {
        status: 403,
        data: {
          success: false,
          error: {
            code: "MUST_CHANGE_PASSWORD",
            message: "Password must be changed before continuing.",
          },
        },
      },
    };
    apiPostMock.mockRejectedValueOnce(loginError);

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.must_change_password).toBe(true);
    });
  });

  it("prefers backend role_name over stale persisted role for the UI user", async () => {
    useAuthStore.setState({
      user: {
        email: "hr.manager@example.com",
        role: "employee",
        role_name: "hr_manager",
        employee_id: "EMP004",
        must_change_password: false,
      },
      token: "hr-manager-token",
      permissions: [],
      isAuthenticated: true,
      activeRole: "hr_manager",
    });
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            email: "hr.manager@example.com",
            employee_id: "EMP004",
            must_change_password: false,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            role_name: "hr_manager",
            permissions: ["view_dashboard"],
          },
        },
      });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("user-role").textContent).toBe("hr_manager");
    });
    expect(screen.getByTestId("active-role").textContent).toBe("hr_manager");
  });

  it("clears any stale browser session before posting new login credentials", async () => {
    useAuthStore.setState({
      user: null,
      token: "stale-token",
      permissions: [],
      isAuthenticated: false,
      activeRole: "employee",
    });
    apiGetMock.mockResolvedValue({ data: { success: false } });
    apiPostMock.mockResolvedValueOnce({
      data: {
        success: true,
        token: "fresh-token",
        user: {
          email: "superadmin@esspl.com.pk",
          role_name: "super_admin",
          must_change_password: false,
        },
      },
    });
    const { fireEvent } = await import("@testing-library/react");

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("Login")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/auth/login", {
        email: "new.employee@example.com",
        password: "Temp@123!",
      });
    });
    expect(clearServerSessionSilentlyMock).toHaveBeenCalledTimes(1);
    expect(clearServerSessionSilentlyMock.mock.invocationCallOrder[0]).toBeLessThan(
      apiPostMock.mock.invocationCallOrder[0],
    );
  });

  it("restores employee id from nested session employee data", async () => {
    useAuthStore.setState({
      user: null,
      token: "employee-token",
      permissions: [],
      isAuthenticated: true,
      activeRole: "employee",
    });
    apiGetMock
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            email: "employee@example.com",
            employee: {
              employee_id: "EMP777",
            },
            must_change_password: false,
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            role_name: "employee",
            permissions: ["view_own_profile"],
          },
        },
      });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("employee-id").textContent).toBe("EMP777");
    });
  });
});

describe("mapRole", () => {
  it("preserves backend HR roles used by demo accounts", () => {
    expect(mapRole("hr_manager")).toBe("hr_manager");
    expect(mapRole("HR Manager")).toBe("hr_manager");
    expect(mapRole("hr_executive")).toBe("hr_executive");
    expect(mapRole("HR Executive")).toBe("hr_executive");
    expect(mapRole("department_head")).toBe("department_head");
    expect(mapRole("Department Head")).toBe("department_head");
    expect(mapRole("super_admin")).toBe("super_admin");
  });
});
