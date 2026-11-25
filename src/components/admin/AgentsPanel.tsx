import { useState } from 'react';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAgentUsage } from '@/hooks/useAdmin';

const PATH_NAMES: Record<string, string> = {
  get_guide: 'Läste guiden', check_app: 'Kontrollerade appen', submit_app: 'Skickade in',
  set_my_app_image: 'Satte kortbild', app_status: 'Följde granskningen',
};

/** Admin → Agenter: who connects to /mcp, what they call, what goes wrong, and what they look for in vain. */
export function AgentsPanel() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const { data, isLoading, error } = useAgentUsage(days);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Agenter på /mcp</CardTitle>
            <CardDescription>
              Hur föräldrars agenter använder Skolappars MCP: vilka som ansluter, vilka verktyg som används och var det går fel.
              Bara antal per dag – inga argument, adresser eller personuppgifter. Hermes läser samma sak med agent_usage.
            </CardDescription>
          </div>
          <div className="flex gap-1">
            {([7, 30, 90] as const).map((d) => (
              <Button key={d} size="sm" variant={days === d ? 'default' : 'outline'} onClick={() => setDays(d)}>{d} dagar</Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-24 w-full" /> : error || !data ? <p className="text-sm text-destructive">Kunde inte läsa siffrorna.</p> : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div><p className="text-3xl font-bold tabular-nums">{data.connections}</p><p className="text-sm text-muted-foreground">anslutningar</p></div>
              <div><p className="text-3xl font-bold tabular-nums">{data.calls}</p><p className="text-sm text-muted-foreground">verktygsanrop</p></div>
              <div><p className="text-3xl font-bold tabular-nums">{data.unknown_tools.reduce((n, t) => n + t.n, 0)}</p><p className="text-sm text-muted-foreground">anrop till verktyg som inte finns</p></div>
            </div>
          )}
        </CardContent>
      </Card>

      {data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-lg">Klienter</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.clients.length ? data.clients.map((c) => (
                  <div key={c.client} className="flex justify-between border-b py-1 last:border-0"><span>{c.client}</span><span className="tabular-nums">{c.connections}</span></div>
                )) : <p className="text-muted-foreground">Ingen har anslutit ännu.</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Vägen till en app</CardTitle><CardDescription>Lyckade anrop i varje steg</CardDescription></CardHeader>
              <CardContent className="space-y-1 text-sm">
                {data.path.map((p) => (
                  <div key={p.tool} className="flex justify-between border-b py-1 last:border-0"><span>{PATH_NAMES[p.tool] ?? p.tool} <code className="text-xs text-muted-foreground">{p.tool}</code></span><span className="tabular-nums">{p.ok}</span></div>
                ))}
              </CardContent>
            </Card>
          </div>

          {data.unknown_tools.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Verktyg som agenter letar efter men som inte finns</CardTitle>
                <CardDescription>Den bästa ledtråden till ett verktyg som saknas eller heter fel.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.unknown_tools.map((t) => <Badge key={t.tool} variant="outline"><code>{t.tool}</code>&nbsp;× {t.n}</Badge>)}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Verktyg</CardTitle><CardDescription>Fel = verktyget sa nej; ogiltigt = fel indata. De vanligaste meddelandena visar vad agenterna missförstår.</CardDescription></CardHeader>
            <CardContent>
              {data.tools.length === 0 ? <p className="text-sm text-muted-foreground">Inga anrop ännu.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-1 pr-3 font-normal">Verktyg</th><th className="py-1 pr-3 font-normal text-right">Anrop</th><th className="py-1 pr-3 font-normal text-right">Fel</th><th className="py-1 pr-3 font-normal text-right">Ogiltigt</th><th className="py-1 font-normal">Vanligaste meddelandet</th></tr>
                    </thead>
                    <tbody>
                      {data.tools.map((t) => (
                        <tr key={t.tool} className="border-t align-top">
                          <td className="py-1 pr-3"><code>{t.tool}</code></td>
                          <td className="py-1 pr-3 text-right tabular-nums">{t.calls}</td>
                          <td className={`py-1 pr-3 text-right tabular-nums ${t.errors ? 'text-destructive' : ''}`}>{t.errors}</td>
                          <td className={`py-1 pr-3 text-right tabular-nums ${t.invalid ? 'text-destructive' : ''}`}>{t.invalid}</td>
                          <td className="py-1 text-xs text-muted-foreground">{t.top_messages[0] ? `${t.top_messages[0].message} (${t.top_messages[0].n})` : '–'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
