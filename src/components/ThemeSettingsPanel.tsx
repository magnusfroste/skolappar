import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Paintbrush, RotateCcw, Sun, Moon } from 'lucide-react';
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
}

interface ThemeData {
  light: ThemeColors;
  dark: ThemeColors;
  radius: string;
  darkModeEnabled: boolean;
}

const LIGHT_DEFAULTS: ThemeColors = {
  primary: '#e85d2a',
  secondary: '#1db8a0',
  accent: '#f0c433',
  background: '#fffdf5',
  foreground: '#1e1e2e',
  card: '#ffffff',
  muted: '#f0ece0',
  destructive: '#e53e3e',
  border: '#e5dfc8',
};

const DARK_DEFAULTS: ThemeColors = {
  primary: '#e85d2a',
  secondary: '#1db8a0',
  accent: '#f0c433',
  background: '#1a1a2e',
  foreground: '#f0ece0',
  card: '#24243b',
  muted: '#2a2a45',
  destructive: '#c53030',
  border: '#353555',
};

const DEFAULT_RADIUS = '1rem';

export function hexToHsl(hex: string): string {
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

export function hslToHex(hsl: string): string {
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

function ColorGrid({ colors, onChange }: { colors: ThemeColors; onChange: (key: keyof ThemeColors, val: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <ColorInput label="Primärfärg" value={colors.primary} onChange={v => onChange('primary', v)} />
      <ColorInput label="Sekundärfärg" value={colors.secondary} onChange={v => onChange('secondary', v)} />
      <ColorInput label="Accentfärg" value={colors.accent} onChange={v => onChange('accent', v)} />
      <ColorInput label="Bakgrund" value={colors.background} onChange={v => onChange('background', v)} />
      <ColorInput label="Text" value={colors.foreground} onChange={v => onChange('foreground', v)} />
      <ColorInput label="Kort" value={colors.card} onChange={v => onChange('card', v)} />
      <ColorInput label="Muted" value={colors.muted} onChange={v => onChange('muted', v)} />
      <ColorInput label="Destructive" value={colors.destructive} onChange={v => onChange('destructive', v)} />
      <ColorInput label="Ramar" value={colors.border} onChange={v => onChange('border', v)} />
    </div>
  );
}

function ColorStrip({ colors }: { colors: ThemeColors }) {
  return (
    <div className="flex gap-1 rounded-xl overflow-hidden h-8">
      {[colors.primary, colors.secondary, colors.accent, colors.background, colors.foreground, colors.muted, colors.destructive].map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

function parseThemeData(saved: unknown): ThemeData | null {
  if (!saved || typeof saved !== 'object') return null;
  const s = saved as Record<string, unknown>;
  
  // Support legacy flat format (migrate to new format)
  if (typeof s.primary === 'string') {
    const legacy = s as Record<string, string>;
    const light: ThemeColors = {
      primary: legacy.primary || LIGHT_DEFAULTS.primary,
      secondary: legacy.secondary || LIGHT_DEFAULTS.secondary,
      accent: legacy.accent || LIGHT_DEFAULTS.accent,
      background: legacy.background || LIGHT_DEFAULTS.background,
      foreground: legacy.foreground || LIGHT_DEFAULTS.foreground,
      card: legacy.card || LIGHT_DEFAULTS.card,
      muted: legacy.muted || LIGHT_DEFAULTS.muted,
      destructive: legacy.destructive || LIGHT_DEFAULTS.destructive,
      border: legacy.border || LIGHT_DEFAULTS.border,
    };
    return { light, dark: DARK_DEFAULTS, radius: legacy.radius || DEFAULT_RADIUS, darkModeEnabled: false };
  }

  const light = (s.light as ThemeColors) || LIGHT_DEFAULTS;
  const dark = (s.dark as ThemeColors) || DARK_DEFAULTS;
  return {
    light: { ...LIGHT_DEFAULTS, ...light },
    dark: { ...DARK_DEFAULTS, ...dark },
    radius: (s.radius as string) || DEFAULT_RADIUS,
    darkModeEnabled: (s.darkModeEnabled as boolean) ?? false,
  };
}

export function ThemeSettingsPanel() {
  const updateSetting = useUpdateSetting();
  const { data: savedTheme } = useSetting('theme_colors');

  const [light, setLight] = useState<ThemeColors>(LIGHT_DEFAULTS);
  const [dark, setDark] = useState<ThemeColors>(DARK_DEFAULTS);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  useEffect(() => {
    const parsed = parseThemeData(savedTheme);
    if (parsed) {
      setLight(parsed.light);
      setDark(parsed.dark);
      setRadius(parsed.radius);
      setDarkModeEnabled(parsed.darkModeEnabled);
    }
  }, [savedTheme]);

  const updateLightColor = (key: keyof ThemeColors, value: string) => {
    setLight(prev => ({ ...prev, [key]: value }));
  };

  const updateDarkColor = (key: keyof ThemeColors, value: string) => {
    setDark(prev => ({ ...prev, [key]: value }));
  };

  const applyPreview = useCallback(() => {
    const root = document.documentElement;
    const applyColors = (colors: ThemeColors, prefix: string) => {
      const map: Record<string, string[]> = {
        primary: [`${prefix}--primary`, `${prefix}--ring`, `${prefix}--sidebar-primary`, `${prefix}--sidebar-ring`, `${prefix}--coral`],
        secondary: [`${prefix}--secondary`],
        accent: [`${prefix}--accent`],
        background: [`${prefix}--background`, `${prefix}--sidebar-background`],
        foreground: [`${prefix}--foreground`, `${prefix}--card-foreground`, `${prefix}--popover-foreground`, `${prefix}--sidebar-foreground`],
        card: [`${prefix}--card`, `${prefix}--popover`],
        muted: [`${prefix}--muted`, `${prefix}--sidebar-accent`],
        destructive: [`${prefix}--destructive`],
        border: [`${prefix}--border`, `${prefix}--input`, `${prefix}--sidebar-border`],
      };
      Object.entries(map).forEach(([key, vars]) => {
        const hex = colors[key as keyof ThemeColors];
        if (hex?.startsWith('#')) {
          const hsl = hexToHsl(hex);
          vars.forEach(v => root.style.setProperty(v, hsl));
        }
      });
    };
    // Apply light to root
    applyColors(light, '');
    root.style.setProperty('--radius', radius);
    toast({ title: 'Förhandsvisning aktiverad' });
  }, [light, radius]);

  const handleSave = async () => {
    try {
      const themeData: ThemeData = { light, dark, radius, darkModeEnabled };
      await updateSetting.mutateAsync({ key: 'theme_colors', value: themeData });
      applyPreview();
      toast({ title: 'Tema sparat!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setLight(LIGHT_DEFAULTS);
    setDark(DARK_DEFAULTS);
    setRadius(DEFAULT_RADIUS);
    setDarkModeEnabled(false);
    const root = document.documentElement;
    const props = ['--primary', '--secondary', '--accent', '--background', '--foreground', '--card', '--muted', '--destructive', '--border', '--input', '--ring', '--radius', '--sidebar-background', '--sidebar-primary', '--sidebar-border', '--sidebar-accent', '--sidebar-ring', '--coral', '--card-foreground', '--popover', '--popover-foreground', '--sidebar-foreground'];
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
          Anpassa färgschema för ljust och mörkt läge.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dark mode enable toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Aktivera dark mode</p>
              <p className="text-xs text-muted-foreground">Låt besökare växla mellan ljust och mörkt</p>
            </div>
          </div>
          <Switch checked={darkModeEnabled} onCheckedChange={setDarkModeEnabled} />
        </div>

        <Tabs defaultValue="light">
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="light" className="gap-1.5">
              <Sun className="h-4 w-4" /> Ljust
            </TabsTrigger>
            <TabsTrigger value="dark" className="gap-1.5" disabled={!darkModeEnabled}>
              <Moon className="h-4 w-4" /> Mörkt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="light" className="space-y-4 mt-4">
            <ColorStrip colors={light} />
            <ColorGrid colors={light} onChange={updateLightColor} />
          </TabsContent>

          <TabsContent value="dark" className="space-y-4 mt-4">
            <ColorStrip colors={dark} />
            <ColorGrid colors={dark} onChange={updateDarkColor} />
          </TabsContent>
        </Tabs>

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
