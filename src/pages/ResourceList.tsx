import { useParams, Link } from "react-router-dom";
import { useResources, ResourceCategory } from "@/hooks/useResources";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Rocket, Sparkles, Monitor, Trophy, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const categoryMeta: Record<string, { category: ResourceCategory; title: string; icon: React.ReactNode }> = {
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
};

export default function ResourceList() {
  const { category: categorySlug } = useParams<{ category: string }>();
  const meta = categoryMeta[categorySlug || ''];
  const { data: resources, isLoading } = useResources(meta?.category);

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Kategorin hittades inte</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <Link to="/resurser">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Alla resurser
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {meta.icon}
          </div>
          <h1 className="text-3xl font-bold text-foreground">{meta.title}</h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : resources?.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">
            Inga artiklar ännu. Kom tillbaka snart!
          </p>
        ) : (
          <div className="space-y-4">
            {resources?.map(resource => (
              <Link key={resource.id} to={`/resurser/${categorySlug}/${resource.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted text-muted-foreground mt-1">
                      {iconMap[resource.icon || ''] || <Lightbulb className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {resource.title}
                      </CardTitle>
                      {resource.excerpt && (
                        <CardDescription className="mt-2">
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
    </div>
  );
}
