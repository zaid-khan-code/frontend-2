import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeDetail from "./EmployeeDetail";

const useAttendanceReportMock = vi.hoisted(() => vi.fn());
const useLeaveBalancesMock = vi.hoisted(() => vi.fn());
const usePenaltiesMock = vi.hoisted(() => vi.fn());

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <svg>{children}</svg>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { role: "hr_executive", employeeId: "EMP017" },
    activeRole: "hr_executive",
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../hooks/useRbac", () => ({
  useRbac: () => ({ can: (permission: string) => permission !== "delete_employee" }),
}));

vi.mock("../hooks/useEmployees", () => ({
  useEmployee: () => ({
    data: {
      employee_id: "EMP001",
      name: "Adeel Rahman",
      father_name: "Khalid Rahman",
      cnic: "35202-1111111-1",
      date_of_birth: "1990-01-10",
      department_name: "Administration",
      designation_title: "Admin Officer",
      job_status_name: "Active",
      employment_type_name: "Full-Time",
      work_mode_name: "On-site",
      work_location_name: "Head Office",
      shift_name: "Morning",
      date_of_joining: "2020-02-01",
      accountInfo: { email: "adeel.rahman@esspl.com.pk", phone: "03001234567" },
      emergencyContacts: {
        e_contact_1_full_name: "Sara Rahman",
        perment_address: "Lahore",
      },
      bankInfo: { bank_name: "HBL", account_number: "12345", is_verified: true },
      medicalInfo: { blood_group: "O+", allergy_notes: "" },
      salaryInfo: { base_salary: "125000", currency: "PKR" },
    },
    isLoading: false,
    resendCredentials: vi.fn(),
    isResendingCredentials: false,
  }),
  useEmployees: () => ({ update: vi.fn() }),
}));

vi.mock("../hooks/useAttendance", () => ({
  useAttendanceReport: (params: any) => useAttendanceReportMock(params),
}));

vi.mock("../hooks/useLeaves", () => ({
  useLeaves: () => ({
    data: [
      {
        id: "LR1",
        leave_type: "Annual Leave",
        start_date: "2026-05-01",
        end_date: "2026-05-02",
        total_days: 2,
        reason: "Family work",
        status: "approved",
      },
    ],
    isLoading: false,
  }),
  useLeaveBalances: (params: any) => useLeaveBalancesMock(params),
}));

vi.mock("../hooks/usePenalties", () => ({
  usePenalties: (params: any) => usePenaltiesMock(params),
}));

vi.mock("../hooks/useConfig", () => ({
  usePenaltyRules: () => ({ data: [{ id: "rule-1", name: "Late Arrival", amount_pkr: 1000, is_active: true }] }),
}));

function renderEmployeeDetail() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/employees/EMP001"]}>
        <Routes>
          <Route path="/employees/:id" element={<EmployeeDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("EmployeeDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAttendanceReportMock.mockReturnValue({
      data: [{ employee_id: "EMP001", presents: 20, absents: 1, lates: 2 }],
      isLoading: false,
    });
    useLeaveBalancesMock.mockReturnValue({
      data: [{ name: "Annual Leave", balance: 12, used: 2, remaining: 10 }],
      isLoading: false,
    });
    usePenaltiesMock.mockReturnValue({
      data: [{ id: "PN1", rule_name: "Late Arrival", amount_pkr: 1000, date: "2026-05-03", status: "approved" }],
      isLoading: false,
      isError: false,
      propose: vi.fn(),
    });
  });

  it("shows live profile sections and uses Not provided instead of N/A", () => {
    renderEmployeeDetail();

    expect(screen.getAllByText("Adeel Rahman").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Administration").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not provided").length).toBeGreaterThan(0);
    expect(screen.queryByText("N/A")).toBeNull();
  });

  it("loads employee attendance in six-month windows", () => {
    renderEmployeeDetail();
    fireEvent.click(screen.getByText("Attendance"));

    expect(screen.getByText("Attendance (Last 6 Months)")).toBeTruthy();
    expect(screen.getByText("Previous 6 months")).toBeTruthy();
    expect(useAttendanceReportMock).toHaveBeenCalled();
  });

  it("shows real leave balances, leave requests, and penalties by employee id", () => {
    renderEmployeeDetail();
    fireEvent.click(screen.getByText("Leave"));

    expect(useLeaveBalancesMock).toHaveBeenCalledWith(expect.objectContaining({ employee_id: "EMP001" }));
    expect(screen.getAllByText("Annual Leave").length).toBeGreaterThan(0);
    expect(screen.getByText("10 remaining")).toBeTruthy();

    fireEvent.click(screen.getByText("Penalties"));
    expect(usePenaltiesMock).toHaveBeenCalledWith({ employee_id: "EMP001" });
    expect(screen.getByText("Late Arrival")).toBeTruthy();
  });
});
