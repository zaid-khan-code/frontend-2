import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

function extractAttendanceRows(payload: any): any[] {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.attendance)) return data.attendance;
  if (Array.isArray(data?.items)) return data.items;
  if (data && typeof data === 'object' && (data.id || data.status || data.attendance_date || data.date)) {
    return [data];
  }
  return [];
}

export function useAttendance(params?: any) {
  const queryClient = useQueryClient();
  const cleanParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

  const query = useQuery({
    queryKey: ['attendance', cleanParams],
    queryFn: async () => {
      const { data } = await apiClient.get('/attendance', { params: cleanParams });
      return data;
    },
    enabled: !params || Object.keys(cleanParams).length === Object.keys(params).length,
  });

  const markMutation = useMutation({
    mutationFn: async (payload: { employee_id: string; date: string; status: string; check_in?: string; check_out?: string; notes?: string }) => {
      const { data } = await apiClient.post('/attendance/mark', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/attendance/${id}/ack`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['employee_self_metrics'] });
    },
  });

  return {
    data: extractAttendanceRows(query.data),
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    mark: markMutation.mutateAsync,
    acknowledge: acknowledgeMutation.mutateAsync,
  };
}
