import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppThumbnail } from '@/components/AppThumbnail';
import { Kotten } from '@/components/Kotten';
import { useSetting } from '@/hooks/useSettings';
import { useAppDetails } from '@/hooks/useAppDetails';

/**
 * "Veckans spelraket": one app picked by the reviewer (the setting weekly_app_id, set with
 * set_setting – Hermes can rotate it every week). Hidden when nothing is picked or the app is not listed.
 */
export function WeeklyRocket({ onPlay }: { onPlay: (app: { id: string; url: string; title: string }) => void }) {
  const { data: picked } = useSetting('weekly_app_id');
  const id = typeof picked === 'string' && picked ? picked : undefined;
  const { data: app } = useAppDetails(id);
  if (!id || !app) return null;
  const subject = app.categories.find((c) => c.type === 'subject');
  const age = app.categories.find((c) => c.type === 'age');

  return (
    <section aria-labelledby="veckans-spelraket" className="container mx-auto px-4 pt-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 rounded-3xl border border-border bg-card/80 p-5 shadow-playful sm:flex-row sm:items-center sm:p-6">
        <div className="relative w-full flex-none sm:w-72">
          <div className="aspect-[4/3] overflow-hidden rounded-2xl">
            <AppThumbnail title={app.title} imageUrl={app.image_url || undefined} categories={app.categories} className="h-full w-full" />
          </div>
          <Kotten mood="jublar" title="" className="absolute -right-4 -top-6 h-20 w-20 drop-shadow-md" />
        </div>
        <div className="min-w-0 flex-1">
          <p id="veckans-spelraket" className="text-sm font-bold uppercase tracking-wide text-primary">🚀 Veckans spelraket</p>
          <h2 className="mt-1 text-2xl font-heading font-black md:text-3xl">{app.title}</h2>
          <p className="mt-2 text-muted-foreground line-clamp-3">{app.description}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {[subject && `${subject.icon ?? ''} ${subject.name}`, age && `årskurs ${age.name}`, app.creator_name && `av ${app.creator_name}`].filter(Boolean).join(' · ')}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button className="h-11 gap-2 rounded-full" onClick={() => onPlay({ id: app.id, url: app.url, title: app.title })}>
              <Play className="h-4 w-4" /> Spela
            </Button>
            <Button variant="outline" className="h-11 rounded-full" asChild>
              <Link to={`/app/${app.id}`}>Om appen</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
