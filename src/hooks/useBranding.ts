import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrandingConfig {
  brand_name: string;
  brand_domain: string;
  brand_tagline: string;
  brand_logo_url: string;
  brand_favicon_url: string;
  brand_primary_emoji: string;
}

const DEFAULTS: BrandingConfig = {
  brand_name: "skolappar",
  brand_domain: "skolappar.com",
  brand_tagline: "Pedagogiska appar av föräldrar för barn",
  brand_logo_url: "",
  brand_favicon_url: "",
  brand_primary_emoji: "📱",
};

export function useBranding(): BrandingConfig {
  const { data } = useQuery({
    queryKey: ["branding-config"],
    queryFn: async () => {
      const keys = Object.keys(DEFAULTS);
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      const config = { ...DEFAULTS };
      data?.forEach((row) => {
        const key = row.key as keyof BrandingConfig;
        if (key in config) {
          (config as any)[key] = row.value;
        }
      });
      return config;
    },
    staleTime: 5 * 60 * 1000,
  });

  return data || DEFAULTS;
}

export { DEFAULTS as BRANDING_DEFAULTS };
