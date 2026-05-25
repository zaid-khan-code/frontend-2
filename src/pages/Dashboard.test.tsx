import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Dashboard from "./Dashboard";

const mockState = vi.hoisted(() => ({
  employees: [] as any[],
  metrics: {
    total_employees: 0,
    present_today: 0,
    attendance_trend: [] as any[],
    headcount_trend: [] as any[],
    pending_actions: [] as any[],
    urgent_alerts: [] as any[],
    recent_activity: [] as any[],
    top_performers: [] as any[],
    upcoming_birthdays: [] as any[],
  },
}));

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
  useEmployees: () => ({
    data: mockState.employees,
    isLoading: false,
    isError: false,
  }),
}));

vi.mock("../hooks/useLeaves", () => ({
  useLeaves: () => ({ data: [], isLoading: false, isError: false }),
}));

vi.mock("../hooks/useDashboard", () => ({
  useDashboardMetrics: () => ({
    data: mockState.metrics,
  }),
}));

vi.mock("../hooks/useCalendarEvents", () => ({
  useCalendarEvents: () => ({ data: [] }),
}));

describe("Dashboard", () => {
  beforeEach(() => {
    mockState.employees = [];
    mockState.metrics = {
      total_employees: 0,
      present_today: 0,
      attendance_trend: [],
      headcount_trend: [],
      pending_actions: [],
      urgent_alerts: [],
      recent_activity: [],
      top_performers: [],
      upcoming_birthdays: [],
    };
  });

  it("does not show prototype dashboard data for HR Executive users", () => {
    mockState.employees = [
      {
        id: "EMP017",
        name: "Rabia Aslam",
        email: "rabia.aslam.emp017@esspl.com.pk",
        department: "Human Resources",
      },
    ];

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Rabia Aslam/)).toBeTruthy();
    expect(screen.queryByText(/rabia.aslam.emp017@esspl.com.pk/)).toBeNull();
    expect(screen.getByText(/HR Executive/)).toBeTruthy();

    expect(screen.queryByText("Ahmed Ali")).toBeNull();
    expect(screen.queryByText("Usman Malik")).toBeNull();
    expect(screen.queryByText("Bilal Ahmed")).toBeNull();
    expect(screen.queryByText("Sara Khan")).toBeNull();
    expect(screen.queryByText(/Office Closure/)).toBeNull();
    expect(screen.queryByText(/Bank info missing/)).toBeNull();
    expect(screen.getByText("No live pending actions.")).toBeTruthy();
    expect(screen.getByText("No live urgent alerts.")).toBeTruthy();
    expect(screen.queryByText("Staff Retention")).toBeNull();
  });

  it("renders only backend-supported KPI cards with clear periods", () => {
    mockState.metrics = {
      ...mockState.metrics,
      attendance_rate_percent: 91,
      leave_utilization_percent: 25,
      on_time_percent: 84,
    };

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Attendance Rate")).toBeTruthy();
    expect(screen.getByText("Leave Utilization")).toBeTruthy();
    expect(screen.getByText("On-time Rate")).toBeTruthy();
    expect(screen.getAllByText(/Month to date/)).toHaveLength(2);
    expect(screen.getByText(/Current leave year/)).toBeTruthy();
    expect(screen.queryByText("Staff Retention")).toBeNull();
  });

  it("summarizes department distribution as top departments plus others", () => {
    mockState.employees = [
      ...Array.from({ length: 6 }, (_, i) => ({
        id: `HR${i}`,
        name: `HR ${i}`,
        department: "Human Resources",
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `BE${i}`,
        name: `Backend ${i}`,
        department: "Backend Engineering",
      })),
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `FIN${i}`,
        name: `Finance ${i}`,
        department: "Finance",
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        id: `OPS${i}`,
        name: `Ops ${i}`,
        department: "Operations",
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        id: `QA${i}`,
        name: `QA ${i}`,
        department: "Software QA",
      })),
      { id: "SEC1", name: "Security 1", department: "Security" },
      { id: "SALES1", name: "Sales 1", department: "Sales" },
    ];
    mockState.metrics = {
      ...mockState.metrics,
      total_employees: mockState.employees.length,
    };

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Top 5 + Others")).toBeTruthy();
    expect(screen.getByText("Human Resources")).toBeTruthy();
    expect(screen.getByText("Backend Engineering")).toBeTruthy();
    expect(screen.getByText("Others")).toBeTruthy();
    expect(screen.queryByText("Security")).toBeNull();
    expect(screen.queryByText("Sales")).toBeNull();
  });
});
