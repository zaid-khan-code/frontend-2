import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Leave from "./Leave";
import { apiClient } from "../services/apiClient";

vi.mock("../context/DataContext", () => ({
  useData: () => ({ employees: [], leaveTypes: [] }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ activeRole: "hr_manager", user: { role: "hr_manager" } }),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../services/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

function renderLeave() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <Leave />
    </QueryClientProvider>,
  );
}

describe("Leave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === "/leave-requests/balances") return Promise.resolve({ data: { data: [] } });
      if (url === "/config/departments") return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({
        data: {
          data: [
            {
              id: "leave-1",
              employee_id: "EMP016",
              employee_name: "Kamran Rafiq",
              leave_type: "Annual Leave",
              start_date: "2026-03-13T19:00:00.000Z",
              end_date: "2026-03-18T19:00:00.000Z",
              reason: "Family commitment",
              status: "approved",
              reviewed_by_name: "Ayesha Khan",
              created_at: "2026-03-01T09:00:00.000Z",
            },
          ],
        },
      });
    });
  });

  it("formats leave dates and removes unsupported amount columns", async () => {
    renderLeave();

    expect(await screen.findByText("Kamran Rafiq")).toBeTruthy();
    expect(screen.getByText("13 Mar 2026")).toBeTruthy();
    expect(screen.getByText("18 Mar 2026")).toBeTruthy();
    expect(screen.getByText("Ayesha Khan")).toBeTruthy();
    expect(screen.queryByText(/requested amount/i)).toBeNull();
    expect(screen.queryByText(/approved amount/i)).toBeNull();
    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalled();
    });
  });

  it("does not expose a raw reviewer UUID when no readable approver name is returned", async () => {
    vi.mocked(apiClient.get).mockImplementation((url: string) => {
      if (url === "/leave-requests/balances") return Promise.resolve({ data: { data: [] } });
      if (url === "/config/departments") return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({
        data: {
          data: [
            {
              id: "leave-1",
              employee_id: "EMP016",
              employee_name: "Kamran Rafiq",
              leave_type: "Annual Leave",
              start_date: "2026-03-13",
              end_date: "2026-03-18",
              reason: "Family commitment",
              status: "approved",
              reviewed_by: "39b623d6-e275-45d2-b340-92a4df5f8d1f",
              created_at: "2026-03-01",
            },
          ],
        },
      });
    });

    renderLeave();

    expect(await screen.findByText("Kamran Rafiq")).toBeTruthy();
    expect(screen.getByText("Not provided")).toBeTruthy();
    expect(screen.queryByText("39b623d6-e275-45d2-b340-92a4df5f8d1f")).toBeNull();
  });
});
