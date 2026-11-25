import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Check, ExternalLink, Flag, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useHandleReport, useReports, type AppReport } from '@/hooks/useAdmin';

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' }) : '–');
const HANDLED: Record<string, string> = { resolved: 'Åtgärdad', dismissed: 'Avfärdad', delisted: 'Appen avlistad' };

function ReportCard({ r }: { r: AppReport }) {
  const { toast } = useToast();
  const handle = useHandleReport();
  const [note, setNote] = useState(r.reason === 'inappropriate' ? 'Olämpligt innehåll' : '');
  const act = async (action: 'delist' | 'resolved' | 'dismissed') => {
    if (action === 'delist' && !window.confirm(`Ta bort ${r.app.title} ur katalogen nu?`)) return;
    try {
      await handle.mutateAsync({ id: r.id, action, note: note.trim() || undefined });
      toast({ title: action === 'delist' ? `${r.app.title} är avlistad` : 'Rapporten är hanterad' });
    } catch { toast({ title: 'Det gick inte', variant: 'destructive' }); }
  };
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        {r.app.image_url
          ? <img src={r.app.image_url} alt="" className="h-14 w-20 shrink-0 rounded-md border object-cover" />
          : <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md border bg-muted">📱</div>}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/admin/app/${r.app.id}`} className="font-medium hover:underline">{r.app.title}</Link>
            <Badge variant={r.reason === 'inappropriate' ? 'destructive' : 'secondary'}>{r.reason_name}</Badge>
            {r.open_reports_for_app > 1 && r.status === 'open' && <Badge variant="outline">{r.open_reports_for_app} öppna rapporter</Badge>}
            {r.status !== 'open' && <Badge variant="outline">{HANDLED[r.status] ?? r.status}</Badge>}
            <a href={r.app.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Öppna appen"><ExternalLink className="h-4 w-4" /></a>
          </div>
          {r.message && <p className="whitespace-pre-wrap text-sm">{r.message}</p>}
          <p className="text-xs text-muted-foreground">
            {date(r.created_at)}
            {r.email && <> · svar till <a href={`mailto:${r.email}`} className="underline-offset-2 hover:underline">{r.email}</a></>}
            {r.handled_at && ` · hanterad ${date(r.handled_at)}${r.handled_note ? `: ${r.handled_note}` : ''}`}
          </p>
        </div>
      </div>
      {r.status === 'open' && (
        <div className="flex flex-wrap items-center gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anteckning (blir skälet vid avlistning)" className="h-9 min-w-[12rem] flex-1 text-sm" maxLength={500} />
          <Button size="sm" variant="destructive" className="gap-1" disabled={handle.isPending} onClick={() => act('delist')}><Ban className="h-4 w-4" />Avlista appen</Button>
          <Button size="sm" variant="outline" className="gap-1" disabled={handle.isPending} onClick={() => act('resolved')}><Check className="h-4 w-4" />Åtgärdad</Button>
          <Button size="sm" variant="ghost" className="gap-1" disabled={handle.isPending} onClick={() => act('dismissed')}><X className="h-4 w-4" />Avfärda</Button>
        </div>
      )}
    </div>
  );
}

/** Admin → Rapporter: what visitors have flagged (/rapportera), newest first. */
export function ReportsPanel() {
  const [view, setView] = useState<'open' | 'handled'>('open');
  const { data, isLoading } = useReports(view);
  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" />Rapporter</CardTitle>
          <CardDescription>
            Besökare rapporterar appar på /rapportera och från varje apps sida. Olämpligt innehåll som stämmer avlistas direkt.
            Hermes ser samma lista med list_reports.
          </CardDescription>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={view === 'open' ? 'default' : 'outline'} onClick={() => setView('open')}>Öppna</Button>
          <Button size="sm" variant={view === 'handled' ? 'default' : 'outline'} onClick={() => setView('handled')}>Hanterade</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <Skeleton className="h-24 w-full" />
          : !data?.reports.length ? <p className="text-sm text-muted-foreground">{view === 'open' ? 'Inga öppna rapporter.' : 'Inga hanterade rapporter ännu.'}</p>
          : data.reports.map((r) => <ReportCard key={r.id} r={r} />)}
      </CardContent>
    </Card>
  );
}
