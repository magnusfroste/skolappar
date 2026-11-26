import { useAllSettings, type SettingsMap } from "./useSettings";

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
  site_url: "https://www.skolappar.org",
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

function pick(settings: SettingsMap): SiteConfig {
  const config = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof SiteConfig)[]) {
    if (settings[key] !== undefined && settings[key] !== null) {
      (config as Record<keyof SiteConfig, unknown>)[key] = settings[key];
    }
  }
  return config;
}

export function useSiteConfig(): SiteConfig {
  const { data } = useAllSettings(pick);
  return data || DEFAULTS;
}

export { DEFAULTS as SITE_CONFIG_DEFAULTS };
