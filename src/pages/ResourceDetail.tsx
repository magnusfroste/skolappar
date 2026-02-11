import { useParams, Link } from "react-router-dom";
import { useResource } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SEO, createArticleSchema } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

export default function ResourceDetail() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { data: resource, isLoading, error } = useResource(slug || '');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav variant="solid" />
        <div className="container max-w-3xl py-12 px-4">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNav variant="solid" />
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Artikeln hittades inte</p>
          <Link to="/resurser">
            <Button variant="outline">Tillbaka till resurser</Button>
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const config = useSiteConfig();
  const articleSchema = createArticleSchema({
    title: resource.title,
    description: resource.excerpt || resource.title,
    url: `/resurser/${category}/${slug}`,
    datePublished: resource.created_at,
    dateModified: resource.updated_at,
  }, config);

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={resource.title}
        description={resource.excerpt || resource.title}
        url={`/resurser/${category}/${slug}`}
        type="article"
        article={{
          publishedTime: resource.created_at,
          modifiedTime: resource.updated_at,
        }}
        jsonLd={articleSchema}
      />
      
      <PublicNav variant="solid" />
      
      <div className="container max-w-3xl py-12 px-4">
        <article>
          <MarkdownRenderer content={resource.content} />
        </article>
      </div>
      
      <PublicFooter />
    </div>
  );
}