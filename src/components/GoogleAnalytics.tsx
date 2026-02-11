import { useEffect } from 'react';
import { useSetting } from '@/hooks/useSettings';

export function GoogleAnalytics() {
  const { data: gaId } = useSetting('google_analytics_id');

  useEffect(() => {
    if (!gaId || typeof gaId !== 'string' || !gaId.startsWith('G-')) return;

    // Don't add twice
    if (document.getElementById('ga-script')) return;

    const script = document.createElement('script');
    script.id = 'ga-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    const inline = document.createElement('script');
    inline.id = 'ga-inline';
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `;
    document.head.appendChild(inline);

    return () => {
      document.getElementById('ga-script')?.remove();
      document.getElementById('ga-inline')?.remove();
    };
  }, [gaId]);

  return null;
}
