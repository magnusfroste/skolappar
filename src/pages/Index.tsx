import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { TopAppsSection } from '@/components/TopAppsSection';
import { RecentAppsSection } from '@/components/RecentAppsSection';
import { TopIdeasSection } from '@/components/TopIdeasSection';
import { SEO, websiteSchema, organizationSchema } from '@/components/SEO';
import { Sparkles, ArrowRight, BookOpen, Rocket, Users, Heart, Code, ChevronRight } from 'lucide-react';

const combinedSchema = [websiteSchema, organizationSchema];

export default function Index() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO 
        url="/"
        jsonLd={combinedSchema}
      />
      
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[5%] text-7xl animate-float opacity-10">📚</div>
        <div className="absolute top-[30%] right-[8%] text-6xl animate-bounce-gentle opacity-10" style={{ animationDelay: '0.5s' }}>🎮</div>
        <div className="absolute top-[60%] left-[10%] text-5xl animate-float opacity-10" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute bottom-[20%] right-[15%] text-6xl animate-bounce-gentle opacity-10" style={{ animationDelay: '1.5s' }}>🚀</div>
        <div className="absolute top-[45%] left-[50%] text-5xl animate-float opacity-10" style={{ animationDelay: '2s' }}>🎨</div>
      </div>

      {/* Navigation */}
      <PublicNav variant="transparent" />

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 pt-16 pb-24 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            Vibe coding för alla föräldrar
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-black leading-tight">
            Appar gjorda av{' '}
            <span className="text-gradient">föräldrar</span>
            {' '}för{' '}
            <span className="text-gradient">barn</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            En community där engagerade föräldrar delar sina hemmagjorda skolappar. 
            <span className="font-semibold text-foreground"> Delad glädje är dubbel glädje!</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="h-14 px-8 text-lg font-semibold gap-2 shadow-playful-lg" asChild>
              <Link to="/apps">
                Utforska appar
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold" asChild>
              <Link to={user ? "/min-sida/ny" : "/auth"}>
                Dela din app
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '📱', label: 'Appar', value: '50+' },
              { icon: '👨‍👩‍👧‍👦', label: 'Föräldrar', value: '30+' },
              { icon: '📚', label: 'Ämnen', value: '9' },
              { icon: '❤️', label: 'Upvotes', value: '500+' },
            ].map((stat, i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-card/70 backdrop-blur-sm shadow-playful animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-heading font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Apps Section (conditionally rendered based on admin setting) */}
      <TopAppsSection />

      {/* Top Ideas Section */}
      <TopIdeasSection />

      {/* Recent Apps Section (conditionally rendered based on admin setting) */}
      <RecentAppsSection />

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Varför skolappar?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ett alternativ till TikTok och Roblox – appar som gör lärande kul!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: 'Lärande som funkar',
                description: 'Appar testade på riktiga barn. Om det fungerar för ett barn, fungerar det för många!',
                color: 'primary',
              },
              {
                icon: Users,
                title: 'Community-driven',
                description: 'Föräldrar som delar med sig av sina bästa idéer. Tillsammans gör vi skillnad.',
                color: 'secondary',
              },
              {
                icon: Heart,
                title: 'Helt gratis',
                description: 'Att dela kostar inget. Vi tror på öppen innovation och demokratiserat lärande.',
                color: 'accent',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-card/80 backdrop-blur-sm shadow-playful hover:shadow-playful-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-xl mb-4 ${
                  feature.color === 'primary' ? 'bg-primary/10 text-primary' :
                  feature.color === 'secondary' ? 'bg-secondary/10 text-secondary' :
                  'bg-accent/20 text-accent-foreground'
                }`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-heading font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Coding Section */}
      <section className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/15 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-card shadow-playful-lg flex items-center justify-center">
                  <Code className="w-12 h-12 text-primary" />
                </div>
              </div>
              <div className="text-center md:text-left space-y-4">
                <h2 className="text-2xl md:text-3xl font-heading font-bold">
                  AI-revolutionen är här! 🚀
                </h2>
                <p className="text-muted-foreground">
                  Med vibe coding behöver du inte kunna programmera. Berätta bara vilket problem ditt barn har, 
                  så hjälper AI:n dig att skapa en app. Det har aldrig varit enklare!
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  {[
                    { name: 'Lovable', slug: 'lovable' },
                    { name: 'Google AI Studio', slug: 'google-ai-studio' },
                    { name: 'Base44', slug: 'base44' },
                    { name: 'Bolt.new', slug: 'bolt-new' },
                    { name: 'V0', slug: 'v0-dev' },
                    { name: 'Cursor', slug: 'cursor' },
                    { name: 'Windsurf', slug: 'windsurf' },
                    { name: 'VS Code + Cline', slug: 'vscode-cline' },
                    { name: 'VS Code + Roo', slug: 'vscode-roo' },
                    { name: 'Replit', slug: 'replit' },
                  ].map((tool) => (
                    <Link
                      key={tool.name}
                      to={`/resurser/tips/${tool.slug}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-card text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {tool.name}
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-16 pb-24">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold">
            Redo att börja vibe-coda?
          </h2>
          <p className="text-lg text-muted-foreground">
            Gör det tillsammans med dina barn. <span className="font-semibold text-foreground">De är bara barn ett tag!</span>
          </p>
          <Button size="lg" className="h-14 px-8 text-lg font-semibold gap-2 shadow-playful-lg" asChild>
            <Link to={user ? "/min-sida/ny" : "/auth"}>
              <Rocket className="w-5 h-5" />
              Kom igång nu
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  );
}
