import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { AppLaunchTile } from "@/components/AppLaunchTile";
import { AppPlayer } from "@/components/AppPlayer";
import { useTrackClick } from "@/hooks/useTrackClick";
import { TopIdeasSection } from "@/components/TopIdeasSection";
import { SEO, buildWebsiteSchema, buildOrganizationSchema, buildFaqSchema } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useApps, useCategories } from "@/hooks/useApps";

const AI_TOOLS = [
  { name: "Lovable", slug: "lovable" },
  { name: "Claude Code", slug: "claude-code" },
  { name: "Google AI Studio", slug: "google-ai-studio" },
  { name: "Bolt.new", slug: "bolt-new" },
  { name: "Cursor", slug: "cursor" },
  { name: "Replit", slug: "replit" },
];

const HOME_LIMIT = 12;
const HOME_PAGE = 8;

export default function Index() {
  const { user } = useAuth();
  const config = useSiteConfig();
  const [playing, setPlaying] = useState<{ url: string; title: string } | null>(null);
  const trackClick = useTrackClick();
  const [subject, setSubject] = useState<string | null>(null);
  const [age, setAge] = useState<string | null>(null);

  const { data: categories } = useCategories();
  const { data: apps, isLoading } = useApps({
    subjects: subject ? [subject] : undefined,
    ages: age ? [age] : undefined,
    sort: "popular",
  });

  const subjects = useMemo(() => categories?.filter((c) => c.type === "subject") ?? [], [categories]);
  const ages = useMemo(() => categories?.filter((c) => c.type === "age") ?? [], [categories]);
  const totalApps = apps?.length ?? 0;
  const [visibleCount, setVisibleCount] = useState(HOME_LIMIT);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleApps = apps?.slice(0, visibleCount) ?? [];
  const hasMore = visibleCount < totalApps;

  // Börja om uppifrån vid nytt ämne eller ny ålder
  useEffect(() => {
    setVisibleCount(HOME_LIMIT);
  }, [subject, age]);

  // Fler appar när man scrollar neråt
  useEffect(() => {
    if (!hasMore) return;
    const loadMore = () => {
      const el = sentinelRef.current;
      if (!el) return;
      if (el.getBoundingClientRect().top <= window.innerHeight + 300) {
        setVisibleCount((c) => Math.min(c + HOME_PAGE, totalApps));
      }
    };
    window.addEventListener("scroll", loadMore, { passive: true });
    window.addEventListener("resize", loadMore);
    return () => {
      window.removeEventListener("scroll", loadMore);
      window.removeEventListener("resize", loadMore);
    };
  }, [hasMore, totalApps]);
  const shareHref = user ? "/min-sida/ny" : "/auth";
  const combinedSchema = [buildWebsiteSchema(config), buildOrganizationSchema(config), buildFaqSchema(config)].filter(Boolean);


  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO url="/" jsonLd={combinedSchema} />
      <PublicNav variant="transparent" />
      {playing && <AppPlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}

      {/* Kompakt intro + filter */}
      <section className="container mx-auto px-4 pt-8 md:pt-14 pb-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-heading font-black leading-tight">
            Skolappar av <span className="text-gradient">föräldrar</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">Gratis appar som gör lärande kul.</p>
        </div>

        {(subjects.length > 0 || ages.length > 0) && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {subjects.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto md:flex-wrap md:overflow-visible">
                <Chip active={!subject} onClick={() => setSubject(null)}>Alla</Chip>
                {subjects.map((s) => (
                  <Chip key={s.id} active={subject === s.slug} onClick={() => setSubject(subject === s.slug ? null : s.slug)}>
                    {s.icon} {s.name}
                  </Chip>
                ))}
              </div>
            )}
            {ages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto md:ml-auto md:flex-wrap md:overflow-visible">
                <Chip active={!age} onClick={() => setAge(null)}>Alla åldrar</Chip>
                {ages.map((a) => (
                  <Chip key={a.id} active={age === a.slug} onClick={() => setAge(age === a.slug ? null : a.slug)}>
                    {a.icon} {a.name}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Appgalleri */}
      <section className="container mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
            ))}
          </div>
        ) : visibleApps.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Inga appar hittades.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
            {visibleApps.map((app) => (
              <AppLaunchTile
                key={app.id}
                id={app.id}
                title={app.title}
                url={app.url}
                imageUrl={app.image_url}
                age={app.categories.find((c) => c.type === "age")?.name}
                ageIcon={app.categories.find((c) => c.type === "age")?.icon}
                ageColor={app.categories.find((c) => c.type === "age")?.color}
                subjectIcon={app.categories.find((c) => c.type === "subject")?.icon}
                subjectColor={app.categories.find((c) => c.type === "subject")?.color}
                typeIcon={app.categories.find((c) => c.type === "app_type")?.icon}
                typeColor={app.categories.find((c) => c.type === "app_type")?.color}
                onLaunch={() => {
                  trackClick.mutate(app.id);
                  setPlaying({ url: app.url, title: app.title });
                }}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} aria-hidden className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 pt-6">
            {Array.from({ length: Math.min(HOME_PAGE, totalApps - visibleCount) }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-3xl" />
            ))}
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
