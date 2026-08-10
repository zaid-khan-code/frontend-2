import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import Launchpad from "./Launchpad";

const authMock = vi.hoisted(() => ({ activeRole: "hr_manager" }));
const permissionMock = vi.hoisted(() => ({ permissions: new Set<string>() }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ activeRole: authMock.activeRole }),
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

  it("shows launchable modules for hr_manager roles", () => {
    renderLaunchpad("hr_manager");

    expect(screen.getByText("HR Dashboard")).toBeTruthy();
    expect(screen.getByText("Attendance")).toBeTruthy();
    expect(screen.getByText("Employees")).toBeTruthy();
    expect(screen.getByText("Penalty Workflow")).toBeTruthy();
  });

  it("shows launchable modules for hr_executive roles", () => {
    renderLaunchpad("hr_executive");

    expect(screen.getByText("Attendance")).toBeTruthy();
    expect(screen.getByText("Employees")).toBeTruthy();
    expect(screen.getByText("Announcements")).toBeTruthy();
  });

  it("shows a same-origin Project Management portal link only with its entitlement", () => {
    vi.stubEnv("VITE_PROJECT_MANAGEMENT_URL", "");
    permissionMock.permissions.add("project_management.access");
    renderLaunchpad("hr_manager");

    const link = screen.getByRole("link", { name: /Project Management/i });
    expect(link.getAttribute("href")).toBe("/project-management");
    expect(link.getAttribute("href")).not.toContain("token");

    cleanup();
    permissionMock.permissions.clear();
    renderLaunchpad("hr_manager");
    expect(screen.queryByRole("link", { name: /Project Management/i })).toBeNull();
  });

  it("supports a development PMS origin without changing the production default", () => {
    vi.stubEnv("VITE_PROJECT_MANAGEMENT_URL", "http://127.0.0.1:5173/");
    permissionMock.permissions.add("project_management.access");
    renderLaunchpad("hr_manager");

    expect(screen.getByRole("link", { name: /Project Management/i }).getAttribute("href"))
      .toBe("http://127.0.0.1:5173/");
  });
});
