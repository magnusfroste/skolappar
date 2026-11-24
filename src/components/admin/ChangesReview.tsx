import { useState } from 'react';
import { Check, ExternalLink, FilePen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAdminChanges, useReviewChange, type AppChange } from '@/hooks/useAdmin';

const FIELD_NAMES: Record<string, string> = {
  title: 'Namn',
  description: 'Kort beskrivning',
  long_description: 'Lång beskrivning',
  image_url: 'Kortbild',
};

interface Category { id: string; name: string; type: string; icon?: string | null }

function Value({ field, value }: { field: string; value: string | null }) {
  if (!value) return <span className="italic text-muted-foreground">tomt</span>;
  if (field === 'image_url') {
    return <img src={value} alt="" className="aspect-[4/3] w-full max-w-xs rounded-lg border object-cover" />;
  }
  return <p className="whitespace-pre-wrap break-words text-sm">{value}</p>;
}

function ChangeCard({ change, categories }: { change: AppChange; categories: Category[] }) {
  const { toast } = useToast();
  const review = useReviewChange();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const name = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? `${c.icon ?? ''} ${c.name}`.trim() : id;
  };

  const decide = async (approve: boolean) => {
    try {
      await review.mutateAsync({ appId: change.id, approve, reason: approve ? undefined : reason.trim() || undefined });
      toast({ title: approve ? `Ändringen av ${change.title} är publicerad` : `Ändringen av ${change.title} avvisades` });
    } catch {
      toast({ title: 'Kunde inte spara beslutet', variant: 'destructive' });
    }
  };

  return (
    <div className="rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-bold">{change.title}</h3>
          <p className="text-xs text-muted-foreground">
            {change.proposed.at ? `Föreslagen ${new Date(change.proposed.at).toLocaleString('sv-SE')}` : 'Föreslagen ändring'}
          </p>
        </div>
        <div className="flex gap-2 text-sm">
          <a href={change.page} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline underline-offset-4">Appens sida <ExternalLink className="h-3 w-3" /></a>
          <a href={change.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 underline underline-offset-4">Appen <ExternalLink className="h-3 w-3" /></a>
        </div>
      </div>

      {change.proposed.note && (
        <p className="mt-3 rounded-lg bg-muted p-3 text-sm"><span className="font-medium">Skaparens kommentar:</span> {change.proposed.note}</p>
      )}

      <div className="mt-4 space-y-4">
        {Object.entries(change.proposed.fields).map(([field, value]) => (
          <div key={field}>
            <p className="mb-2 text-sm font-medium">{FIELD_NAMES[field] ?? field}</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-dashed p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Nu</p>
                <Value field={field} value={change.listed[field] ?? null} />
              </div>
              <div className="rounded-lg border border-primary/40 bg-primary/5 p-3">
                <p className="mb-1 text-xs uppercase tracking-wide text-primary">Föreslaget</p>
                <Value field={field} value={value} />
              </div>
            </div>
          </div>
        ))}
        {change.proposed.category_ids && (
          <div>
            <p className="mb-2 text-sm font-medium">Nya kategorier</p>
            <div className="flex flex-wrap gap-2">
              {change.proposed.category_ids.map((id) => (
                <span key={id} className="rounded-full border bg-card px-3 py-1 text-sm">{name(id)}</span>
              ))}
            </div>
          </div>
        )}
        {change.proposed.curriculum_ids && (
          <div>
            <p className="mb-2 text-sm font-medium">Nya punkter i Lgr22</p>
            <p className="font-mono text-sm">{change.proposed.curriculum_ids.join(', ') || 'inga'}</p>
          </div>
        )}
      </div>

      {rejecting ? (
        <div className="mt-4 space-y-2">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Vad ska skaparen rätta? Skälet syns i app_status."
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button variant="destructive" onClick={() => decide(false)} disabled={review.isPending}>Avvisa ändringen</Button>
            <Button variant="ghost" onClick={() => setRejecting(false)}>Avbryt</Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => decide(true)} disabled={review.isPending}><Check className="mr-1 h-4 w-4" /> Godkänn och publicera</Button>
          <Button variant="outline" onClick={() => setRejecting(true)} disabled={review.isPending}><X className="mr-1 h-4 w-4" /> Avvisa</Button>
        </div>
      )}
    </div>
  );
}

/** Changes the makers proposed to listed apps: what is listed now next to the proposal; approve or turn down. */
export function ChangesReview({ categories }: { categories: Category[] }) {
  const { data: changes, isLoading } = useAdminChanges();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ändringar som väntar</CardTitle>
        <CardDescription>
          Skaparna kan föreslå ny text, kategorier, Lgr22-punkter eller kortbild för en publicerad app. Den publicerade
          versionen ligger kvar tills du godkänner. Hermes granskar samma lista med list_changes och review_change.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
        ) : !changes?.length ? (
          <div className="py-12 text-center text-muted-foreground">
            <FilePen className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>Inga ändringar väntar just nu.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {changes.map((c) => <ChangeCard key={c.id} change={c} categories={categories} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
