import { Link } from "react-router-dom";
import { useResources, ResourceCategory } from "@/hooks/useResources";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Rocket, Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const categoryConfig: Record<ResourceCategory, { title: string; description: string; icon: React.ReactNode; path: string }> = {
  tips: {
    title: "Tips & tricks",
    description: "Praktiska råd för att skapa engagerande pedagogiska appar",
    icon: <Lightbulb className="h-8 w-8" />,
    path: "/resurser/tips"
  },
  learn: {
    title: "Lär dig vibe-coda",
    description: "Steg-för-steg guider för att komma igång med AI-kodning",
    icon: <Rocket className="h-8 w-8" />,
    path: "/resurser/lara"
  },
  inspiration: {
    title: "Inspiration",
    description: "Idéer och exempel från framgångsrika skolappar",
    icon: <Sparkles className="h-8 w-8" />,
    path: "/resurser/inspiration"
  }
};

export default function Resources() {
  const { data: resources, isLoading } = useResources();

  const getResourceCount = (category: ResourceCategory) => {
    return resources?.filter(r => r.category === category).length || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Resurser</h1>
          <p className="text-lg text-muted-foreground">
            Allt du behöver för att skapa fantastiska pedagogiska appar
          </p>
        </div>

        <div className="grid gap-6">
          {(Object.keys(categoryConfig) as ResourceCategory[]).map((category) => {
            const config = categoryConfig[category];
            const count = getResourceCount(category);

            return (
              <Link key={category} to={config.path}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10 text-primary">
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {config.title}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {config.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {isLoading ? (
                        <Skeleton className="h-5 w-16" />
                      ) : (
                        <span className="text-sm">{count} artiklar</span>
                      )}
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
