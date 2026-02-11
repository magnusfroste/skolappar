import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Globe, Search } from 'lucide-react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { SITE_CONFIG_DEFAULTS } from '@/hooks/useSiteConfig';
import { toast } from '@/hooks/use-toast';

export function SeoSettingsPanel() {
  const updateSetting = useUpdateSetting();

  // Individual settings
  const { data: siteName } = useSetting('site_name');
  const { data: siteUrl } = useSetting('site_url');
  const { data: siteDescription } = useSetting('site_description');
  const { data: siteLanguage } = useSetting('site_language');
  const { data: siteLocale } = useSetting('site_locale');
  const { data: siteCurrency } = useSetting('site_currency');
  const { data: siteKeywords } = useSetting('site_keywords');
  const { data: siteImage } = useSetting('site_image');
  const { data: siteLogo } = useSetting('site_logo');
  const { data: organizationName } = useSetting('organization_name');
  const { data: faqItems } = useSetting('faq_items');

  const [form, setForm] = useState({
    site_name: '',
    site_url: '',
    site_description: '',
    site_language: '',
    site_locale: '',
    site_currency: '',
    site_keywords: '',
    site_image: '',
    site_logo: '',
    organization_name: '',
  });

  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  // Sync from DB
  useEffect(() => {
    setForm({
      site_name: (siteName as string) || SITE_CONFIG_DEFAULTS.site_name,
      site_url: (siteUrl as string) || SITE_CONFIG_DEFAULTS.site_url,
      site_description: (siteDescription as string) || SITE_CONFIG_DEFAULTS.site_description,
      site_language: (siteLanguage as string) || SITE_CONFIG_DEFAULTS.site_language,
      site_locale: (siteLocale as string) || SITE_CONFIG_DEFAULTS.site_locale,
      site_currency: (siteCurrency as string) || SITE_CONFIG_DEFAULTS.site_currency,
      site_keywords: (siteKeywords as string) || SITE_CONFIG_DEFAULTS.site_keywords,
      site_image: (siteImage as string) || '',
      site_logo: (siteLogo as string) || '',
      organization_name: (organizationName as string) || SITE_CONFIG_DEFAULTS.organization_name,
    });
  }, [siteName, siteUrl, siteDescription, siteLanguage, siteLocale, siteCurrency, siteKeywords, siteImage, siteLogo, organizationName]);

  useEffect(() => {
    if (Array.isArray(faqItems) && faqItems.length > 0) {
      setFaqs(faqItems as Array<{ question: string; answer: string }>);
    }
  }, [faqItems]);

  const handleSave = async () => {
    try {
      const entries = Object.entries(form);
      for (const [key, value] of entries) {
        await updateSetting.mutateAsync({ key, value });
      }
      await updateSetting.mutateAsync({ key: 'faq_items', value: faqs });
      toast({ title: 'SEO-inställningar sparade!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addFaq = () => {
    setFaqs(prev => [...prev, { question: '', answer: '' }]);
  };

  const updateFaq = (index: number, field: 'question' | 'answer', value: string) => {
    setFaqs(prev => prev.map((faq, i) => i === index ? { ...faq, [field]: value } : faq));
  };

  const removeFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SEO-inställningar
          </CardTitle>
          <CardDescription>
            Grundläggande SEO-data som används i metataggar och schema.
            Anpassa för ditt land och språk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sidnamn</Label>
              <Input value={form.site_name} onChange={e => updateField('site_name', e.target.value)} placeholder="Min App" />
            </div>
            <div className="space-y-2">
              <Label>Organisation</Label>
              <Input value={form.organization_name} onChange={e => updateField('organization_name', e.target.value)} placeholder="Organisation" />
            </div>
            <div className="space-y-2">
              <Label>Sidans URL</Label>
              <Input value={form.site_url} onChange={e => updateField('site_url', e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="space-y-2">
              <Label>Språk</Label>
              <Input value={form.site_language} onChange={e => updateField('site_language', e.target.value)} placeholder="sv" />
              <p className="text-xs text-muted-foreground">ISO 639-1 (t.ex. sv, en, no, da)</p>
            </div>
            <div className="space-y-2">
              <Label>Locale</Label>
              <Input value={form.site_locale} onChange={e => updateField('site_locale', e.target.value)} placeholder="sv_SE" />
              <p className="text-xs text-muted-foreground">t.ex. sv_SE, en_US, nb_NO</p>
            </div>
            <div className="space-y-2">
              <Label>Valuta</Label>
              <Input value={form.site_currency} onChange={e => updateField('site_currency', e.target.value)} placeholder="SEK" />
              <p className="text-xs text-muted-foreground">ISO 4217 (t.ex. SEK, EUR, USD)</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Beskrivning</Label>
            <Textarea value={form.site_description} onChange={e => updateField('site_description', e.target.value)} placeholder="Kort beskrivning av sidan..." rows={2} />
            <p className="text-xs text-muted-foreground">{form.site_description.length}/160 tecken</p>
          </div>

          <div className="space-y-2">
            <Label>Nyckelord</Label>
            <Input value={form.site_keywords} onChange={e => updateField('site_keywords', e.target.value)} placeholder="ord1, ord2, ord3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>OG-bild (URL)</Label>
              <Input value={form.site_image} onChange={e => updateField('site_image', e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Logotyp (URL)</Label>
              <Input value={form.site_logo} onChange={e => updateField('site_logo', e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AEO / FAQ Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            AEO – Vanliga frågor (FAQ Schema)
          </CardTitle>
          <CardDescription>
            Frågor och svar som AI-sökmotorer (Google AI Overview, ChatGPT m.fl.) kan använda för direkta svar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-lg border space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium text-muted-foreground">Fråga {i + 1}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeFaq(i)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={faq.question}
                onChange={e => updateFaq(i, 'question', e.target.value)}
                placeholder="Ställ en fråga..."
              />
              <Textarea
                value={faq.answer}
                onChange={e => updateFaq(i, 'answer', e.target.value)}
                placeholder="Svar..."
                rows={2}
              />
            </div>
          ))}

          <Button variant="outline" onClick={addFaq} className="gap-2">
            <Plus className="h-4 w-4" />
            Lägg till fråga
          </Button>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateSetting.isPending} className="w-full sm:w-auto">
        {updateSetting.isPending ? 'Sparar...' : 'Spara alla SEO/AEO-inställningar'}
      </Button>
    </div>
  );
}
