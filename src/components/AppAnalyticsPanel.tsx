import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, ExternalLink, MousePointer2, TrendingUp, LayoutGrid } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAppAnalytics } from '@/hooks/useAppAnalytics';
import type { AnalyticsPeriod } from '@/lib/appAnalytics';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const number = (value: number) => value.toLocaleString('sv-SE');

export function AppAnalyticsPanel() {
  const [days, setDays] = useState<AnalyticsPeriod>(7);
  const { data, isLoading, isError, refetch, isFetching } = useAppAnalytics(days);
  return (
    <section className="space-y-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1" aria-label="Statistikperiod">
          {([7, 30, 90] as const).map(period => (
            <Button key={period} variant={days === period ? 'default' : 'outline'} className="min-h-12" aria-pressed={days === period} onClick={() => setDays(period)}>{period} dagar</Button>
          ))}
        </div>
        <Button variant="ghost" size="icon" className="h-12 w-12" aria-label="Uppdatera statistiken" title="Uppdatera statistiken" disabled={isFetching} onClick={() => refetch()}><RefreshCw className={isFetching ? 'h-4 w-4 animate-spin motion-reduce:animate-none' : 'h-4 w-4'} /></Button>
      </div>
      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <div role="alert" className="space-y-3"><p>Kunde inte hämta statistiken.</p><Button variant="outline" onClick={() => refetch()}>Försök igen</Button></div>}
      {data && <>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: `Öppningar · ${days} dagar`, value: data.period_opens, icon: MousePointer2 },
            { title: 'Appar som öppnats', value: data.apps_opened, icon: LayoutGrid },
            { title: 'Öppningar · totalt', value: data.total_opens, icon: TrendingUp },
          ].map(({ title, value, icon: Icon }) => <div key={title} className="rounded-lg border bg-card p-4"><Icon className="h-5 w-5 text-primary mb-3" /><p className="text-3xl font-bold">{number(value)}</p><p className="text-sm text-muted-foreground mt-1">{title}</p></div>)}
        </div>
        <div>
          <h2 className="font-semibold mb-4">Öppningar per dag</h2>
          <div className="h-56 w-full" role="img" aria-label={`Dagliga appöppningar: ${data.period_opens} under ${days} dagar`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ left: -20, right: 8, top: 8, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={date => `${date.slice(8, 10)}/${date.slice(5, 7)}`} stroke="hsl(var(--muted-foreground))" fontSize={12} minTickGap={24} />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip labelFormatter={date => String(date)} formatter={value => [value, 'Öppningar']} />
                <Bar dataKey="opens" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Tidsserien börjar 18 november 2026. Dagar räknas i UTC. Äldre öppningar ingår bara i totalen.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left font-semibold pb-3">Mest öppnade appar</caption>
            <thead><tr className="border-b text-muted-foreground"><th className="text-left py-3">App</th><th className="text-right px-3 whitespace-nowrap">{days} dagar</th><th className="text-right px-3">Totalt</th><th className="text-right px-3">Gilla</th><th className="text-right pl-3">Kommentarer</th></tr></thead>
            <tbody>{data.apps.map(app => <tr key={app.id} className="border-b"><td className="py-2"><Link to={`/app/${app.id}`} className="flex items-center gap-2 min-h-12 min-w-32 font-medium hover:text-primary"><span>{app.title}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" /></Link></td><td className="text-right px-3 tabular-nums">{number(app.period_opens)}</td><td className="text-right px-3 tabular-nums">{number(app.total_opens)}</td><td className="text-right px-3 tabular-nums">{number(app.upvotes)}</td><td className="text-right pl-3 tabular-nums">{number(app.comments)}</td></tr>)}</tbody>
          </table>
          {data.apps.length === 0 && <p className="py-6 text-muted-foreground">Inga appar ännu.</p>}
        </div>
        <p className="text-xs text-muted-foreground">Öppningar är antal starter, inte unika besökare. Senast hämtat {new Date(data.period_end).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}.</p>
      </>}
    </section>
  );
}