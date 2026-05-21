import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Directory from "./Directory";

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ activeRole: "super_admin" }),
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
  });

  it("opens the add entry modal from the create button", async () => {
    renderDirectory();

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /add directory entry/i })).toBeTruthy();
    });
  });
});
