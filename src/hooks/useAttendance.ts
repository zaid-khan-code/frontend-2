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

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    mark: markMutation.mutateAsync,
  };
}
