import { useEffect } from 'react';
import { useSetting } from '@/hooks/useSettings';

function loadGoogleFont(fontName: string) {
  const id = `google-font-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

export function DynamicFont() {
  const { data: savedFonts } = useSetting('theme_fonts');

  useEffect(() => {
    if (!savedFonts || typeof savedFonts !== 'object') return;
    const fonts = savedFonts as Record<string, string>;

    if (fonts.heading) {
      loadGoogleFont(fonts.heading);
      document.documentElement.style.setProperty('--font-heading', `"${fonts.heading}", system-ui, sans-serif`);
    }
    if (fonts.body) {
      loadGoogleFont(fonts.body);
      document.documentElement.style.setProperty('--font-body', `"${fonts.body}", system-ui, sans-serif`);
    }
  }, [savedFonts]);

  return null;
}
