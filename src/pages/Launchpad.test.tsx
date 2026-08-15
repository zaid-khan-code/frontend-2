import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Launchpad from "./Launchpad";

const authMock = vi.hoisted(() => ({ user: { username: "admin" }, activeRole: "hr_manager" }));
const permissionMock = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: authMock.user,
    activeRole: authMock.activeRole,
    logout: vi.fn(),
  }),
}));

vi.mock("../store/useAuthStore", () => ({
  useAuthStore: (selector: (state: { hasPermission: (permission: string) => boolean }) => unknown) => selector({
    hasPermission: (permission: string) => permissionMock.permissions.has(permission),
  }),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

function renderLaunchpad(role = "hr_manager") {
  authMock.activeRole = role;
  return render(
    <MemoryRouter>
      <Launchpad />
    </MemoryRouter>,
  );
}

describe("Launchpad", () => {
  afterEach(() => {
    cleanup();
    permissionMock.permissions.clear();
    vi.unstubAllEnvs();
  });

  it("shows ERP module selector with HR module for all roles", () => {
    renderLaunchpad("hr_manager");

    expect(screen.getByText("Select a Module")).toBeTruthy();
    expect(screen.getByText("HR & Employee Management")).toBeTruthy();
  });

  it("shows coming soon badge for disabled modules", () => {
    renderLaunchpad("super_admin");

    expect(screen.getByText("HR & Employee Management")).toBeTruthy();
    expect(screen.getAllByText("Coming Soon").length).toBeGreaterThanOrEqual(2);
  });

  it("shows Project Management card only with its entitlement", () => {
    permissionMock.permissions.add("project_management.access");
    renderLaunchpad("hr_manager");

    expect(screen.getByText("Project Management")).toBeTruthy();

    cleanup();
    permissionMock.permissions.clear();
    renderLaunchpad("hr_manager");
    expect(screen.queryByText("Project Management")).toBeNull();
  });

  it("renders for employee role", () => {
    renderLaunchpad("employee");

    expect(screen.getByText("HR & Employee Management")).toBeTruthy();
    expect(screen.getByText("Select a Module")).toBeTruthy();
  });
});
