import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Type, RotateCcw } from 'lucide-react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';

const FONT_OPTIONS = [
  { value: 'Nunito', label: 'Nunito', category: 'Rounded' },
  { value: 'Quicksand', label: 'Quicksand', category: 'Rounded' },
  { value: 'Inter', label: 'Inter', category: 'Sans-serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Sans-serif' },
  { value: 'Roboto', label: 'Roboto', category: 'Sans-serif' },
  { value: 'Open Sans', label: 'Open Sans', category: 'Sans-serif' },
  { value: 'Lato', label: 'Lato', category: 'Sans-serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Sans-serif' },
  { value: 'Raleway', label: 'Raleway', category: 'Sans-serif' },
  { value: 'Source Sans 3', label: 'Source Sans 3', category: 'Sans-serif' },
  { value: 'DM Sans', label: 'DM Sans', category: 'Sans-serif' },
  { value: 'Space Grotesk', label: 'Space Grotesk', category: 'Sans-serif' },
  { value: 'Outfit', label: 'Outfit', category: 'Sans-serif' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', category: 'Sans-serif' },
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Serif' },
  { value: 'Merriweather', label: 'Merriweather', category: 'Serif' },
  { value: 'Lora', label: 'Lora', category: 'Serif' },
  { value: 'PT Serif', label: 'PT Serif', category: 'Serif' },
  { value: 'Bitter', label: 'Bitter', category: 'Serif' },
  { value: 'Fira Code', label: 'Fira Code', category: 'Mono' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono', category: 'Mono' },
];

const DEFAULTS = { heading: 'Nunito', body: 'Quicksand' };

function loadGoogleFont(fontName: string) {
  const id = `google-font-${fontName.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700;800;900&display=swap`;
  document.head.appendChild(link);
}

export function FontSettingsPanel() {
  const updateSetting = useUpdateSetting();
  const { data: savedFonts } = useSetting('theme_fonts');

  const [heading, setHeading] = useState(DEFAULTS.heading);
  const [body, setBody] = useState(DEFAULTS.body);

  useEffect(() => {
    if (savedFonts && typeof savedFonts === 'object') {
      const f = savedFonts as Record<string, string>;
      if (f.heading) setHeading(f.heading);
      if (f.body) setBody(f.body);
    }
  }, [savedFonts]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'theme_fonts', value: { heading, body } });
      loadGoogleFont(heading);
      loadGoogleFont(body);
      document.documentElement.style.setProperty('--font-heading', `"${heading}", system-ui, sans-serif`);
      document.documentElement.style.setProperty('--font-body', `"${body}", system-ui, sans-serif`);
      toast({ title: 'Typsnitt sparat!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const handleReset = () => {
    setHeading(DEFAULTS.heading);
    setBody(DEFAULTS.body);
    document.documentElement.style.removeProperty('--font-heading');
    document.documentElement.style.removeProperty('--font-body');
    toast({ title: 'Typsnitt återställt' });
  };

  const preview = (font: string) => {
    loadGoogleFont(font);
    return { fontFamily: `"${font}", system-ui, sans-serif` };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Typsnitt
        </CardTitle>
        <CardDescription>Välj typsnitt för rubriker och brödtext.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preview */}
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="text-lg font-bold" style={preview(heading)}>
            Rubrikexempel — {heading}
          </h3>
          <p className="text-sm text-muted-foreground" style={preview(body)}>
            Brödtext visas med {body}. Skolappar hjälper lärare hitta digitala verktyg.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Rubrikfont</Label>
            <Select value={heading} onValueChange={setHeading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: `"${f.value}", sans-serif` }}>{f.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({f.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Brödtextfont</Label>
            <Select value={body} onValueChange={setBody}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    <span style={{ fontFamily: `"${f.value}", sans-serif` }}>{f.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({f.category})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleSave} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? 'Sparar...' : 'Spara typsnitt'}
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
