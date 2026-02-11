import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteConfig {
  site_name: string;
  site_url: string;
  site_description: string;
  site_language: string;
  site_locale: string;
  site_currency: string;
  site_keywords: string;
  site_image: string;
  site_logo: string;
  organization_name: string;
  faq_items: Array<{ question: string; answer: string }>;
}

const DEFAULTS: SiteConfig = {
  site_name: "Skolappar",
  site_url: "https://skolappar.com",
  site_description:
    "En community där engagerade föräldrar delar sina hemmagjorda skolappar. Utforska pedagogiska appar för barn i alla åldrar. Delad glädje är dubbel glädje!",
  site_language: "sv",
  site_locale: "sv_SE",
  site_currency: "SEK",
  site_keywords:
    "skolappar, pedagogiska appar, barn, föräldrar, utbildning, lärande, vibe-coding",
  site_image: "",
  site_logo: "",
  organization_name: "Skolappar",
  faq_items: [],
};

export function useSiteConfig(): SiteConfig {
  const { data } = useQuery({
    queryKey: ["site-config"],
    queryFn: async () => {
      const keys = Object.keys(DEFAULTS);
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      const config = { ...DEFAULTS };
      data?.forEach((row) => {
        const key = row.key as keyof SiteConfig;
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

export { DEFAULTS as SITE_CONFIG_DEFAULTS };
