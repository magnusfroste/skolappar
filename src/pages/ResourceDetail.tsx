import { useParams, Link } from "react-router-dom";
import { useResource } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResourceDetail() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { data: resource, isLoading, error } = useResource(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-3xl py-12 px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Artikeln hittades inte</p>
        <Link to="/resurser">
          <Button variant="outline">Tillbaka till resurser</Button>
        </Link>
      </div>
    );
  }

  // Simple markdown to HTML conversion
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Headers
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-lg font-semibold mt-6 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-xl font-bold mt-8 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
        }
        // List items
        if (line.startsWith('- ')) {
          const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <li key={i} className="ml-4" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        // Bold text in paragraphs
        if (line.trim()) {
          const content = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return <p key={i} className="mb-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: content }} />;
        }
        return null;
      });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-12 px-4">
        <Link to={`/resurser/${category}`}>
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
        </Link>

        <article className="prose prose-lg max-w-none">
          {renderContent(resource.content)}
        </article>
      </div>
    </div>
  );
}
