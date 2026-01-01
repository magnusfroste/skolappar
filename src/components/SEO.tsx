import { Helmet } from 'react-helmet';

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

const DEFAULT_TITLE = 'Skolappar - Pedagogiska appar av föräldrar för barn';
const DEFAULT_DESCRIPTION = 'En community där engagerade föräldrar delar sina hemmagjorda skolappar. Utforska pedagogiska appar för barn i alla åldrar. Delad glädje är dubbel glädje!';
const DEFAULT_IMAGE = 'https://storage.googleapis.com/gpt-engineer-file-uploads/Otwc5k988dRBXnycfCqkhVYDdj42/social-images/social-1764953240841-Screenshot 2025-12-05 at 17.46.45.png';
const SITE_URL = 'https://skolappar.com';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  article,
  jsonLd,
}: SEOProps) {
  const fullTitle = title ? `${title} | Skolappar` : DEFAULT_TITLE;
  const canonicalUrl = url ? `${SITE_URL}${url}` : SITE_URL;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="sv_SE" />
      <meta property="og:site_name" content="Skolappar" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

// Pre-built JSON-LD schemas
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Skolappar',
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_URL}/appar?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Skolappar',
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  description: 'En community där engagerade föräldrar delar sina hemmagjorda skolappar.',
  sameAs: [],
};

export function createAppSchema(app: {
  title: string;
  description: string;
  url: string;
  image?: string;
  creator?: string;
  datePublished?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.title,
    description: app.description,
    url: app.url,
    image: app.image,
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    author: app.creator ? {
      '@type': 'Person',
      name: app.creator,
    } : undefined,
    datePublished: app.datePublished,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'SEK',
    },
  };
}

export function createArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}${article.url}`,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    publisher: organizationSchema,
  };
}

// FAQ Schema for AEO (Answer Engine Optimization)
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Vad är Skolappar?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Skolappar är en community där engagerade föräldrar delar sina hemmagjorda pedagogiska appar för barn. Alla appar är gratis och skapade med kärlek för att hjälpa barn lära sig.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hur kan jag dela min egen skolapp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Skapa ett konto på Skolappar.com, klicka på "Lägg till app" i din dashboard och fyll i information om din app. Efter granskning blir den synlig för alla.',
      },
    },
    {
      '@type': 'Question',
      name: 'Är apparna på Skolappar gratis?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Ja, alla appar som delas på Skolappar är helt gratis att använda. Skaparna delar med sig av sina appar för att hjälpa andra barn.',
      },
    },
    {
      '@type': 'Question',
      name: 'Vilka ämnen finns det appar för?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Det finns appar för många ämnen inklusive matematik, svenska, engelska, NO, SO och kreativa ämnen. Apparna är anpassade för olika åldersgrupper från förskola till högstadiet.',
      },
    },
    {
      '@type': 'Question',
      name: 'Hur föreslår jag en idé för en ny app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Gå till "Idéer" i menyn och klicka på "Ny idé". Beskriv din idé och andra i communityn kan rösta på den eller välja att bygga appen.',
      },
    },
  ],
};

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
