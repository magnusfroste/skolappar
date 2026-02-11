import { Helmet } from 'react-helmet';
import { useSiteConfig, type SiteConfig } from '@/hooks/useSiteConfig';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
  };
  jsonLd?: object;
}

export function SEO({
  title,
  description,
  image,
  url,
  type = 'website',
  article,
  jsonLd,
}: SEOProps) {
  const config = useSiteConfig();
  const fullTitle = title ? `${title} | ${config.site_name}` : `${config.site_name} - ${config.site_description.slice(0, 50)}`;
  const canonicalUrl = url ? `${config.site_url}${url}` : config.site_url;
  const metaDescription = description || config.site_description;
  const metaImage = image || config.site_image;

  return (
    <Helmet>
      <html lang={config.site_language} />
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={config.site_keywords} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      {metaImage && <meta property="og:image" content={metaImage} />}
      <meta property="og:locale" content={config.site_locale} />
      <meta property="og:site_name" content={config.site_name} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {metaImage && <meta name="twitter:image" content={metaImage} />}

      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Dynamic schema builders that use config
export function buildWebsiteSchema(config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.site_name,
    url: config.site_url,
    description: config.site_description,
    inLanguage: config.site_language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.site_url}/appar?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema(config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.organization_name || config.site_name,
    url: config.site_url,
    logo: config.site_logo || `${config.site_url}/favicon.png`,
    description: config.site_description,
    sameAs: [],
  };
}

export function buildFaqSchema(config: SiteConfig) {
  if (!config.faq_items || config.faq_items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faq_items.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function createAppSchema(app: {
  title: string;
  description: string;
  url: string;
  image?: string;
  creator?: string;
  datePublished?: string;
}, config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.title,
    description: app.description,
    url: app.url,
    image: app.image,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    inLanguage: config.site_language,
    author: app.creator ? { '@type': 'Person', name: app.creator } : undefined,
    datePublished: app.datePublished,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: config.site_currency,
    },
  };
}

export function createArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}, config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${config.site_url}${article.url}`,
    inLanguage: config.site_language,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    publisher: buildOrganizationSchema(config),
  };
}

export function createFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
