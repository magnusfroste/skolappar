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

export function baseUrl(config: SiteConfig) {
  return (config.site_url || '').replace(/\/$/, '');
}

export function absoluteUrl(value: string | undefined, base: string) {
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
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
  const base = baseUrl(config);
  const cleanTitle = title?.replace(new RegExp(`\\s*\\|\\s*${config.site_name}\\s*$`, 'i'), '').trim();
  const fullTitle = cleanTitle
    ? `${cleanTitle} | ${config.site_name}`
    : `${config.site_name} – pedagogiska appar av föräldrar för barn`;
  const canonicalUrl = url ? `${base}${url}` : `${base}/`;
  const metaDescription = description || config.site_description;
  const metaImage = absoluteUrl(image || config.site_image, base);

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
    url: `${baseUrl(config)}/`,
    description: config.site_description,
    inLanguage: config.site_language,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl(config)}/apps?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema(config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.organization_name || config.site_name,
    url: `${baseUrl(config)}/`,
    logo: absoluteUrl(config.site_logo, baseUrl(config)) || `${baseUrl(config)}/favicon.png`,
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
  pageUrl?: string;
  image?: string;
  creator?: string;
  datePublished?: string;
}, config: SiteConfig) {
  const base = baseUrl(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.title,
    description: app.description,
    url: app.pageUrl ? `${base}${app.pageUrl}` : app.url,
    installUrl: app.url,
    image: absoluteUrl(app.image, base) || absoluteUrl(config.site_image, base),
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
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}, config: SiteConfig) {
  const base = baseUrl(config);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${base}${article.url}`,
    image: absoluteUrl(article.image, base) || absoluteUrl(config.site_image, base),
    author: {
      '@type': 'Organization',
      name: article.author || config.organization_name || config.site_name,
      url: `${base}/`,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${base}${article.url}` },
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

export function createHowToSchema(howTo: {
  name: string;
  description: string;
  steps: Array<{ name: string; text: string; url?: string }>;
}, config: SiteConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: howTo.name,
    description: howTo.description,
    inLanguage: config.site_language,
    step: howTo.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
      url: step.url,
    })),
  };
}

export function createQAPageSchema(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}
