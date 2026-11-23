import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SEO } from "@/components/SEO";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

interface Guide {
  title: string;
  intro: string;
  sections: Array<{ id: string; title: string; body: string }>;
}

/** "Så bygger du en skolapp" – the same text agents read with get_guide (server/guide.mjs). */
export default function BuildGuide() {
  const { data: guide, isLoading, error } = useQuery({
    queryKey: ['guide'],
    queryFn: () => api.get<Guide>('/api/guide'),
    staleTime: 60 * 60 * 1000,
  });
  const mcp = `${window.location.origin}/mcp`;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Så bygger du en skolapp"
        description="Guiden för dig som bygger en pedagogisk app, själv eller med en AI-agent: iPad och touch, tryggt för barn, pedagogik, läroplanen och en checklista."
        url="/bygg"
      />
      <PublicNav variant="solid" />

      <div className="container max-w-3xl py-12 px-4">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4 mb-8" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        )}
        {(error || (!isLoading && !guide)) && (
          <p className="text-muted-foreground">Guiden kunde inte hämtas just nu. Försök igen om en stund.</p>
        )}
        {guide && (
          <article>
            <h1 className="text-3xl font-bold text-foreground mb-4">{guide.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">{guide.intro}</p>

            <aside className="mb-10 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                <Bot className="h-4 w-4 text-primary" />
                Bygger du med en AI-agent?
              </div>
              <p className="text-muted-foreground">
                Ge agenten den här adressen, så läser den guiden, skickar in appen och följer hur den används. Ingen nyckel behövs.
              </p>
              <code className="mt-2 block rounded-md bg-muted p-2 break-all">{mcp}</code>
            </aside>

            <nav aria-label="Innehåll" className="mb-10">
              <ol className="grid gap-1 sm:grid-cols-2 text-sm list-decimal list-inside">
                {guide.sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-primary hover:underline">{s.title}</a>
                  </li>
                ))}
              </ol>
            </nav>

            {guide.sections.map((s) => (
              <section key={s.id} id={s.id} className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-semibold text-foreground mb-4">{s.title}</h2>
                <MarkdownRenderer content={s.body} />
              </section>
            ))}

            <div className="flex flex-wrap gap-3 pt-4">
              <Button asChild><Link to="/tipsa">Skicka in din app</Link></Button>
              <Button asChild variant="outline"><Link to="/ideer">Hitta en idé</Link></Button>
            </div>
          </article>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
