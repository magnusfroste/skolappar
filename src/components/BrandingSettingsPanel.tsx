import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Palette, Upload, Loader2 } from 'lucide-react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { BRANDING_DEFAULTS } from '@/hooks/useBranding';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function BrandingSettingsPanel() {
  const updateSetting = useUpdateSetting();

  const { data: brandName } = useSetting('brand_name');
  const { data: brandDomain } = useSetting('brand_domain');
  const { data: brandTagline } = useSetting('brand_tagline');
  const { data: brandLogoUrl } = useSetting('brand_logo_url');
  const { data: brandFaviconUrl } = useSetting('brand_favicon_url');
  const { data: brandEmoji } = useSetting('brand_primary_emoji');

  const [form, setForm] = useState({
    brand_name: '',
    brand_domain: '',
    brand_tagline: '',
    brand_logo_url: '',
    brand_favicon_url: '',
    brand_primary_emoji: '',
  });

  const [uploading, setUploading] = useState<'logo' | 'favicon' | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      brand_name: (brandName as string) || BRANDING_DEFAULTS.brand_name,
      brand_domain: (brandDomain as string) || BRANDING_DEFAULTS.brand_domain,
      brand_tagline: (brandTagline as string) || BRANDING_DEFAULTS.brand_tagline,
      brand_logo_url: (brandLogoUrl as string) || '',
      brand_favicon_url: (brandFaviconUrl as string) || '',
      brand_primary_emoji: (brandEmoji as string) || BRANDING_DEFAULTS.brand_primary_emoji,
    });
  }, [brandName, brandDomain, brandTagline, brandLogoUrl, brandFaviconUrl, brandEmoji]);

  const handleUpload = async (file: File, type: 'logo' | 'favicon') => {
    setUploading(type);
    try {
      const ext = file.name.split('.').pop();
      const path = `${type}.${ext}`;

      // Remove old file first
      await supabase.storage.from('branding').remove([path]);

      const { error } = await supabase.storage
        .from('branding')
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('branding')
        .getPublicUrl(path);

      const url = `${urlData.publicUrl}?v=${Date.now()}`;
      const key = type === 'logo' ? 'brand_logo_url' : 'brand_favicon_url';
      setForm(prev => ({ ...prev, [key]: url }));
      toast({ title: `${type === 'logo' ? 'Logotyp' : 'Favicon'} uppladdad!` });
    } catch (err) {
      toast({ title: 'Uppladdning misslyckades', variant: 'destructive' });
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(form)) {
        await updateSetting.mutateAsync({ key, value });
      }
      toast({ title: 'Branding sparad!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Branding
        </CardTitle>
        <CardDescription>
          Namn, logotyp, favicon och övrig branding. Anpassa för din egen instans.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Appnamn</Label>
            <Input value={form.brand_name} onChange={e => updateField('brand_name', e.target.value)} placeholder="skolappar" />
          </div>
          <div className="space-y-2">
            <Label>Domän</Label>
            <Input value={form.brand_domain} onChange={e => updateField('brand_domain', e.target.value)} placeholder="skolappar.com" />
          </div>
          <div className="space-y-2">
            <Label>Tagline</Label>
            <Input value={form.brand_tagline} onChange={e => updateField('brand_tagline', e.target.value)} placeholder="Pedagogiska appar..." />
          </div>
          <div className="space-y-2">
            <Label>Primär emoji</Label>
            <Input value={form.brand_primary_emoji} onChange={e => updateField('brand_primary_emoji', e.target.value)} placeholder="📱" className="w-20" />
          </div>
        </div>

        {/* Logo upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>Logotyp</Label>
            <div className="flex items-center gap-4">
              {form.brand_logo_url ? (
                <img src={form.brand_logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-contain border" />
              ) : (
                <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-xs">?</div>
              )}
              <div className="space-y-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'logo')}
                />
                <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploading === 'logo'}>
                  {uploading === 'logo' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Ladda upp
                </Button>
              </div>
            </div>
            <Input value={form.brand_logo_url} onChange={e => updateField('brand_logo_url', e.target.value)} placeholder="Eller klistra in URL..." className="text-xs" />
          </div>

          {/* Favicon upload */}
          <div className="space-y-3">
            <Label>Favicon</Label>
            <div className="flex items-center gap-4">
              {form.brand_favicon_url ? (
                <img src={form.brand_favicon_url} alt="Favicon" className="h-8 w-8 rounded object-contain border" />
              ) : (
                <div className="h-8 w-8 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground text-[10px]">?</div>
              )}
              <div className="space-y-1">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'favicon')}
                />
                <Button variant="outline" size="sm" onClick={() => faviconInputRef.current?.click()} disabled={uploading === 'favicon'}>
                  {uploading === 'favicon' ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                  Ladda upp
                </Button>
              </div>
            </div>
            <Input value={form.brand_favicon_url} onChange={e => updateField('brand_favicon_url', e.target.value)} placeholder="Eller klistra in URL..." className="text-xs" />
          </div>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending} className="w-full sm:w-auto">
          {updateSetting.isPending ? 'Sparar...' : 'Spara branding'}
        </Button>
      </CardContent>
    </Card>
  );
}
