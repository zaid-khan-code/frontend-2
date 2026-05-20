import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export function useLeaves(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leave-requests', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/leave-requests', { params });
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/leave-requests', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/leave-requests/${id}/approve`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string, reason: string }) => {
      const { data } = await apiClient.patch(`/leave-requests/${id}/reject`, { reason });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  const earlyReturnMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string, actual_end_date?: string, is_forced?: boolean }) => {
      const { data } = await apiClient.patch(`/leave-requests/${id}/early-return`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
    },
  });

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    create: createMutation.mutateAsync,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    earlyReturn: earlyReturnMutation.mutateAsync,
  };
}
