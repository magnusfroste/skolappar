import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

interface TermsDoc {
  version: string;
  markdown: string;
}

/** The terms makers accept when they submit – the text is server/content/villkor.md (also get_terms over MCP). */
const Terms = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["terms"],
    queryFn: () => api.get<TermsDoc>("/api/terms"),
    staleTime: 60 * 60 * 1000,
  });

  return (
    <>
      <SEO
        title="Villkor"
        description="Villkoren för dig som skickar in en app till Skolappar: vad du lovar om appen, granskningen, mejlen vi skickar och dina uppgifter."
        url="/villkor"
      />

      <div className="min-h-screen bg-background flex flex-col">
        <PublicNav variant="solid" />

        <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : error || !data ? (
            <p className="text-muted-foreground">
              Villkoren kunde inte visas just nu. Försök igen om en stund, eller mejla{" "}
              <a href="mailto:info@skolappar.org" className="underline">info@skolappar.org</a>.
            </p>
          ) : (
            <article className="space-y-4">
              <p className="text-sm text-muted-foreground">Senast uppdaterade {data.version}</p>
              <MarkdownRenderer content={data.markdown} />
            </article>
          )}
        </main>

        <PublicFooter />
      </div>
    </>
  );
};

export default Terms;
