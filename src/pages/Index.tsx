import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, Rocket, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { AppCardVisual } from "@/components/AppCardVisual";
import { TopIdeasSection } from "@/components/TopIdeasSection";
import { SEO, buildWebsiteSchema, buildOrganizationSchema, buildFaqSchema } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useApps, useCategories, useUserUpvotes, useToggleUpvote } from "@/hooks/useApps";
import { toast } from "sonner";

const AI_TOOLS = [
  { name: "Lovable", slug: "lovable" },
  { name: "Google AI Studio", slug: "google-ai-studio" },
  { name: "Bolt.new", slug: "bolt-new" },
  { name: "Cursor", slug: "cursor" },
  { name: "Replit", slug: "replit" },
];

const HOME_LIMIT = 12;

export default function Index() {
  const { user } = useAuth();
  const config = useSiteConfig();
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: apps, isLoading } = useApps({
    search: search.trim() || undefined,
    subjects: subject ? [subject] : undefined,
    sort: "popular",
  });
  const { data: userUpvotes = [] } = useUserUpvotes();
  const toggleUpvote = useToggleUpvote();

  const subjects = useMemo(() => categories?.filter((c) => c.type === "subject") ?? [], [categories]);
  const visibleApps = apps?.slice(0, HOME_LIMIT) ?? [];
  const shareHref = user ? "/min-sida/ny" : "/auth";
  const combinedSchema = [buildWebsiteSchema(config), buildOrganizationSchema(config), buildFaqSchema(config)].filter(Boolean);

  const handleUpvote = (appId: string) => {
    if (!user) {
      toast("Logga in för att rösta");
      return;
    }
    toggleUpvote.mutate({ appId, hasUpvoted: userUpvotes.includes(appId) });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO url="/" jsonLd={combinedSchema} />
      <PublicNav variant="transparent" />

      {/* Kompakt intro + sök */}
      <section className="container mx-auto px-4 pt-8 md:pt-14 pb-6 text-center">
        <h1 className="text-4xl md:text-6xl font-heading font-black leading-tight">
          Skolappar av <span className="text-gradient">föräldrar</span>
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">Gratis appar som gör lärande kul.</p>

        <div className="relative max-w-xl mx-auto mt-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök app…"
            aria-label="Sök app"
            className="h-14 pl-12 rounded-2xl text-base bg-card shadow-playful border-0"
          />
        </div>

        {subjects.length > 0 && (
          <div className="mt-4 -mx-4 px-4 flex gap-2 overflow-x-auto md:flex-wrap md:justify-center scrollbar-none">
            <Chip active={!subject} onClick={() => setSubject(null)}>Alla</Chip>
            {subjects.map((s) => (
              <Chip key={s.id} active={subject === s.slug} onClick={() => setSubject(subject === s.slug ? null : s.slug)}>
                {s.icon} {s.name}
              </Chip>
            ))}
          </div>
        )}
      </section>

      {/* Appgalleri */}
      <section className="container mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : visibleApps.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Inga appar hittades.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleApps.map((app) => (
              <AppCardVisual
                key={app.id}
                id={app.id}
                title={app.title}
                description={app.description}
                url={app.url}
                imageUrl={app.image_url}
                upvotesCount={app.upvotes_count}
                commentsCount={app.comments_count}
                clicksCount={app.clicks_count}
                creatorId={app.user_id}
                creatorName={app.profile?.display_name || undefined}
                categories={app.categories}
                hasUpvoted={userUpvotes.includes(app.id)}
                onUpvote={() => handleUpvote(app.id)}
              />
            ))}
          </div>
        )}

        {(apps?.length ?? 0) > HOME_LIMIT && (
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" className="h-12 gap-2 rounded-full" asChild>
              <Link to="/apps">
                Alla {apps?.length} appar <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
      </section>

      <TopIdeasSection />

      {/* Dela din app */}
      <section className="container mx-auto px-4 py-12 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-card/80 shadow-playful p-8 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Har du byggt en app?</h2>
          <p className="text-muted-foreground">Dela den på en minut – länk och namn räcker.</p>
          <Button size="lg" className="h-12 gap-2 rounded-full shadow-playful-lg" asChild>
            <Link to={shareHref}>
              <Rocket className="w-5 h-5" /> Dela din app
            </Link>
          </Button>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {AI_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                to={`/resurser/plattformar/${tool.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {tool.name}
                <ChevronRight className="w-3 h-3" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 h-11 px-4 rounded-full text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground shadow-playful" : "bg-card/80 text-foreground hover:bg-card"
      }`}
    >
      {children}
    </button>
  );
}
