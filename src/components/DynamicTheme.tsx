import { useEffect } from 'react';
import { useSetting } from '@/hooks/useSettings';
import { hexToHsl } from '@/components/ThemeSettingsPanel';

export function DynamicTheme() {
  const { data: savedTheme } = useSetting('theme_colors');

  useEffect(() => {
    if (!savedTheme || typeof savedTheme !== 'object') return;

    const theme = savedTheme as Record<string, string>;
    const root = document.documentElement;

    const colorMap: Record<string, string[]> = {
      primary: ['--primary', '--ring', '--sidebar-primary', '--sidebar-ring', '--coral'],
      secondary: ['--secondary'],
      accent: ['--accent'],
      background: ['--background', '--sidebar-background'],
      foreground: ['--foreground', '--card-foreground', '--popover-foreground', '--sidebar-foreground'],
      card: ['--card', '--popover'],
      muted: ['--muted', '--sidebar-accent'],
      destructive: ['--destructive'],
      border: ['--border', '--input', '--sidebar-border'],
    };

    Object.entries(colorMap).forEach(([key, vars]) => {
      const hex = theme[key];
      if (hex && hex.startsWith('#')) {
        const hsl = hexToHsl(hex);
        vars.forEach(v => root.style.setProperty(v, hsl));
      }
    });

    if (theme.radius) {
      root.style.setProperty('--radius', theme.radius);
    }
  }, [savedTheme]);

  return null;
}
