import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch site config
    const { data: settings } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', [
        'site_name', 'site_url', 'site_description', 'site_language',
        'organization_name', 'faq_items', 'llms_txt_intro', 'llms_txt_extra'
      ])

    const config: Record<string, any> = {}
    settings?.forEach((s: any) => { config[s.key] = s.value })

    const siteName = config.site_name || 'Skolappar'
    const siteUrl = config.site_url || 'https://www.skolappar.com'
    const siteDesc = config.site_description || 'En community där engagerade föräldrar delar sina hemmagjorda skolappar.'
    const siteLang = config.site_language || 'sv'
    const orgName = config.organization_name || 'Skolappar'
    const customIntro = config.llms_txt_intro || ''
    const customExtra = config.llms_txt_extra || ''
    const faqs = Array.isArray(config.faq_items) ? config.faq_items : []

    // Fetch approved/featured apps
    const { data: apps } = await supabase
      .from('apps')
      .select('id, title, description, url, created_at')
      .in('status', ['approved', 'featured'])
      .order('upvotes_count', { ascending: false })
      .limit(50)

    // Fetch published resources
    const { data: resources } = await supabase
      .from('resources')
      .select('title, slug, category, excerpt')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    // Build llms.txt
    let output = `# ${siteName}\n\n`
    output += `> ${siteDesc}\n\n`

    if (customIntro) {
      output += `${customIntro}\n\n`
    }

    output += `- Language: ${siteLang}\n`
    output += `- Organization: ${orgName}\n`
    output += `- Website: ${siteUrl}\n`
    output += `- Sitemap: ${siteUrl}/sitemap.xml\n\n`

    // FAQ section
    if (faqs.length > 0) {
      output += `## Frequently Asked Questions\n\n`
      for (const faq of faqs) {
        output += `### ${faq.question}\n${faq.answer}\n\n`
      }
    }

    // Apps section
    if (apps && apps.length > 0) {
      output += `## Educational Apps (${apps.length} listed)\n\n`
      for (const app of apps) {
        output += `- [${app.title}](${siteUrl}/app/${app.id}): ${app.description}\n`
      }
      output += '\n'
    }

    // Resources section
    if (resources && resources.length > 0) {
      output += `## Resources & Guides\n\n`
      for (const r of resources) {
        output += `- [${r.title}](${siteUrl}/resurser/${r.category}/${r.slug})`
        if (r.excerpt) output += `: ${r.excerpt}`
        output += '\n'
      }
      output += '\n'
    }

    // Custom extra content
    if (customExtra) {
      output += `${customExtra}\n\n`
    }

    output += `---\nGenerated: ${new Date().toISOString().split('T')[0]}\n`

    return new Response(output, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error generating llms.txt:', error)
    return new Response('Error generating llms.txt', {
      status: 500,
      headers: corsHeaders,
    })
  }
})
