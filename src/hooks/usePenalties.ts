import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export function usePenalties(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['penalties', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/penalties', { params });
      return data;
    },
  });

  const proposeMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await apiClient.post('/penalties', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string, amount: number, notes?: string }) => {
      const { data } = await apiClient.patch(`/penalties/${id}/approve`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string, notes?: string }) => {
      const { data } = await apiClient.patch(`/penalties/${id}/reject`, payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.patch(`/penalties/${id}/ack`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['penalties'] });
    },
  });

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    propose: proposeMutation.mutateAsync,
    approve: approveMutation.mutateAsync,
    reject: rejectMutation.mutateAsync,
    acknowledge: acknowledgeMutation.mutateAsync,
  };
}
