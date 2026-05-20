import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

function normalizeEmployee(raw: any) {
  if (!raw || typeof raw !== "object") return raw;
  return {
    ...raw,
    id: raw.id ?? raw.employee_id ?? raw.emp_id ?? raw.code,
    name: raw.name ?? raw.full_name ?? raw.employee_name,
    department:
      raw.department ?? raw.department_name ?? raw.department?.name ?? raw.dept,
    designation:
      raw.designation ??
      raw.designation_name ??
      raw.designation_title ??
      raw.designation?.name ??
      raw.title,
    employmentType:
      raw.employmentType ??
      raw.employment_type ??
      raw.employment_type_name ??
      raw.employment_type?.name,
    jobStatus:
      raw.jobStatus ?? raw.job_status ?? raw.job_status?.name ?? raw.status,
    shift: raw.shift ?? raw.shift_name ?? raw.shift_label ?? raw.shift?.name,
    dateOfJoining:
      raw.dateOfJoining ??
      raw.date_of_joining ??
      raw.joined_at ??
      raw.joining_date,
  };
}

export function useEmployees(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["employees", params],
    queryFn: async () => {
      const { data } = await apiClient.get("/employees", { params });
      // Depending on backend, it might return { data: { employees: [], total: x, page: y } }
      // The instructions say "Implement pagination and search/filter parameters" so we can assume it takes query params.
      return data;
    },
  });

  const payload = query.data;
  const dataNode = payload?.data ?? payload;
  const list =
    dataNode?.employees ?? dataNode?.items ?? dataNode?.data ?? dataNode ?? [];
  const employees = Array.isArray(list) ? list.map(normalizeEmployee) : [];
  const rawPagination =
    payload?.pagination ??
    dataNode?.pagination ??
    dataNode?.meta ??
    payload?.meta;
  const pagination = rawPagination
    ? {
        ...rawPagination,
        totalPages:
          rawPagination.totalPages ??
          rawPagination.pages ??
          rawPagination.total_pages ??
          rawPagination.last_page,
        total: rawPagination.total ?? rawPagination.count,
        page: rawPagination.page ?? rawPagination.current_page,
        limit: rawPagination.limit ?? rawPagination.per_page,
      }
    : undefined;

  const createMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      const { data } = await apiClient.post("/employees", newEmployee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data } = await apiClient.patch(`/employees/${id}`, updates);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { data } = await apiClient.patch("/employees/bulk", {
        ids,
        updates,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
  });

  return {
    data: employees,
    pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    bulkUpdate: bulkUpdateMutation.mutateAsync,
  };
}

export function useEmployee(id?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(
        `/employees/${encodeURIComponent(id)}`,
      );
      return data.data;
    },
    enabled: !!id,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
