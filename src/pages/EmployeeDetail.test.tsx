import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeDetail from "./EmployeeDetail";

const useAttendanceReportMock = vi.hoisted(() => vi.fn());
const useLeaveBalancesMock = vi.hoisted(() => vi.fn());
const usePenaltiesMock = vi.hoisted(() => vi.fn());
const useEmployeeAttachmentsMock = vi.hoisted(() => vi.fn());
const useEmployeeFinanceMock = vi.hoisted(() => vi.fn());
const resendCredentialsMock = vi.hoisted(() => vi.fn());
const createAccountMock = vi.hoisted(() => vi.fn());
const addSalaryRevisionMock = vi.hoisted(() => vi.fn());
const employeeMock = vi.hoisted(() => vi.fn());

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
    data: employeeMock(),
    isLoading: false,
    resendCredentials: resendCredentialsMock,
    isResendingCredentials: false,
    createAccount: createAccountMock,
    isCreatingAccount: false,
    addSalaryRevision: addSalaryRevisionMock,
    isAddingSalaryRevision: false,
  }),
  useEmployeeFinance: (employeeId: string) => useEmployeeFinanceMock(employeeId),
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

vi.mock("../hooks/useEmployeeAttachments", () => ({
  useEmployeeAttachments: (employeeId: string) => useEmployeeAttachmentsMock(employeeId),
}));

vi.mock("../hooks/useConfig", () => ({
  usePenaltyRules: () => ({ data: [{ id: "rule-1", name: "Late Arrival", amount_pkr: 1000, is_active: true }] }),
  useRoles: () => ({
    data: [
      { id: "role-employee", role_name: "employee" },
      { id: "role-hr", role_name: "hr_executive" },
    ],
  }),
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
    employeeMock.mockReturnValue({
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
    });
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
    useEmployeeAttachmentsMock.mockReturnValue({
      data: [{ id: "att-1", document_type: "CNIC", original_filename: "cnic.pdf", size_bytes: 2048, created_at: "2026-05-01", url: "/uploads/employees/EMP001/documents/cnic.pdf" }],
      isLoading: false,
      upload: vi.fn(),
      isUploading: false,
    });
    useEmployeeFinanceMock.mockReturnValue({
      data: {
        salaryHistory: [
          {
            id: "sal-1",
            employee_id: "EMP001",
            base_salary: "125000",
            currency: "PKR",
            effective_from: "2026-01-01",
            revision_type: "Initial",
            revision_percent: null,
            revision_reason: null,
            created_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "sal-2",
            employee_id: "EMP001",
            base_salary: "140000",
            currency: "PKR",
            effective_from: "2026-06-01",
            revision_type: "Increment",
            revision_percent: "12.00",
            revision_reason: "Annual review",
            created_at: "2026-06-01T00:00:00.000Z",
          },
        ],
        allowancesHistory: [],
      },
      isLoading: false,
    });
    createAccountMock.mockResolvedValue({ tempPassword: "Temp#1234", whatsappPhone: "03001234567" });
    addSalaryRevisionMock.mockResolvedValue({});
  });

  it("shows the MyProfile-style tabs and uses Not provided instead of N/A", () => {
    renderEmployeeDetail();

    expect(screen.getAllByText("Adeel Rahman").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Administration").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not provided").length).toBeGreaterThan(0);
    expect(screen.queryByText("N/A")).toBeNull();
    expect(screen.getByRole("button", { name: "Personal & Contact" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Job & Employment" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Compensation" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Bank & Medical" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Documents" })).toBeTruthy();
  });

  it("uses the uploaded profile photo and opens a larger preview when clicked", () => {
    useEmployeeAttachmentsMock.mockReturnValue({
      data: [
        {
          id: "photo-1",
          kind: "profile_photo",
          document_type: "Profile Photo",
          original_filename: "profile.png",
          mime_type: "image/png",
          size_bytes: 4096,
          created_at: "2026-05-03",
          url: "/uploads/employees/EMP001/profile/profile.png",
        },
      ],
      isLoading: false,
      upload: vi.fn(),
      isUploading: false,
    });

    renderEmployeeDetail();

    const image = screen.getByAltText("Adeel Rahman profile") as HTMLImageElement;
    expect(image.src).toBe("http://localhost:3001/uploads/employees/EMP001/profile/profile.png");
    expect(screen.queryByText("AR")).toBeNull();
    fireEvent.click(image);
    expect(screen.getAllByAltText("Adeel Rahman profile").length).toBeGreaterThan(1);
  });

  it("falls back to initials when the uploaded profile photo cannot load", () => {
    useEmployeeAttachmentsMock.mockReturnValue({
      data: [
        {
          id: "photo-1",
          kind: "profile_photo",
          document_type: "Profile Photo",
          original_filename: "profile.png",
          mime_type: "image/png",
          size_bytes: 4096,
          created_at: "2026-05-03",
          url: "/uploads/employees/EMP001/profile/missing.png",
        },
      ],
      isLoading: false,
      upload: vi.fn(),
      isUploading: false,
    });

    renderEmployeeDetail();

    fireEvent.error(screen.getByAltText("Adeel Rahman profile"));
    expect(screen.getByText("AR")).toBeTruthy();
  });

  it("loads employee attendance in six-month windows", () => {
    renderEmployeeDetail();
    expect(screen.getByText("Attendance (Last 6 Months)")).toBeTruthy();
    expect(screen.getByText("Previous 6 months")).toBeTruthy();
    expect(useAttendanceReportMock).toHaveBeenCalled();
  });

  it("shows real leave balances, leave requests, and penalties by employee id", () => {
    renderEmployeeDetail();

    expect(useLeaveBalancesMock).toHaveBeenCalledWith(expect.objectContaining({ employee_id: "EMP001" }));
    expect(screen.getAllByText("Annual Leave").length).toBeGreaterThan(0);
    expect(screen.getByText("10 remaining")).toBeTruthy();

    expect(usePenaltiesMock).toHaveBeenCalledWith({ employee_id: "EMP001" });
    expect(screen.getByText("Late Arrival")).toBeTruthy();

    expect(useEmployeeAttachmentsMock).toHaveBeenCalledWith("EMP001");
    expect(screen.getByText("cnic.pdf")).toBeTruthy();
  });

  it("lets HR complete post-import account, salary, and attachment actions from the management area", async () => {
    employeeMock.mockReturnValue({
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
      employeeContact: { primary_phone: "03001234567" },
      emergencyContacts: {
        e_contact_1_full_name: "Sara Rahman",
        perment_address: "Lahore",
      },
      bankInfo: { bank_name: "HBL", account_number: "12345", is_verified: true },
      medicalInfo: { blood_group: "O+", allergy_notes: "" },
      salaryInfo: { base_salary: "125000", currency: "PKR" },
    });
    renderEmployeeDetail();

    fireEvent.change(screen.getByLabelText("Account Email"), {
      target: { value: "bulk.employee@esspl.com.pk" },
    });
    fireEvent.change(screen.getByLabelText("Account Role"), {
      target: { value: "role-employee" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create login account" }));

    await waitFor(() => {
      expect(createAccountMock).toHaveBeenCalledWith({
        employeeId: "EMP001",
        email: "bulk.employee@esspl.com.pk",
        role_id: "role-employee",
      });
    });
    const whatsappLink = await screen.findByRole("link", { name: "Send credentials via WhatsApp" });
    const whatsappHref = whatsappLink.getAttribute("href") || "";
    expect(whatsappHref).toContain("https://wa.me/923001234567");
    expect(decodeURIComponent(whatsappHref)).toContain("Employee ID: EMP001");
    expect(decodeURIComponent(whatsappHref)).toContain("Email: bulk.employee@esspl.com.pk");
    expect(decodeURIComponent(whatsappHref)).toContain("Password: Temp#1234");

    fireEvent.change(screen.getByLabelText("Base Salary"), {
      target: { value: "140000" },
    });
    fireEvent.change(screen.getByLabelText("Effective From"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText("Revision Type"), {
      target: { value: "Increment" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add salary history" }));

    await waitFor(() => {
      expect(addSalaryRevisionMock).toHaveBeenCalledWith({
        employeeId: "EMP001",
        payload: expect.objectContaining({
          base_salary: 140000,
          currency: "PKR",
          effective_from: "2026-06-01",
          revision_type: "Increment",
        }),
      });
    });

    expect(screen.getByText("Upload profile photo/documents")).toBeTruthy();
    expect(screen.getByText("Upload File")).toBeTruthy();
  });

  it("hides account creation fields when the employee already has a login account", () => {
    renderEmployeeDetail();

    expect(screen.queryByLabelText("Account Email")).toBeNull();
    expect(screen.queryByLabelText("Account Role")).toBeNull();
    expect(screen.queryByRole("button", { name: "Create login account" })).toBeNull();
    expect(screen.getAllByText("adeel.rahman@esspl.com.pk").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Resend Credentials" })).toBeTruthy();
  });

  it("uses backend salary revision options and hides percentage fields for Initial", () => {
    employeeMock.mockReturnValue({
      employee_id: "EMP001",
      name: "Adeel Rahman",
      department_name: "Administration",
      designation_title: "Admin Officer",
      job_status_name: "Active",
      employeeContact: { primary_phone: "03001234567" },
      salaryInfo: { base_salary: "125000", currency: "PKR" },
    });

    renderEmployeeDetail();

    const revisionType = screen.getByLabelText("Revision Type") as HTMLSelectElement;
    expect(revisionType.value).toBe("");
    expect(screen.getByRole("option", { name: "Select option" })).toBeTruthy();
    ["Initial", "Promotion", "Demotion", "Increment", "Decrement", "Correction", "Market Adjustment"].forEach((option) => {
      expect(screen.getByRole("option", { name: option })).toBeTruthy();
    });
    expect(screen.queryByLabelText("Revision Percent")).toBeNull();
    expect(screen.queryByLabelText("Revision Reason")).toBeNull();

    fireEvent.change(revisionType, { target: { value: "Initial" } });
    expect(screen.queryByLabelText("Revision Percent")).toBeNull();
    expect(screen.queryByLabelText("Revision Reason")).toBeNull();

    fireEvent.change(revisionType, { target: { value: "Promotion" } });
    expect(screen.getByLabelText("Revision Percent")).toBeTruthy();
    expect(screen.getByLabelText("Revision Reason")).toBeTruthy();
  });

  it("shows salary history in the compensation section", () => {
    renderEmployeeDetail();
    fireEvent.click(screen.getByRole("button", { name: "Compensation" }));

    expect(screen.getByText("Salary & Allowance")).toBeTruthy();
    expect(screen.getByText("Salary History")).toBeTruthy();
    expect(screen.getByText("01 Jun 2026")).toBeTruthy();
    expect(screen.getAllByText("Increment").length).toBeGreaterThan(0);
  });
});
