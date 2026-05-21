import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PenaltyWorkflow from "./PenaltyWorkflow";

const approveMock = vi.fn();
const rejectMock = vi.fn();
const acknowledgeMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("../hooks/usePenalties", () => ({
  usePenalties: () => ({
    data: [
      {
        id: "penalty-1",
        employee_id: "EMP001",
        employee: { name: "Ayesha Khan", branch: "Head Office" },
        amount: 2500,
        penalty_rule: { name: "Late Arrival" },
        status: "pending",
      },
    ],
    approve: approveMock,
    reject: rejectMock,
    acknowledge: acknowledgeMock,
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: showToastMock }),
}));

describe("PenaltyWorkflow", () => {
  beforeEach(() => {
    approveMock.mockResolvedValue({});
    rejectMock.mockResolvedValue({});
    acknowledgeMock.mockResolvedValue({});
    showToastMock.mockClear();
  });

  it("approves a pending penalty once with the current penalty amount", async () => {
    render(<PenaltyWorkflow />);

    fireEvent.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(showToastMock).toHaveBeenCalledWith("Penalty approved");
    });
    expect(approveMock).toHaveBeenCalledTimes(1);
    expect(approveMock).toHaveBeenCalledWith({
      id: "penalty-1",
      amount: 2500,
    });
  });
});
