import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export function useAttendance(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['attendance', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/attendance', { params });
      return data;
    },
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
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    mark: markMutation.mutateAsync,
    acknowledge: acknowledgeMutation.mutateAsync,
  };
}
