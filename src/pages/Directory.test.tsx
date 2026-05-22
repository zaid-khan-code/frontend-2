import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Directory from "./Directory";
import { apiClient } from "../services/apiClient";

const authMock = vi.hoisted(() => ({ activeRole: "super_admin" }));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ activeRole: authMock.activeRole }),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../services/apiClient", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ data: { data: [] } }),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

function renderDirectory() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Directory />
    </QueryClientProvider>,
  );
}

describe("Directory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.activeRole = "super_admin";
  });

  it("opens the add entry modal from the create button", async () => {
    renderDirectory();

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /add directory entry/i })).toBeTruthy();
    });
  });

  it("renders employee directory as read-only self-service", async () => {
    authMock.activeRole = "employee";
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "dir-1",
            type: "department",
            name: "IT Support",
            contact: "111",
            isActive: true,
          },
        ],
      },
    });

    renderDirectory();

    expect(await screen.findByText("Company Directory")).toBeTruthy();
    expect(await screen.findByText("IT Support")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /add entry/i })).toBeNull();
    expect(screen.queryByTitle("Edit")).toBeNull();
    expect(screen.queryByTitle("Delete")).toBeNull();
  });
});
