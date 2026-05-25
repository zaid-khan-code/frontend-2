import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

let activeRole = "hr_manager";

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      username: "manager@example.com",
      role: activeRole,
    },
    activeRole,
    logout: vi.fn(),
  }),
}));

vi.mock("../../context/DataContext", () => ({
  useData: () => ({
    allAttendanceToday: [],
    leaveRequests: [],
  }),
}));

vi.mock("../../context/ToastContext", () => ({
  useToastContext: () => ({
    showToast: vi.fn(),
  }),
}));

vi.mock("../../images/logo.png", () => ({
  default: "logo.png",
}));

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    activeRole = "hr_manager";
  });

  it("shows employee self-service links for role users who are also employees", () => {
    renderSidebar();

    expect(screen.getByText("My Workspace")).toBeTruthy();
    expect(screen.getByText("My Dashboard")).toBeTruthy();
    expect(screen.getByText("My Attendance")).toBeTruthy();
    expect(screen.getByText("My Leave")).toBeTruthy();
    expect(screen.getByText("My Penalties")).toBeTruthy();
    expect(screen.getByText("My Profile")).toBeTruthy();
  });

  it("does not show employee self-service links for super admin", () => {
    activeRole = "super_admin";

    renderSidebar();

    expect(screen.queryByText("My Workspace")).toBeNull();
  });
});
