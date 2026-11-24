import { AppLaunchTile } from "@/components/AppLaunchTile";
import type { App } from "@/hooks/useApps";
import { cat, pickMoreLikeThis } from "@/hooks/usePlayedInTab";

export function MoreLikeThis({ apps, played, onPlay }: { apps?: App[]; played: string[]; onPlay: (app: App) => void }) {
  if (!apps?.length || !played.length) return null;
  const more = pickMoreLikeThis(apps, played);
  const last = apps.find((a) => a.id === played[played.length - 1]);
  if (!more.length || !last) return null;

  return (
    <section aria-labelledby="mer-som-det-har" className="container mx-auto px-4 pt-8">
      <h2 id="mer-som-det-har" className="text-2xl font-heading font-black">Mer som det här</h2>
      <p className="mb-4 text-sm text-muted-foreground">För att ni just spelade {last.title}</p>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {more.map((app) => (
          <AppLaunchTile
            key={app.id}
            id={app.id}
            title={app.title}
            url={app.url}
            imageUrl={app.image_url || undefined}
            categories={app.categories}
            age={cat(app, "age")?.name}
            ageIcon={cat(app, "age")?.icon}
            ageColor={cat(app, "age")?.color}
            subjectIcon={cat(app, "subject")?.icon}
            subjectColor={cat(app, "subject")?.color}
            typeIcon={cat(app, "app_type")?.icon}
            typeColor={cat(app, "app_type")?.color}
            onLaunch={() => onPlay(app)}
          />
        ))}
      </div>
    </section>
  );
}
