import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';

export function useEmployees(params?: any) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/employees', { params });
      // Depending on backend, it might return { data: { employees: [], total: x, page: y } }
      // The instructions say "Implement pagination and search/filter parameters" so we can assume it takes query params.
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newEmployee: any) => {
      const { data } = await apiClient.post('/employees', newEmployee);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { data } = await apiClient.patch(`/employees/${id}`, updates);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: { ids: string[]; updates: any }) => {
      const { data } = await apiClient.patch('/employees/bulk', { ids, updates });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  return {
    data: query.data?.data || [],
    pagination: query.data?.pagination,
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
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/employees/${encodeURIComponent(id)}`);
      return data.data;
    },
    enabled: !!id
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
