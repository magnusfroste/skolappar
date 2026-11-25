import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Loader2, Rocket } from 'lucide-react';
import { Kotten } from '@/components/Kotten';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useSubmitSuggestion } from '@/hooks/useSubmitApp';
import { ApiError } from '@/lib/api';

const isHttpUrl = (value: string) => {
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && value.length <= 2048;
  } catch {
    return false;
  }
};

function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Du har skickat många tips på kort tid. Vänta en stund och försök igen.';
    if (err.status === 409) return 'Den här appen finns redan på Skolappar.';
    if (err.status === 400) return 'Kontrollera länken och e-postadressen.';
  }
  return 'Något gick fel. Försök igen om en stund.';
}

export default function SuggestApp() {
  const submit = useSubmitSuggestion();
  // A builder (Shipholm Studio's "Share on Skolappar") may fill in what it knows: ?url=…&title=…&description=…
  const [given] = useSearchParams();
  const from = (key: string, max: number) => (given.get(key) || '').slice(0, max);
  const [url, setUrl] = useState(() => (/^https:\/\//i.test(from('url', 2048)) ? from('url', 2048) : ''));
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState(() => from('title', 120));
  const [description, setDescription] = useState(() => from('description', 500));
  const [note, setNote] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const normalizedUrl = url.trim() && !/^https?:\/\//i.test(url.trim()) ? `https://${url.trim()}` : url.trim();
  const urlOk = isHttpUrl(normalizedUrl);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!urlOk || !emailOk || !terms) return;
    try {
      await submit.mutateAsync({
        url: normalizedUrl,
        email: email.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        note: note.trim() || undefined,
        website: website || undefined,
        accept_terms: true,
      });
      setDone(true);
    } catch {
      /* shown below */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO title="Tipsa om en app" description="Har du byggt eller hittat en bra skolapp? Tipsa oss så granskar vi den." url="/tipsa" />
      <PublicNav variant="solid" />
      <main className="container max-w-2xl mx-auto px-4 py-10">
        {done ? (
          <Card className="text-center">
            <CardContent className="py-10 space-y-4">
              <Kotten mood="vantar" className="h-28 w-28 mx-auto" title="Kotten väntar på din bekräftelse" />
              <h1 className="text-2xl font-heading font-bold">Tack för tipset!</h1>
              <p className="text-muted-foreground">
                Vi tittar på appen och lägger upp den om den passar. Vi har skickat ett mejl där du kan bekräfta
                din adress, så hör vi av oss när appen är publicerad.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button asChild variant="outline"><Link to="/">Till startsidan</Link></Button>
                <Button onClick={() => { setDone(false); setUrl(''); setTitle(''); setDescription(''); setNote(''); setTerms(false); setTouched(false); }}>
                  Tipsa om en till
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Rocket className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-2xl font-semibold leading-none tracking-tight">Tipsa om en app</h1>
              </div>
              <CardDescription>
                Har du byggt en skolapp – eller hittat en riktigt bra? Skicka länken så granskar vi den innan
                den visas på Skolappar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="url">Länk till appen *</Label>
                  <Input id="url" inputMode="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={2048} aria-invalid={touched && !urlOk} />
                  {touched && !urlOk && <p className="text-sm text-destructive">Ange en giltig länk (http eller https).</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Din e-postadress *</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="namn@exempel.se" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} aria-invalid={touched && !emailOk} />
                  <p className="text-xs text-muted-foreground">Visas inte på sajten. Vi använder den bara för att höra av oss om appen.</p>
                  {touched && !emailOk && <p className="text-sm text-destructive">Ange en giltig e-postadress.</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Appens namn (valfritt)</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Kort beskrivning (valfritt)</Label>
                  <Textarea id="description" className="resize-none h-20" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="Vad övar man på, och för vilken ålder?" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Meddelande till oss (valfritt)</Label>
                  <Textarea id="note" className="resize-none h-24" value={note} onChange={(e) => setNote(e.target.value)} maxLength={2000} />
                </div>
                {/* Honeypot for bots – hidden from people and screen readers. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Webbplats</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>
                {submit.isError && <p className="text-sm text-destructive" role="alert">{errorMessage(submit.error)}</p>}
                <div className="space-y-1">
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" checked={terms} onCheckedChange={(v) => setTerms(v === true)} aria-invalid={touched && !terms} className="mt-0.5" />
                    <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                      Jag har läst och godkänner <Link to="/villkor" target="_blank" className="underline">villkoren</Link> *
                    </Label>
                  </div>
                  {touched && !terms && <p className="text-sm text-destructive">Du behöver godkänna villkoren för att skicka.</p>}
                  <p className="text-xs text-muted-foreground">
                    Så hanterar vi din e-postadress: <Link to="/integritet" className="underline">integritetspolicyn</Link>.
                  </p>
                </div>
                <Button type="submit" size="lg" className="w-full gap-2" disabled={submit.isPending}>
                  {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  Skicka tips
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </main>
      <PublicFooter />
    </div>
  );
}
