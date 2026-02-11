import { useEffect } from 'react';
import { useSetting } from '@/hooks/useSettings';
import { hexToHsl } from '@/components/ThemeSettingsPanel';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  destructive: string;
  border: string;
}

const COLOR_MAP: Record<string, string[]> = {
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

function applyColorsToRoot(colors: ThemeColors) {
  const root = document.documentElement;
  Object.entries(COLOR_MAP).forEach(([key, vars]) => {
    const hex = colors[key as keyof ThemeColors];
    if (hex?.startsWith('#')) {
      const hsl = hexToHsl(hex);
      vars.forEach(v => root.style.setProperty(v, hsl));
    }
  });
}

function applyDarkStylesheet(colors: ThemeColors) {
  let style = document.getElementById('dynamic-dark-theme') as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = 'dynamic-dark-theme';
    document.head.appendChild(style);
  }

  const lines: string[] = [];
  Object.entries(COLOR_MAP).forEach(([key, vars]) => {
    const hex = colors[key as keyof ThemeColors];
    if (hex?.startsWith('#')) {
      const hsl = hexToHsl(hex);
      vars.forEach(v => lines.push(`  ${v}: ${hsl};`));
    }
  });

  style.textContent = `.dark {\n${lines.join('\n')}\n}`;
}

export function DynamicTheme() {
  const { data: savedTheme } = useSetting('theme_colors');

  useEffect(() => {
    if (!savedTheme || typeof savedTheme !== 'object') return;

    const theme = savedTheme as Record<string, unknown>;

    // New format with light/dark
    if (theme.light && typeof theme.light === 'object') {
      applyColorsToRoot(theme.light as ThemeColors);
      
      if (theme.darkModeEnabled && theme.dark && typeof theme.dark === 'object') {
        applyDarkStylesheet(theme.dark as ThemeColors);
      } else {
        // Remove dynamic dark styles if disabled
        document.getElementById('dynamic-dark-theme')?.remove();
      }

      if (typeof theme.radius === 'string') {
        document.documentElement.style.setProperty('--radius', theme.radius);
      }
      return;
    }

    // Legacy flat format
    const flat = theme as Record<string, string>;
    Object.entries(COLOR_MAP).forEach(([key, vars]) => {
      const hex = flat[key];
      if (hex?.startsWith('#')) {
        const hsl = hexToHsl(hex);
        vars.forEach(v => document.documentElement.style.setProperty(v, hsl));
      }
    });

    if (flat.radius) {
      document.documentElement.style.setProperty('--radius', flat.radius);
    }
  }, [savedTheme]);

  return null;
}
