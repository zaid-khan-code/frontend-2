import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import AddEmployee from "./AddEmployee";

vi.mock("../context/DataContext", () => ({
  useData: () => ({}),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../hooks/useEmployees", () => ({
  useEmployees: () => ({ create: vi.fn() }),
}));

vi.mock("../hooks/useConfig", () => ({
  useDepartments: () => ({ data: [{ id: "dept-1", name: "Engineering" }] }),
  useDesignations: () => ({
    data: [{ id: "desig-1", title: "Frontend Engineer", department_id: "dept-1" }],
  }),
  useEmploymentTypes: () => ({ data: [{ id: "type-1", name: "Full Time" }] }),
  useJobStatuses: () => ({ data: [{ id: "status-1", name: "Active" }] }),
  useWorkModes: () => ({ data: [{ id: "mode-1", name: "Onsite" }] }),
  useWorkLocations: () => ({ data: [{ id: "loc-1", name: "Head Office" }] }),
  useShifts: () => ({
    data: [{ id: "shift-1", name: "Morning", start_time: "09:00", end_time: "18:00" }],
  }),
  useAllowanceTypes: () => ({ data: [] }),
  useRoles: () => ({ data: [] }),
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
  it("renders a guided personal information step", () => {
    renderAddEmployee();

    expect(screen.getByText("Identity snapshot")).toBeTruthy();
    expect(screen.getByText("Core identity")).toBeTruthy();
    expect(screen.getByText("Legal verification")).toBeTruthy();
    expect(screen.getByText("Profile readiness")).toBeTruthy();
    expect(screen.getByLabelText(/employee id/i)).toBeTruthy();
    expect(screen.getByLabelText(/date of birth/i)).toBeTruthy();
  });
});
