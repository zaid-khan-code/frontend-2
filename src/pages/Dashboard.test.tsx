import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <svg>{children}</svg>,
  Pie: ({ children }: any) => <div>{children}</div>,
  Cell: () => null,
  BarChart: ({ children }: any) => <svg>{children}</svg>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  AreaChart: ({ children }: any) => <svg>{children}</svg>,
  Area: () => null,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    activeRole: "hr_executive",
    user: {
      username: "RA",
      email: "rabia.aslam.emp017@esspl.com.pk",
      role: "hr_executive",
    },
  }),
}));

vi.mock("../hooks/useEmployees", () => ({
  useEmployees: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("../hooks/useLeaves", () => ({
  useLeaves: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("../hooks/useDashboard", () => ({
  useDashboardMetrics: () => ({
    data: {
      total_employees: 0,
      present_today: 0,
      attendance_trend: [],
      headcount_trend: [],
      pending_actions: [],
      urgent_alerts: [],
      recent_activity: [],
      top_performers: [],
      upcoming_birthdays: [],
    },
  }),
}));

vi.mock("../hooks/useCalendarEvents", () => ({
  useCalendarEvents: () => ({ data: [] }),
}));

describe("Dashboard", () => {
  it("does not show prototype dashboard data for HR Executive users", () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/RA/)).toBeTruthy();
    expect(screen.getByText(/rabia.aslam.emp017@esspl.com.pk/)).toBeTruthy();
    expect(screen.getByText(/HR Executive/)).toBeTruthy();

    expect(screen.queryByText("Ahmed Ali")).toBeNull();
    expect(screen.queryByText("Usman Malik")).toBeNull();
    expect(screen.queryByText("Bilal Ahmed")).toBeNull();
    expect(screen.queryByText("Sara Khan")).toBeNull();
    expect(screen.queryByText(/Office Closure/)).toBeNull();
    expect(screen.queryByText(/Bank info missing/)).toBeNull();
    expect(screen.getByText("No live pending actions.")).toBeTruthy();
    expect(screen.getByText("No live urgent alerts.")).toBeTruthy();
  });
});
