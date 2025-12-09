import { useState } from "react";
import { Helmet } from "react-helmet";
import { Link2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicNav } from "@/components/PublicNav";
import { PublicFooter } from "@/components/PublicFooter";
import { ResponsivePreview } from "@/components/ResponsivePreview";
import { AppChecklist } from "@/components/AppChecklist";
import { ChecklistResult } from "@/components/ChecklistResult";

export default function TestYourApp() {
  const [url, setUrl] = useState("");
  const [testUrl, setTestUrl] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = "https://" + formattedUrl;
    }
    setTestUrl(formattedUrl);
  };

  const handleScoreChange = (newScore: number, newTotal: number) => {
    setScore(newScore);
    setTotal(newTotal);
  };

  return (
    <>
      <Helmet>
        <title>Testa din app | Skolappar.com</title>
        <meta 
          name="description" 
          content="Testa om din pedagogiska app är redo för plattor och mobiler innan du skickar in den." 
        />
      </Helmet>

      <PublicNav variant="solid" />

      <main className="min-h-screen bg-gradient-to-b from-background to-muted/30 pt-20">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Kvalitetskontroll</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Testa din app
            </h1>
            <p className="text-muted-foreground">
              Se hur din app ser ut på olika enheter och gå igenom vår checklista 
              för att säkerställa att den är redo för barn på plattor och mobiler.
            </p>
          </div>

          {/* URL Input */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-12">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://din-app.lovable.app"
                  className="pl-10 h-12 text-base"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="gap-2">
                Testa
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {testUrl && (
            <div className="space-y-12">
              {/* Responsive Preview */}
              <section>
                <h2 className="text-xl font-semibold text-foreground text-center mb-6">
                  Så ser din app ut på olika enheter
                </h2>
                <ResponsivePreview url={testUrl} />
              </section>

              {/* Checklist */}
              <section className="max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-foreground text-center mb-6">
                  Checklista för pedagogiska appar
                </h2>
                <div className="space-y-6">
                  <AppChecklist onScoreChange={handleScoreChange} />
                  <ChecklistResult score={score} total={total} />
                </div>
              </section>
            </div>
          )}

          {/* Tips section when no URL */}
          {!testUrl && (
            <div className="max-w-2xl mx-auto text-center py-12">
              <div className="p-8 rounded-2xl bg-card border border-border">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Vad testas?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2 text-left max-w-md mx-auto">
                  <li>📱 Hur appen ser ut på mobil, platta och desktop</li>
                  <li>👆 Touch-vänlighet med tillräckligt stora knappar</li>
                  <li>📖 Läsbarhet och barnanpassat språk</li>
                  <li>⚡ Laddningstid och prestanda</li>
                  <li>👤 Att du som skapare syns i appen</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </>
  );
}
