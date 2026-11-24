import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { AppLaunchTile } from "@/components/AppLaunchTile";
import { AppPlayer } from "@/components/AppPlayer";
import { useTrackClick } from "@/hooks/useTrackClick";
import type { App } from "@/hooks/useApps";
import NotFound from "./NotFound";

interface Landing {
  path: string;
  title: string;
  description: string;
  intro: string;
  apps: Pick<App, "id" | "title" | "description" | "url" | "image_url" | "categories">[];
  curriculum: { id: string; name: string; apps: number }[];
  related: { path: string; title: string; count: number }[];
  other_subjects: { path: string; title: string }[];
}

/** /appar/:subject(/:age) – the apps of a subject and grade, the same page the server renders for search engines. */
export default function SubjectApps() {
  const { subject, age } = useParams<{ subject: string; age?: string }>();
  const path = `/api/landing/${encodeURIComponent(subject || "")}${age ? `/${encodeURIComponent(age)}` : ""}`;
  const { data, isLoading, error } = useQuery({ queryKey: ["landing", subject, age], queryFn: () => api.get<Landing>(path) });
  const [playing, setPlaying] = useState<{ url: string; title: string } | null>(null);
  const trackClick = useTrackClick();

  if (error) return <NotFound />;
  const cat = (a: Landing["apps"][number], type: string) => a.categories.find((c) => c.type === type);

  return (
    <div className="min-h-screen bg-background">
      {data && <SEO title={data.title} description={data.description} url={data.path} />}
      <PublicNav variant="solid" />
      {playing && <AppPlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
      <div className="container mx-auto px-4 py-10">
        {isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-heading font-black">{data.title}</h1>
            <p className="mt-3 max-w-3xl text-lg text-muted-foreground">{data.intro}</p>
            {data.related.length > 0 && (
              <nav aria-label="Fler årskurser" className="mt-5 flex flex-wrap gap-2">
                {data.related.map((r) => (
                  <Link key={r.path} to={r.path} className="rounded-full border bg-card px-4 py-2 text-sm hover:bg-muted">
                    {r.title} <span className="text-muted-foreground">({r.count})</span>
                  </Link>
                ))}
              </nav>
            )}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {data.apps.map((app) => (
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
                  onLaunch={() => { trackClick.mutate(app.id); setPlaying({ url: app.url, title: app.title }); }}
                />
              ))}
            </div>
            {data.curriculum.length > 0 && (
              <section className="mt-12 max-w-3xl">
                <h2 className="text-xl font-heading font-bold">Det här tränar apparna i Lgr22</h2>
                <ul className="mt-3 space-y-1">
                  {data.curriculum.map((c) => (
                    <li key={c.id}>
                      <Link to={`/apps?lgr=${encodeURIComponent(c.id)}`} className="underline underline-offset-4 hover:text-primary">{c.name}</Link>
                      <span className="text-muted-foreground"> · {c.apps} {c.apps === 1 ? "app" : "appar"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {data.other_subjects.length > 0 && (
              <p className="mt-10 text-sm text-muted-foreground">
                Fler ämnen:{" "}
                {data.other_subjects.map((s, i) => (
                  <span key={s.path}>{i > 0 && " · "}<Link to={s.path} className="underline underline-offset-4 hover:text-foreground">{s.title}</Link></span>
                ))}
              </p>
            )}
          </>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
