import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, adminApi } from "@/lib/api";

export type SettingsMap = Record<string, unknown>;

/** All settings in one request (they are small and public), shared by every hook below. */
export const useAllSettings = <T = SettingsMap>(select?: (s: SettingsMap) => T) =>
  useQuery({
    queryKey: ["settings"],
    queryFn: () => api.get<SettingsMap>("/api/settings"),
    staleTime: 5 * 60 * 1000,
    select,
  });

export const useSetting = (key: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useAllSettings<any>((s) => (key in s ? s[key] : null));
};

export const useUpdateSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      adminApi.put(`/api/admin/settings/${encodeURIComponent(key)}`, { value: (value ?? null) as never }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};
