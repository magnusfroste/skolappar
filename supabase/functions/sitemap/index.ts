import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_URL = 'https://skolappar.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch approved/featured apps
    const { data: apps, error: appsError } = await supabase
      .from('apps')
      .select('id, updated_at')
      .in('status', ['approved', 'featured'])
      .order('updated_at', { ascending: false })

    if (appsError) {
      console.error('Error fetching apps:', appsError)
    }

    // Fetch published resources
    const { data: resources, error: resourcesError } = await supabase
      .from('resources')
      .select('slug, category, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false })

    if (resourcesError) {
      console.error('Error fetching resources:', resourcesError)
    }

    // Build sitemap XML
    const today = new Date().toISOString().split('T')[0]
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/appar</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${SITE_URL}/resurser</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${SITE_URL}/startmall</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${SITE_URL}/testa-din-app</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/villkor</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${SITE_URL}/integritet</loc>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`

    // Add all apps
    if (apps && apps.length > 0) {
      for (const app of apps) {
        const lastmod = app.updated_at ? new Date(app.updated_at).toISOString().split('T')[0] : today
        sitemap += `
  <url>
    <loc>${SITE_URL}/app/${app.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
      }
    }

    // Add all resources
    if (resources && resources.length > 0) {
      for (const resource of resources) {
        const lastmod = resource.updated_at ? new Date(resource.updated_at).toISOString().split('T')[0] : today
        sitemap += `
  <url>
    <loc>${SITE_URL}/resurser/${resource.category}/${resource.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
      }
    }

    sitemap += `
</urlset>`

    console.log(`Generated sitemap with ${apps?.length || 0} apps and ${resources?.length || 0} resources`)

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating sitemap:', error)
    return new Response('Error generating sitemap', {
      status: 500,
      headers: corsHeaders,
    })
  }
})
