import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../services/apiClient";

export const DEFAULT_CREDENTIAL_TEMPLATE =
  "*Welcome to ESSPL HR*\n\nHello {employeeName},\n\nYour login account has been created.\n\nEmployee ID: {employeeId}\nEmail: {email}\nPassword: {password}\n\nLogin here: {loginUrl}\n\nPlease change your password after first login.";

export function renderCredentialTemplate(
  template: string | undefined,
  values: {
    employeeName?: string;
    employeeId?: string;
    email?: string;
    password?: string;
    loginUrl?: string;
  },
) {
  const source = template || DEFAULT_CREDENTIAL_TEMPLATE;
  return source.replace(/\{(employeeName|employeeId|email|password|loginUrl)\}/g, (_, key) => {
    const value = values[key as keyof typeof values];
    return value == null || value === "" ? "Not provided" : String(value);
  });
}

function unwrap(data: any) {
  return data?.data ?? data;
}

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data } = await apiClient.get("/accounts");
      return unwrap(data) ?? [];
    },
  });
}

export function useUpdateAccountStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, isActive }: { accountId: string; isActive: boolean }) => {
      const { data } = await apiClient.patch(`/accounts/${encodeURIComponent(accountId)}/status`, {
        is_active: isActive,
      });
      return unwrap(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

export function useCredentialTemplate() {
  return useQuery({
    queryKey: ["accounts", "credential-template"],
    queryFn: async () => {
      const { data } = await apiClient.get("/accounts/settings/credential-template");
      return unwrap(data) ?? { template: DEFAULT_CREDENTIAL_TEMPLATE };
    },
    staleTime: 60_000,
  });
}

export function useUpdateCredentialTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (template: string) => {
      const { data } = await apiClient.put("/accounts/settings/credential-template", { template });
      return unwrap(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", "credential-template"] });
    },
  });
}
