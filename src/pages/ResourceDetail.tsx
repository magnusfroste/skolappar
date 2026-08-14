import { useParams, Link } from "react-router-dom";
import { useResource } from "@/hooks/useResources";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { SEO, createArticleSchema, createHowToSchema } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";

function extractStepsFromMarkdown(content: string): Array<{ name: string; text: string }> {
  const lines = content.split('\n');
  const steps: Array<{ name: string; text: string }> = [];
  let currentStep: { name: string; text: string } | null = null;

  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(.+)/);
    if (match) {
      if (currentStep) steps.push(currentStep);
      currentStep = { name: match[1].trim(), text: '' };
    } else if (currentStep && line.trim()) {
      currentStep.text += (currentStep.text ? ' ' : '') + line.trim();
    }
  }
  if (currentStep) steps.push(currentStep);
  return steps;
}

export default function ResourceDetail() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const { data: resource, isLoading, error } = useResource(slug || '');
  const config = useSiteConfig();

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

  const articleSchema = createArticleSchema({
    title: resource.title,
    description: resource.excerpt || resource.title,
    url: `/resurser/${category}/${slug}`,
    image: resource.cover_image_url || undefined,
    datePublished: resource.created_at,
    dateModified: resource.updated_at,
  }, config);

  const isGuide = resource.category === 'learn' || resource.category === 'tips';
  const steps = isGuide ? extractStepsFromMarkdown(resource.content) : [];
  const howToSchema = isGuide && steps.length >= 2
    ? createHowToSchema({
        name: resource.title,
        description: resource.excerpt || resource.title,
        steps,
      }, config)
    : null;

  const jsonLd = howToSchema ? [articleSchema, howToSchema] : articleSchema;

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
        jsonLd={jsonLd}
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