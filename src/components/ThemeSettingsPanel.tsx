import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Paintbrush, RotateCcw } from 'lucide-react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';

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
  radius: string;
}

const DEFAULTS: ThemeColors = {
  primary: '#e85d2a',
  secondary: '#1db8a0',
  accent: '#f0c433',
  background: '#fffdf5',
  foreground: '#1e1e2e',
  card: '#ffffff',
  muted: '#f0ece0',
  destructive: '#e53e3e',
  border: '#e5dfc8',
  radius: '1rem',
};

function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return '#000000';

  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border cursor-pointer p-0.5"
        />
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="font-mono text-xs h-10"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}

export function ThemeSettingsPanel() {
  const updateSetting = useUpdateSetting();
  const { data: savedTheme } = useSetting('theme_colors');

  const [colors, setColors] = useState<ThemeColors>(DEFAULTS);
  const [radius, setRadius] = useState(DEFAULTS.radius);

  useEffect(() => {
    if (savedTheme && typeof savedTheme === 'object') {
      const theme = savedTheme as Record<string, string>;
      setColors({
        primary: theme.primary || DEFAULTS.primary,
        secondary: theme.secondary || DEFAULTS.secondary,
        accent: theme.accent || DEFAULTS.accent,
        background: theme.background || DEFAULTS.background,
        foreground: theme.foreground || DEFAULTS.foreground,
        card: theme.card || DEFAULTS.card,
        muted: theme.muted || DEFAULTS.muted,
        destructive: theme.destructive || DEFAULTS.destructive,
        border: theme.border || DEFAULTS.border,
        radius: theme.radius || DEFAULTS.radius,
      });
      setRadius(theme.radius || DEFAULTS.radius);
    }
  }, [savedTheme]);

  const updateColor = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const applyPreview = useCallback(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', hexToHsl(colors.primary));
    root.style.setProperty('--secondary', hexToHsl(colors.secondary));
    root.style.setProperty('--accent', hexToHsl(colors.accent));
    root.style.setProperty('--background', hexToHsl(colors.background));
    root.style.setProperty('--foreground', hexToHsl(colors.foreground));
    root.style.setProperty('--card', hexToHsl(colors.card));
    root.style.setProperty('--muted', hexToHsl(colors.muted));
    root.style.setProperty('--destructive', hexToHsl(colors.destructive));
    root.style.setProperty('--border', hexToHsl(colors.border));
    root.style.setProperty('--input', hexToHsl(colors.border));
    root.style.setProperty('--ring', hexToHsl(colors.primary));
    root.style.setProperty('--radius', radius);
    // Sidebar
    root.style.setProperty('--sidebar-background', hexToHsl(colors.background));
    root.style.setProperty('--sidebar-primary', hexToHsl(colors.primary));
    root.style.setProperty('--sidebar-border', hexToHsl(colors.border));
    root.style.setProperty('--sidebar-accent', hexToHsl(colors.muted));
  }, [colors, radius]);

  const handleSave = async () => {
    try {
      const themeData = { ...colors, radius };
      await updateSetting.mutateAsync({ key: 'theme_colors', value: themeData });
      applyPreview();
      toast({ title: 'Tema sparat!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setColors(DEFAULTS);
    setRadius(DEFAULTS.radius);
    // Remove inline styles to revert to CSS defaults
    const root = document.documentElement;
    const props = ['--primary', '--secondary', '--accent', '--background', '--foreground', '--card', '--muted', '--destructive', '--border', '--input', '--ring', '--radius', '--sidebar-background', '--sidebar-primary', '--sidebar-border', '--sidebar-accent'];
    props.forEach(p => root.style.removeProperty(p));
    toast({ title: 'Tema återställt till standard' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paintbrush className="h-5 w-5" />
          Tema & färger
        </CardTitle>
        <CardDescription>
          Anpassa appens färgschema. Förhandsgranska innan du sparar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview strip */}
        <div className="flex gap-1 rounded-xl overflow-hidden h-8">
          {[colors.primary, colors.secondary, colors.accent, colors.background, colors.foreground, colors.muted, colors.destructive].map((c, i) => (
            <div key={i} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <ColorInput label="Primärfärg" value={colors.primary} onChange={v => updateColor('primary', v)} />
          <ColorInput label="Sekundärfärg" value={colors.secondary} onChange={v => updateColor('secondary', v)} />
          <ColorInput label="Accentfärg" value={colors.accent} onChange={v => updateColor('accent', v)} />
          <ColorInput label="Bakgrund" value={colors.background} onChange={v => updateColor('background', v)} />
          <ColorInput label="Text" value={colors.foreground} onChange={v => updateColor('foreground', v)} />
          <ColorInput label="Kort" value={colors.card} onChange={v => updateColor('card', v)} />
          <ColorInput label="Muted" value={colors.muted} onChange={v => updateColor('muted', v)} />
          <ColorInput label="Destructive" value={colors.destructive} onChange={v => updateColor('destructive', v)} />
          <ColorInput label="Ramar" value={colors.border} onChange={v => updateColor('border', v)} />
        </div>

        <div className="space-y-2 max-w-xs">
          <Label>Border radius</Label>
          <Input value={radius} onChange={e => setRadius(e.target.value)} placeholder="1rem" />
          <p className="text-xs text-muted-foreground">t.ex. 0.5rem, 1rem, 1.5rem</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={applyPreview}>
            Förhandsgranska
          </Button>
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? 'Sparar...' : 'Spara tema'}
          </Button>
          <Button variant="ghost" onClick={handleReset} className="gap-1.5 text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
            Återställ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Export conversion utils for DynamicTheme
export { hexToHsl, hslToHex };
