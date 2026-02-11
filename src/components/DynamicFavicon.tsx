import { useEffect } from 'react';
import { useBranding } from '@/hooks/useBranding';

export function DynamicFavicon() {
  const { brand_favicon_url } = useBranding();

  useEffect(() => {
    if (!brand_favicon_url) return;

    let link = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = brand_favicon_url;
    link.type = brand_favicon_url.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }, [brand_favicon_url]);

  return null;
}
