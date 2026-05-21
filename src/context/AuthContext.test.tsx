import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { useAuthStore } from "../store/useAuthStore";

const apiGetMock = vi.fn();

vi.mock("../services/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => apiGetMock(...args),
    post: vi.fn(),
  },
  isMustChangePasswordError: (error: any) =>
    error?.response?.data?.error?.code === "MUST_CHANGE_PASSWORD",
}));

function AuthProbe() {
  const { user, loading, login } = useAuth();
  if (loading) return <div>Loading</div>;
  return (
    <div>
      <div data-testid="user-email">{user?.username || "no-user"}</div>
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
    const { apiClient } = await import("../services/apiClient");
    vi.mocked(apiClient.post).mockRejectedValueOnce(loginError);

    fireEvent.click(screen.getByText("Login"));

    await waitFor(() => {
      expect(useAuthStore.getState().user?.must_change_password).toBe(true);
    });
  });
});
