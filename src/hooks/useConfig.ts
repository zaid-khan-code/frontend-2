import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

// Generic hook factory for basic config entities
export function createConfigHook<T>(entityName: string) {
  const queryKey = ["config", entityName];

  return function useEntityConfig() {
    const queryClient = useQueryClient();

    const query = useQuery({
      queryKey,
      queryFn: async () => {
        const { data } = await apiClient.get(`/config/${entityName}`);
        return data.data as T[];
      },
    });

    const createMutation = useMutation({
      mutationFn: async (newItem: Partial<T>) => {
        const { data } = await apiClient.post(`/config/${entityName}`, newItem);
        return data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });

    const updateMutation = useMutation({
      mutationFn: async ({
        id,
        updates,
      }: {
        id: string;
        updates: Partial<T>;
      }) => {
        const { data } = await apiClient.patch(
          `/config/${entityName}/${id}`,
          updates,
        );
        return data.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });

    return {
      data: query.data || [],
      isLoading: query.isLoading,
      isError: query.isError,
      create: createMutation.mutateAsync,
      update: updateMutation.mutateAsync,
    };
  };
}

// Specific hooks
export const useDepartments = createConfigHook<any>("departments");
export const useDesignations = createConfigHook<any>("designations");
export const useEmploymentTypes = createConfigHook<any>("employment-types");
export const useJobStatuses = createConfigHook<any>("job-statuses");
export const useWorkModes = createConfigHook<any>("work-modes");
export const useWorkLocations = createConfigHook<any>("work-locations");
export const useShifts = createConfigHook<any>("shifts");
export const useLeaveTypes = createConfigHook<any>("leave-types");
export const useLeavePolicies = createConfigHook<any>("leave-policies");
export const useAllowanceTypes = createConfigHook<any>("allowance-types");
export const useRoles = createConfigHook<any>("roles");
export const useReportingManagers = createConfigHook<any>("reporting-managers");
