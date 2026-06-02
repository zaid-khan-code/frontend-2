import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddEmployee from "./AddEmployee";

const createEmployeeMock = vi.hoisted(() => vi.fn());
const useDesignationsMock = vi.hoisted(() => vi.fn());
const rolesMock = vi.hoisted(() => vi.fn());

vi.mock("../context/DataContext", () => ({
  useData: () => ({}),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../hooks/useEmployees", () => ({
  useEmployees: () => ({ create: createEmployeeMock }),
}));

vi.mock("../hooks/useConfig", () => ({
  useDepartments: () => ({ data: [{ id: "dept-1", name: "Engineering" }] }),
  useDesignations: useDesignationsMock,
  useEmploymentTypes: () => ({ data: [{ id: "type-1", name: "Full Time" }] }),
  useJobStatuses: () => ({ data: [{ id: "status-1", name: "Active" }] }),
  useWorkModes: () => ({ data: [{ id: "mode-1", name: "Onsite" }] }),
  useWorkLocations: () => ({ data: [{ id: "loc-1", name: "Head Office" }] }),
  useShifts: () => ({
    data: [{ id: "shift-1", name: "Morning", start_time: "09:00", end_time: "18:00" }],
  }),
  useAllowanceTypes: () => ({
    data: [
      { id: "allowance-1", name: "Meal Allowance" },
      { id: "allowance-2", name: "Fuel Allowance" },
    ],
  }),
  useRoles: rolesMock,
}));

function renderAddEmployee() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AddEmployee />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("AddEmployee", () => {
  beforeEach(() => {
    createEmployeeMock.mockReset();
    rolesMock.mockReset();
    rolesMock.mockReturnValue({
      data: [
        { id: "role-super", role_name: "super_admin", description: "Super Admin" },
        { id: "role-employee", role_name: "employee", description: "Employee" },
      ],
    });
    useDesignationsMock.mockReset();
    useDesignationsMock.mockReturnValue({
      data: [{ id: "desig-1", title: "Frontend Engineer", department_id: "dept-1" }],
    });
  });

  it("renders a guided personal information step", () => {
    renderAddEmployee();

    expect(screen.getByText("Identity snapshot")).toBeTruthy();
    expect(screen.getByText("Core identity")).toBeTruthy();
    expect(screen.getByText("Legal verification")).toBeTruthy();
    expect(screen.getByText("Profile readiness")).toBeTruthy();
    expect(screen.getByLabelText(/employee id/i)).toBeTruthy();
    expect(screen.getByLabelText(/date of birth/i)).toBeTruthy();
  });

  it("renders guided job and emergency contact steps after personal info", async () => {
    renderAddEmployee();

    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: "001" },
    });
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Ayesha Khan" },
    });
    fireEvent.change(screen.getByLabelText(/father name/i), {
      target: { value: "Imran Khan" },
    });
    fireEvent.change(screen.getByLabelText(/cnic/i), {
      target: { value: "4210112345671" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "1996-02-10" },
    });

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
    expect(screen.getByText("Workforce placement")).toBeTruthy();
    });
    expect(screen.getByText("Role and schedule")).toBeTruthy();
    expect(screen.getByText("Location and timeline")).toBeTruthy();
    expect(screen.getByLabelText(/department/i)).toBeTruthy();
    const departmentSelect = screen.getByLabelText(/department/i);
    const designationSelect = screen.getByLabelText(/designation/i);
    expect(departmentSelect).toHaveProperty("value", "");
    expect(designationSelect).toHaveProperty("disabled", true);
    expect(
      departmentSelect.querySelector('option[value=""]')?.textContent,
    ).toBe("Please Select");
    expect(useDesignationsMock).toHaveBeenCalledWith(null);

    fireEvent.change(screen.getByLabelText(/department/i), {
      target: { value: "dept-1" },
    });
    await waitFor(() => {
      expect(useDesignationsMock).toHaveBeenCalledWith("dept-1");
    });
    fireEvent.change(screen.getByLabelText(/designation/i), {
      target: { value: "desig-1" },
    });
    fireEvent.change(screen.getByLabelText(/employment type/i), {
      target: { value: "type-1" },
    });
    fireEvent.change(screen.getByLabelText(/job status/i), {
      target: { value: "status-1" },
    });
    fireEvent.change(screen.getByLabelText(/shift/i), {
      target: { value: "shift-1" },
    });
    fireEvent.change(screen.getByLabelText(/work location/i), {
      target: { value: "loc-1" },
    });
    fireEvent.change(screen.getByLabelText(/work mode/i), {
      target: { value: "mode-1" },
    });
    fireEvent.change(screen.getByLabelText(/date of joining/i), {
      target: { value: "2026-05-23" },
    });

    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/primary phone/i)).toBeTruthy();
    });
    expect(screen.getByLabelText(/alternate phone/i)).toBeTruthy();
    expect(screen.getByText("Permanent Address")).toBeTruthy();
    expect(screen.getAllByLabelText(/province \/ region/i).length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText(/city/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText(/primary phone/i), {
      target: { value: "3001234567" },
    });
    fireEvent.change(screen.getAllByLabelText(/province \/ region/i)[0], {
      target: { value: "Punjab" },
    });
    fireEvent.change(screen.getAllByLabelText(/city/i)[0], {
      target: { value: "Lahore" },
    });
    fireEvent.click(screen.getByLabelText(/same as permanent address/i));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/contact name/i)[0]).toBeTruthy();
    });
    expect(screen.getAllByText("Primary emergency contact").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Backup contact").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Country Code")[0]).toHaveProperty("disabled", true);
  }, 10000);

  it("renders bank, medical, salary, allowances, and account steps", async () => {
    renderAddEmployee();

    fireEvent.change(screen.getByLabelText(/employee id/i), {
      target: { value: "002" },
    });
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Bilal Ahmed" },
    });
    fireEvent.change(screen.getByLabelText(/father name/i), {
      target: { value: "Saeed Ahmed" },
    });
    fireEvent.change(screen.getByLabelText(/cnic/i), {
      target: { value: "4210112345672" },
    });
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "1994-06-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Workforce placement")).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/department/i), {
      target: { value: "dept-1" },
    });
    fireEvent.change(screen.getByLabelText(/designation/i), {
      target: { value: "desig-1" },
    });
    fireEvent.change(screen.getByLabelText(/employment type/i), {
      target: { value: "type-1" },
    });
    fireEvent.change(screen.getByLabelText(/job status/i), {
      target: { value: "status-1" },
    });
    fireEvent.change(screen.getByLabelText(/shift/i), {
      target: { value: "shift-1" },
    });
    fireEvent.change(screen.getByLabelText(/work location/i), {
      target: { value: "loc-1" },
    });
    fireEvent.change(screen.getByLabelText(/work mode/i), {
      target: { value: "mode-1" },
    });
    fireEvent.change(screen.getByLabelText(/date of joining/i), {
      target: { value: "2026-05-23" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/primary phone/i)).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/primary phone/i), {
      target: { value: "3001234567" },
    });
    fireEvent.change(screen.getAllByLabelText(/province \/ region/i)[0], {
      target: { value: "Punjab" },
    });
    fireEvent.change(screen.getAllByLabelText(/city/i)[0], {
      target: { value: "Lahore" },
    });
    fireEvent.change(screen.getAllByLabelText(/house \/ street \/ landmark/i)[0], {
      target: { value: "House 12, Main Boulevard" },
    });
    fireEvent.click(screen.getByLabelText(/same as permanent address/i));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getAllByLabelText(/contact name/i)[0]).toBeTruthy();
    });
    fireEvent.change(screen.getAllByLabelText(/contact name/i)[0], {
      target: { value: "Sara Ahmed" },
    });
    fireEvent.change(screen.getAllByLabelText(/^contact phone/i)[0], {
      target: { value: "3007654321" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Bank account profile")).toBeTruthy();
    });
    fireEvent.change(screen.getByLabelText(/bank name/i), {
      target: { value: "HBL" },
    });
    fireEvent.change(screen.getByLabelText(/account title/i), {
      target: { value: "Bilal Ahmed" },
    });
    fireEvent.change(screen.getByLabelText(/iban/i), {
      target: { value: "PK36SCBL0000001123456702" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Medical profile")).toBeTruthy();
    });
    expect(screen.getByLabelText(/height/i)).toBeTruthy();
    expect(screen.getByLabelText(/weight/i)).toBeTruthy();
    expect(screen.getByLabelText(/disability type/i).getAttribute("maxlength"))
      .toBe("100");
    expect(screen.getByLabelText(/fitness status/i).getAttribute("maxlength"))
      .toBe("30");
    expect(screen.getByLabelText(/last medical exam date/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Salary plan")).toBeTruthy();
    });
    expect(screen.getByText("Compensation snapshot")).toBeTruthy();
    expect(screen.getByText("Monthly base")).toBeTruthy();
    expect(screen.getByText("Revision context")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/basic salary/i), {
      target: { value: "75000" },
    });
    expect(screen.getAllByText(/PKR 75,000/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Allowance builder")).toBeTruthy();
    });
    expect(screen.getByText("Allowance package")).toBeTruthy();
    expect(screen.getByText("Configured allowances")).toBeTruthy();
    expect(screen.getByText("Remaining types")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /add allowance row/i }));
    expect(screen.getByText("Allowance 1")).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/allowance type 1/i), {
      target: { value: "allowance-1" },
    });
    fireEvent.change(screen.getByLabelText(/amount 1/i), {
      target: { value: "5000" },
    });
    expect(screen.getAllByText("Meal Allowance").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PKR 5,000/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /add allowance row/i }));
    expect(
      screen
        .getByLabelText(/allowance type 2/i)
        .querySelector('option[value="allowance-1"]'),
    ).toHaveProperty("disabled", true);
    fireEvent.change(screen.getByLabelText(/allowance type 2/i), {
      target: { value: "allowance-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Allowance type already selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /remove allowance row 2/i }));
    expect(screen.queryByLabelText(/allowance type 2/i)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText("Account access")).toBeTruthy();
    });
    const emailInput = screen.getByLabelText(/employee email/i) as HTMLInputElement;
    expect(emailInput.value).toBe("bilal.ahmed.saeed.ahmed.emp002@esspl.com.pk");
    fireEvent.change(emailInput, { target: { value: "custom.employee@esspl.com.pk" } });
    expect(emailInput.value).toBe("custom.employee@esspl.com.pk");
    expect(screen.getByRole("option", { name: "Employee" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Super Admin" })).toBeNull();
    expect(screen.queryByText("Required Attachments")).toBeNull();
    expect(screen.queryByText("CNIC Copy")).toBeNull();
    expect(screen.queryByText("Profile Photo")).toBeNull();
    expect(screen.queryByText("Employment Contract")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /save employee/i }));
    await waitFor(() => {
      expect(createEmployeeMock).toHaveBeenCalled();
    });
    const payload = createEmployeeMock.mock.calls[0][0];
    expect(payload.employeeContact).toMatchObject({
      primary_phone: "3001234567",
      alternate_phone: null,
      same_as_permanent: true,
      permanent_address: {
        country: "Pakistan",
        province: "Punjab",
        city: "Lahore",
        street: "House 12, Main Boulevard",
      },
      postal_address: null,
    });
    expect(payload.emergencyContacts).toMatchObject({
      e_contact_1_full_name: "Sara Ahmed",
      e_contact_1_phone: "3007654321",
    });
    expect(payload.emergencyContacts.contact_1).toBeUndefined();
    expect(payload.emergencyContacts.perment_address).toBeUndefined();
  }, 20000);
});
