import { useParams, Link } from "react-router-dom";
import { useResources, ResourceCategory } from "@/hooks/useResources";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Rocket, Sparkles, Monitor, Trophy, Shield, TestTube2, Cpu, BookOpen, Brain, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { SEO } from "@/components/SEO";

const categoryMeta: Record<string, { category: ResourceCategory; title: string; icon: React.ReactNode }> = {
  plattformar: { category: 'platforms', title: "Populära Vibe-plattformar", icon: <Cpu className="h-6 w-6" /> },
  tips: { category: 'tips', title: "Tips & tricks", icon: <Lightbulb className="h-6 w-6" /> },
  lara: { category: 'learn', title: "Lär dig vibe-coda", icon: <Rocket className="h-6 w-6" /> },
  inspiration: { category: 'inspiration', title: "Inspiration", icon: <Sparkles className="h-6 w-6" /> }
};

const iconMap: Record<string, React.ReactNode> = {
  Lightbulb: <Lightbulb className="h-5 w-5" />,
  Monitor: <Monitor className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Rocket: <Rocket className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  TestTube2: <TestTube2 className="h-5 w-5" />,
  Cpu: <Cpu className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Brain: <Brain className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
};

export default function ResourceList() {
  const { category: categorySlug } = useParams<{ category: string }>();
  const meta = categoryMeta[categorySlug || ''];
  const { data: resources, isLoading } = useResources(meta?.category);

  if (!meta) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav variant="solid" />
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Kategorin hittades inte</p>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={meta.title}
        description={`${meta.title} - Resurser för att skapa pedagogiska appar`}
        url={`/resurser/${categorySlug}`}
      />
      
      <PublicNav variant="solid" />
      
      <div className="container max-w-3xl py-12 px-4">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            {meta.icon}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : resources?.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Inga artiklar ännu. Kom tillbaka snart!
          </p>
        ) : (
          <div className="space-y-4">
            {resources?.map(resource => (
              <Link key={resource.id} to={`/resurser/${categorySlug}/${resource.slug}`} className="block">
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group border-border/50 hover:border-primary/20">
                  <CardHeader className="flex flex-row items-start gap-4 py-5">
                    <div className="p-2.5 rounded-xl bg-muted text-muted-foreground mt-0.5 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {iconMap[resource.icon || ''] || <Lightbulb className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors leading-snug">
                        {resource.title}
                      </CardTitle>
                      {resource.excerpt && (
                        <CardDescription className="mt-1.5 line-clamp-2">
                          {resource.excerpt}
                        </CardDescription>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      <PublicFooter />
    </div>
  );
}
