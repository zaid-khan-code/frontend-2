import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EmployeeBulkUpload from "./EmployeeBulkUpload";

const validateFile = vi.fn();
const revalidateRows = vi.fn();
const importRows = vi.fn();

vi.mock("../context/ToastContext", () => ({
  useToastContext: () => ({ showToast: vi.fn() }),
}));

vi.mock("../hooks/useEmployeeBulkUpload", () => ({
  downloadEmployeeBulkTemplate: vi.fn(),
  useEmployeeBulkUpload: () => ({
    validateFile,
    revalidateRows,
    importRows,
    isValidating: false,
    isImporting: false,
  }),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <EmployeeBulkUpload />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("EmployeeBulkUpload post-import tracker", () => {
  beforeEach(() => {
    localStorage.clear();
    validateFile.mockReset();
    revalidateRows.mockReset();
    importRows.mockReset();
  });

  it("creates skippable post-import tasks for imported employees with missing follow-up data", async () => {
    validateFile.mockResolvedValueOnce({
      total_rows: 1,
      valid_rows: 1,
      error_rows: 0,
      warning_rows: 1,
      rows: [
        {
          rowNumber: 2,
          data: { employee_id: "EMP0201", full_name: "Bulk Employee" },
          mapped: { employee_id: "EMP0201" },
          errors: [],
          warnings: [
            { field: "accountInfo", message: "Login account is not created by bulk upload." },
            { field: "salaryInfo", message: "Salary history must be added after import." },
            { field: "attachments", message: "Profile photo and documents must be uploaded after import." },
          ],
        },
      ],
    });
    importRows.mockResolvedValueOnce({
      imported_count: 1,
      failed_count: 0,
      imported: [{ rowNumber: 2, employee_id: "EMP0201" }],
    });

    renderPage();

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "employees.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: /validate/i }));

    await screen.findByText("EMP0201");
    fireEvent.click(screen.getByRole("button", { name: /import 1 valid row/i }));

    await screen.findByText("Post-import completion tracker");
    expect(screen.getAllByText("Bulk Employee").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Create login account")).toBeTruthy();
    expect(screen.getByText("Add salary history")).toBeTruthy();
    expect(screen.getByText("Upload profile photo/documents")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /skip/i })[0]);
    await waitFor(() => expect(screen.getByText("Skipped")).toBeTruthy());

    expect(JSON.parse(localStorage.getItem("ems.bulkUpload.postImportTasks") || "[]")[0].tasks[0].status).toBe("skipped");
  });
});
