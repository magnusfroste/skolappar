import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Flag, Loader2, Search, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Kotten } from '@/components/Kotten';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApps, type App } from '@/hooks/useApps';
import { api, ApiError } from '@/lib/api';

const REASONS = [
  { id: 'inappropriate', label: 'Olämpligt innehåll', hint: 'Språk, bilder eller annat som inte passar barn' },
  { id: 'mistagged', label: 'Fel ämne eller ålder', hint: 'Appen ligger under fel ämne eller årskurs' },
  { id: 'broken', label: 'Fungerar inte', hint: 'Appen startar inte, eller något går sönder' },
  { id: 'other', label: 'Annat', hint: 'Beskriv vad det gäller' },
] as const;
type Reason = (typeof REASONS)[number]['id'];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

function errorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Du har skickat många rapporter på kort tid. Vänta en stund och försök igen.';
    if (err.status === 404) return 'Appen finns inte längre i katalogen.';
    if (err.status === 400) return 'Kontrollera fälten och försök igen.';
  }
  return 'Något gick fel. Försök igen om en stund.';
}

function AppThumb({ app }: { app: App }) {
  return app.image_url
    ? <img src={app.image_url} alt="" className="h-12 w-16 shrink-0 rounded-md border object-cover" />
    : <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border bg-muted text-lg">📱</div>;
}

/** /rapportera – anyone can flag a listed app; the owner and Hermes see it at once (admin → Rapporter). */
export default function ReportApp() {
  const [params] = useSearchParams();
  const { data: apps } = useApps({});
  const [picked, setPicked] = useState<string | null>(() => params.get('app'));
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState<Reason | ''>('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);

  const app = apps?.find((a) => a.id === picked) ?? null;
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !apps) return [];
    return apps.filter((a) => a.title.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)).slice(0, 6);
  }, [apps, query]);

  const send = useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/api/reports', {
      app_id: picked, reason, ...(message.trim() ? { message: message.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}), ...(website ? { website } : {}),
    }),
  });

  const needsText = reason === 'other' && !message.trim();
  const emailOk = !email.trim() || isEmail(email);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!app || !reason || needsText || !emailOk) return;
    try { await send.mutateAsync(); setDone(true); } catch { /* shown below */ }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO title="Rapportera en app" description="Har du hittat en app med olämpligt innehåll, fel ämne eller ålder, eller som inte fungerar? Berätta för oss." url="/rapportera" />
      <PublicNav variant="solid" />
      <main className="container max-w-2xl mx-auto px-4 py-10">
        {done ? (
          <Card className="text-center">
            <CardContent className="py-10 space-y-4">
              <Kotten mood="gillar" className="h-28 w-28 mx-auto" title="Kotten tackar" />
              <h1 className="text-2xl font-heading font-bold">Tack för att du säger till!</h1>
              <p className="text-muted-foreground">
                Vi tittar på {app?.title ?? 'appen'} så snart vi kan. Är innehållet olämpligt tas appen bort ur katalogen direkt.
                {email.trim() ? ' Vi hör av oss om vi behöver veta mer.' : ''}
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button asChild variant="outline"><Link to="/apps">Till apparna</Link></Button>
                <Button onClick={() => { setDone(false); setPicked(null); setReason(''); setMessage(''); setTouched(false); }}>Rapportera en till</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-primary/10 rounded-lg"><Flag className="h-5 w-5 text-primary" /></div>
                <h1 className="text-2xl font-semibold leading-none tracking-tight">Rapportera en app</h1>
              </div>
              <CardDescription>
                Har du hittat något som inte ska finnas här, eller en app som ligger fel? Berätta, så tittar vi på den.
                Du behöver inte lämna några uppgifter om dig själv.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="app-search">Vilken app? *</Label>
                  {app ? (
                    <div className="flex items-center gap-3 rounded-lg border p-2">
                      <AppThumb app={app} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{app.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{app.description}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" aria-label="Välj en annan app" onClick={() => { setPicked(null); setQuery(''); }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="app-search" className="pl-9" placeholder="Börja skriva appens namn" value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" aria-invalid={touched && !app} />
                      </div>
                      {matches.length > 0 && (
                        <ul className="space-y-1 rounded-lg border p-1" role="listbox" aria-label="Appar som matchar">
                          {matches.map((a) => (
                            <li key={a.id}>
                              <button type="button" role="option" aria-selected={false} onClick={() => setPicked(a.id)}
                                className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted focus:bg-muted focus:outline-none">
                                <AppThumb app={a} />
                                <span className="min-w-0">
                                  <span className="block font-medium truncate">{a.title}</span>
                                  <span className="block text-xs text-muted-foreground truncate">{a.description}</span>
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {query.trim() && apps && matches.length === 0 && <p className="text-sm text-muted-foreground">Ingen app heter så. Prova en del av namnet.</p>}
                      {touched && !app && <p className="text-sm text-destructive">Välj appen i listan.</p>}
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Vad gäller det? *</Label>
                  <RadioGroup value={reason} onValueChange={(v) => setReason(v as Reason)} className="space-y-1">
                    {REASONS.map((r) => (
                      <label key={r.id} htmlFor={`reason-${r.id}`} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/50">
                        <RadioGroupItem id={`reason-${r.id}`} value={r.id} className="mt-0.5" />
                        <span>
                          <span className="block text-sm font-medium">{r.label}</span>
                          <span className="block text-xs text-muted-foreground">{r.hint}</span>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                  {touched && !reason && <p className="text-sm text-destructive">Välj vad det gäller.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Berätta mer {reason === 'other' ? '*' : '(valfritt)'}</Label>
                  <Textarea id="message" className="resize-none h-24" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000}
                    placeholder="Var i appen? Vad hände?" aria-invalid={touched && needsText} />
                  {touched && needsText && <p className="text-sm text-destructive">Beskriv vad det gäller.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Din e-postadress (valfritt)</Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="Om du vill att vi svarar" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} aria-invalid={touched && !emailOk} />
                  {touched && !emailOk && <p className="text-sm text-destructive">Ange en giltig e-postadress, eller lämna fältet tomt.</p>}
                </div>

                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor="website">Webbplats</label>
                  <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                </div>

                {send.isError && <p className="text-sm text-destructive" role="alert">{errorMessage(send.error)}</p>}
                <Button type="submit" size="lg" className="w-full gap-2" disabled={send.isPending}>
                  {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                  Skicka rapporten
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
