import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Calendar from "./Calendar";
import { apiClient } from "../services/apiClient";
import { useAuthStore } from "../store/useAuthStore";

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../context/DataContext", () => ({
  useData: () => ({ employees: [] }),
}));

vi.mock("../services/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

function renderCalendar() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Calendar />
    </QueryClientProvider>,
  );
}

describe("Calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,
      activeRole: "employee",
    });
  });

  it("renders backend calendar events without a coming soon overlay", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          {
            id: "1694d670-7649-48c0-9083-08de886b7f4e",
            type: "holiday",
            date: "2026-03-22T19:00:00.000Z",
            title: "Pakistan Day 2026",
            visibility: "all",
          },
          {
            id: "8f7afd07-30c7-434d-8d1f-5f8fd4e718c9",
            type: "event",
            date: "2026-12-14T19:00:00.000Z",
            title: "Annual Performance Review 2026",
            visibility: "hr",
          },
        ],
      },
    });

    renderCalendar();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/calendar-events", { params: {} });
    });
    expect(await screen.findByText("Pakistan Day 2026")).toBeTruthy();
    expect(await screen.findByText("Annual Performance Review 2026")).toBeTruthy();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
  });

  it("passes clean filter params to the calendar endpoint", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { data: [] } });

    renderCalendar();

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/calendar-events", { params: {} });
    });

    fireEvent.change(screen.getByLabelText(/range/i), {
      target: { value: "all" },
    });
    fireEvent.change(screen.getByLabelText(/type/i), {
      target: { value: "holiday" },
    });
    fireEvent.change(screen.getByPlaceholderText(/search calendar/i), {
      target: { value: "eid" },
    });
    fireEvent.change(screen.getByLabelText(/sort/i), {
      target: { value: "date" },
    });
    fireEvent.change(screen.getByLabelText(/order/i), {
      target: { value: "desc" },
    });

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenLastCalledWith("/calendar-events", {
        params: {
          all: true,
          type: "holiday",
          search: "eid",
          sort: "date",
          order: "desc",
        },
      });
    });
  });

  it("creates and updates calendar events when the user has write permission", async () => {
    useAuthStore.setState({
      user: {
        email: "hr@example.com",
        role: "hr_manager",
      },
      permissions: ["calendar:write"],
      isAuthenticated: true,
      activeRole: "hr_manager",
    });
    vi.mocked(apiClient.get).mockResolvedValue({
      data: {
        data: [
          {
            id: "event-1",
            type: "holiday",
            date: "2026-03-22T19:00:00.000Z",
            title: "Pakistan Day 2026",
            visibility: "all",
          },
        ],
      },
    });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { success: true } });
    vi.mocked(apiClient.patch).mockResolvedValue({ data: { success: true } });

    renderCalendar();

    expect(await screen.findByText("Pakistan Day 2026")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /add event/i }));
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Eid Holiday" },
    });
    fireEvent.change(screen.getByLabelText(/^date/i), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText(/event category/i), {
      target: { value: "holiday" },
    });
    fireEvent.change(screen.getAllByLabelText(/visibility/i)[1], {
      target: { value: "all" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save event$/i }));

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith("/calendar-events", {
        title: "Eid Holiday",
        date: "2026-04-01",
        type: "holiday",
        visibility: "all",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /edit pakistan day 2026/i }));
    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: "Pakistan Day Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save event$/i }));

    await waitFor(() => {
      expect(apiClient.patch).toHaveBeenCalledWith("/calendar-events/event-1", {
        title: "Pakistan Day Updated",
        date: "2026-03-23",
        type: "holiday",
        visibility: "all",
      });
    });
  });
});
