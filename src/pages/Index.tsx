import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { AppLaunchTile } from "@/components/AppLaunchTile";
import { CategoryIcon } from "@/components/CategoryIcon";
import { AppPlayer } from "@/components/AppPlayer";
import { useTrackClick } from "@/hooks/useTrackClick";
import { TopIdeasSection } from "@/components/TopIdeasSection";
import { BuildYourOwn } from "@/components/BuildYourOwn";
import { SEO, buildWebsiteSchema, buildOrganizationSchema, buildFaqSchema } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useApps, useCategories } from "@/hooks/useApps";
import { KottenHello } from "@/components/KottenHello";

const HOME_LIMIT = 12;
const HOME_PAGE = 8;

export default function Index() {
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
  const combinedSchema = [buildWebsiteSchema(config), buildOrganizationSchema(config), buildFaqSchema(config)].filter(Boolean);


  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO url="/" jsonLd={combinedSchema} />
      <PublicNav variant="transparent" />
      {playing && <AppPlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}

      {/* Kompakt intro + filter */}
      <section className="container mx-auto px-4 pt-8 md:pt-14 pb-6">
        {/* Kotten says hello; the text says what is new (build with your AI) and where we come from */}
        <div className="mx-auto flex max-w-5xl flex-col-reverse items-center gap-4 md:flex-row md:gap-10">
          <div className="min-w-0 flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-heading font-black leading-tight text-balance">
              Bygg en skolapp med <span className="text-gradient">din AI</span>
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
              Svenska föräldrar bygger appar åt sina barn, med läroplanen som karta. Spela dem gratis här – eller bygg en egen i kväll.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <Button size="lg" className="h-12 rounded-full shadow-playful-lg" asChild>
                <Link to="/bygg">Så bygger du</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 rounded-full" asChild>
                <a href="#appar">Spela apparna ↓</a>
              </Button>
            </div>
            <ul className="mt-5 flex flex-wrap justify-center gap-2 text-sm md:justify-start">
              {["Lgr22 som karta", "Ingen reklam, ingen spårning", "Drift i Europa"].map((t) => (
                <li key={t} className="rounded-full border border-border bg-card/70 px-3 py-1 text-muted-foreground">{t}</li>
              ))}
            </ul>
          </div>
          <KottenHello className="h-40 w-40 flex-none md:h-64 md:w-64" />
        </div>

        {(subjects.length > 0 || ages.length > 0) && (
          <div id="appar" className="mt-8 flex flex-wrap items-center gap-2 scroll-mt-24">
            {subjects.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto md:flex-wrap md:overflow-visible">
                <Chip active={!subject} onClick={() => setSubject(null)}>Alla</Chip>
                {subjects.map((s) => (
                  <Chip key={s.id} active={subject === s.slug} onClick={() => setSubject(subject === s.slug ? null : s.slug)}>
                    <CategoryIcon icon={s.icon} /> {s.name}
                  </Chip>
                ))}
              </div>
            )}
            {ages.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none w-full md:w-auto md:ml-auto md:flex-wrap md:overflow-visible">
                <Chip active={!age} onClick={() => setAge(null)}>Alla årskurser</Chip>
                {ages.map((a) => (
                  <Chip key={a.id} active={age === a.slug} onClick={() => setAge(age === a.slug ? null : a.slug)}>
                    <CategoryIcon icon={a.icon} /> {a.name}
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
                categories={app.categories}
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

      {/* Bygg en egen: Studio first, then the assistant you already have */}
      <BuildYourOwn />

      {/* Dela din app */}
      <section className="container mx-auto px-4 py-12 pb-20">
        <div className="max-w-3xl mx-auto rounded-3xl bg-card/80 shadow-playful p-8 text-center space-y-5">
          <h2 className="text-2xl md:text-3xl font-heading font-bold">Har du byggt en app?</h2>
          <p className="text-muted-foreground">Tipsa oss på en minut – en länk räcker.</p>
          <Button size="lg" className="h-12 gap-2 rounded-full shadow-playful-lg" asChild>
            <Link to="/tipsa">
              <Rocket className="w-5 h-5" /> Tipsa om en app
            </Link>
          </Button>
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
