import { useState } from 'react';
import { Eye, Mail, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  useMailings, usePreviewMailing, useSendMailing,
  type MailingInput, type MailingKind, type MailingResult, type MailingTemplate,
} from '@/hooks/useAdmin';

const NAMES: Record<MailingKind, string> = {
  godkand: '1. Godkänd',
  'en-vecka': '2. En vecka',
  'en-manad': '3. En månad',
  villkor: '4. Nya villkor',
  nyheter: '5. Nyheter',
};

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) : '–');
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Något gick fel');

function MailText({ subject, text }: { subject: string; text: string }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="font-medium">Ämne: {subject}</p>
      <pre className="mt-2 whitespace-pre-wrap break-words font-sans text-muted-foreground">{text}</pre>
    </div>
  );
}

function TemplateCard({ t }: { t: MailingTemplate }) {
  const preview = usePreviewMailing();
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{NAMES[t.id]}</span>
        <Badge variant={t.auto ? 'secondary' : 'outline'}>{t.auto ? 'Automatiskt' : 'Skickas av admin'}</Badge>
        {t.stoppable && <Badge variant="outline">Kan stängas av</Badge>}
        <span className="ml-auto text-xs text-muted-foreground">{t.sent} skickade · senast {date(t.last_sent_at)}</span>
      </div>
      <p className="text-sm text-muted-foreground">{t.schedule}</p>
      <p className="text-sm">Ämne: {t.subject}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" className="gap-1" onClick={() => { setOpen(!open); if (!open) preview.mutate({ kind: t.id }); }}>
          <Eye className="h-4 w-4" /> {open ? 'Dölj' : 'Visa exempel'}
        </Button>
      </div>
      {open && (preview.data ? <MailText {...preview.data} /> : preview.isError ? <p className="text-sm text-destructive">{errorText(preview.error)}</p> : <Skeleton className="h-32 w-full" />)}
      <p className="text-xs text-muted-foreground">Mallen ändras i repot: server/content/mail/{t.id}.md</p>
    </div>
  );
}

/** The form for an admin's broadcast (villkor or nyheter): a dry run first, then a confirmed send. */
function Broadcast({ template, termsVersion, reachable, all }: { template: MailingTemplate; termsVersion: string; reachable: number; all: number }) {
  const { toast } = useToast();
  const send = useSendMailing();
  const isTerms = template.id === 'villkor';
  const month = new Date().toISOString().slice(0, 7);
  const [ref, setRef] = useState(isTerms ? termsVersion : `${month}-nyheter`);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [andringar, setAndringar] = useState('');
  const [gallerFran, setGallerFran] = useState('');
  const [dry, setDry] = useState<MailingResult | null>(null);
  const [confirming, setConfirming] = useState(false);

  const input = (dryRun: boolean): MailingInput => ({
    kind: template.id, ref: ref.trim(), dry_run: dryRun,
    ...(isTerms ? { andringar, galler_fran: gallerFran } : {}),
    ...(subject !== template.subject ? { subject } : {}),
    ...(body !== template.body ? { body } : {}),
  });

  const tryRun = async () => {
    try { setDry(await send.mutateAsync(input(true))); } catch (e) { setDry(null); toast({ title: 'Provkörningen gick inte', description: errorText(e), variant: 'destructive' }); }
  };
  const sendNow = async () => {
    setConfirming(false);
    try {
      const r = await send.mutateAsync(input(false));
      toast({ title: `${r.sent} av ${r.of} mejl skickade` });
      setDry(null);
    } catch (e) { toast({ title: 'Utskicket gick inte', description: errorText(e), variant: 'destructive' }); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><Send className="h-4 w-4" />Skicka {isTerms ? 'nya villkor' : 'nyheter'}</CardTitle>
        <CardDescription>
          {isTerms
            ? `Går till alla ${all} med en publicerad app, även de som stängt av utskick. Skicka minst 30 dagar innan de nya villkoren gäller – ändra först server/content/villkor.md (version ${termsVersion}).`
            : `Går till ${reachable} av ${all} (de som inte stängt av utskick). Högst ungefär en gång i månaden.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor={`${template.id}-ref`}>Id för utskicket</Label>
          <Input id={`${template.id}-ref`} value={ref} onChange={(e) => { setRef(e.target.value); setDry(null); }} readOnly={isTerms} />
          <p className="text-xs text-muted-foreground">Samma id går bara ut en gång per mottagare.</p>
        </div>
        {isTerms && (
          <>
            <div className="space-y-1">
              <Label htmlFor="galler-fran">Gäller från</Label>
              <Input id="galler-fran" value={gallerFran} placeholder="1 januari 2027" onChange={(e) => { setGallerFran(e.target.value); setDry(null); }} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="andringar">Det här ändras</Label>
              <Textarea id="andringar" className="h-28" value={andringar} placeholder="- En punkt per ändring" onChange={(e) => { setAndringar(e.target.value); setDry(null); }} />
            </div>
          </>
        )}
        <div className="space-y-1">
          <Label htmlFor={`${template.id}-subject`}>Ämne</Label>
          <Input id={`${template.id}-subject`} value={subject} onChange={(e) => { setSubject(e.target.value); setDry(null); }} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${template.id}-body`}>Text</Label>
          <Textarea id={`${template.id}-body`} className="h-64 font-mono text-xs" value={body} onChange={(e) => { setBody(e.target.value); setDry(null); }} />
          <p className="text-xs text-muted-foreground">{'{{namn}}, {{app}}, {{appar}}, {{lank}}, {{webbplats}} och {{av}} fylls i för varje mottagare.'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={tryRun} disabled={send.isPending}>Provkör</Button>
          <Button onClick={() => setConfirming(true)} disabled={!dry || !dry.would_send || send.isPending} className="gap-1">
            <Mail className="h-4 w-4" /> Skicka till {dry?.would_send ?? '…'}
          </Button>
        </div>
        {dry && (
          <div className="space-y-2">
            <p className="text-sm">
              {dry.would_send} får mejlet{dry.already_sent ? `, ${dry.already_sent} har redan fått det` : ''}.
            </p>
            {dry.example && <MailText {...dry.example} />}
          </div>
        )}
      </CardContent>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skicka till {dry?.would_send} personer?</AlertDialogTitle>
            <AlertDialogDescription>Mejlen går ut direkt och kan inte tas tillbaka.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={sendNow}>Skicka</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

/** Admin → Utskick: the five mails to makers, their schedule, what has gone out, and the two sent by hand. */
export function MailingsPanel() {
  const { data, isLoading, error } = useMailings();
  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (error || !data) return <p className="text-sm text-destructive">{errorText(error)}</p>;
  const tpl = (id: MailingKind) => data.templates.find((t) => t.id === id)!;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Utskick till skaparna</CardTitle>
          <CardDescription>
            {data.makers} skapare har en publicerad app och bekräftad adress; {data.makers_reachable} tar emot uppföljningar och nyheter.
            Veckobrevet går dessutom ut varje måndag. Villkoren har version {data.terms_version}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.templates.map((t) => <TemplateCard key={t.id} t={t} />)}
          <p className="text-xs text-muted-foreground">
            Uppföljningarna skickas 09–19 svensk tid, högst en per adress och dag, till appar publicerade
            {data.followups_since ? ` efter ${date(data.followups_since)}` : ' från och med nu (räknas från första timkontrollen)'}.
          </p>
        </CardContent>
      </Card>

      <Broadcast template={tpl('nyheter')} termsVersion={data.terms_version} reachable={data.makers_reachable} all={data.makers} />
      <Broadcast template={tpl('villkor')} termsVersion={data.terms_version} reachable={data.makers_reachable} all={data.makers} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Senaste utskicken</CardTitle>
        </CardHeader>
        <CardContent>
          {data.log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Inga mejl ännu.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="py-1 pr-3 font-normal">När</th><th className="py-1 pr-3 font-normal">Mejl</th><th className="py-1 pr-3 font-normal">App</th><th className="py-1 pr-3 font-normal">Till</th><th className="py-1 font-normal">Utfall</th></tr>
                </thead>
                <tbody>
                  {data.log.map((l, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-1 pr-3 whitespace-nowrap">{date(l.sent_at)}</td>
                      <td className="py-1 pr-3 whitespace-nowrap">{NAMES[l.kind] ?? l.kind}</td>
                      <td className="py-1 pr-3">{l.app_title ?? '–'}</td>
                      <td className="py-1 pr-3 break-all">{l.address}</td>
                      <td className={`py-1 ${l.result === 'sent' ? '' : 'text-destructive'}`}>{l.result === 'sent' ? 'Skickat' : l.result}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
