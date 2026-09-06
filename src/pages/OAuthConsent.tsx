import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauth = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError('Länken saknar information om vilken app som vill kopplas.');
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/auth?next=' + encodeURIComponent(next);
        return;
      }
      const { data, error: detailsError } = await oauth().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (detailsError) {
        setError(detailsError.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const api = oauth();
    const { data, error: decideError } = approve
      ? await api.approveAuthorization(authorizationId)
      : await api.denyAuthorization(authorizationId);
    if (decideError) {
      setBusy(false);
      setError(decideError.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError('Ingen returadress kom tillbaka. Försök igen från din agent.');
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? 'Din agent';

  return (
    <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md border-0 shadow-playful-lg bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bot className="h-7 w-7" />
          </div>
          <CardTitle className="font-heading text-2xl">
            {error ? 'Något gick fel' : details ? `Koppla ${clientName}` : 'Laddar…'}
          </CardTitle>
          <CardDescription>
            {error
              ? error
              : details
                ? `${clientName} får då göra samma saker som du kan göra på skolappar.`
                : 'Hämtar information om kopplingen.'}
          </CardDescription>
        </CardHeader>
        {details && !error && (
          <CardContent className="flex flex-col gap-3">
            <Button className="h-12 text-base" disabled={busy} onClick={() => decide(true)}>
              Godkänn
            </Button>
            <Button variant="outline" className="h-12 text-base" disabled={busy} onClick={() => decide(false)}>
              Avbryt
            </Button>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
