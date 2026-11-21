import { useAllSettings, type SettingsMap } from "./useSettings";

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

function pick(settings: SettingsMap): BrandingConfig {
  const config = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof BrandingConfig)[]) {
    if (settings[key] !== undefined && settings[key] !== null) {
      (config as Record<keyof BrandingConfig, unknown>)[key] = settings[key];
    }
  }
  return config;
}

export function useBranding(): BrandingConfig {
  const { data } = useAllSettings(pick);
  return data || DEFAULTS;
}

export { DEFAULTS as BRANDING_DEFAULTS };
