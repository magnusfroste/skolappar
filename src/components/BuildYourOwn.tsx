import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Cpu, MessageSquareText, Share2, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

// "Bygg en egen": the way from a parent's idea to an app in the gallery. Shipholm Studio is the
// one we recommend; the assistants many parents already have come second; and the last line
// says where the AI's power comes from – and that anyone can share theirs.
// Outbound links carry utm_source=skolappar so the three sites can see what the gallery sends.

const from = "utm_source=skolappar&utm_medium=referral";
const STUDIO_URL = `https://studio.shipholm.com/?${from}`;
const SHIPHOLM_URL = `https://shipholm.com/?${from}`;
const GARAGE_URL = `https://garageai.eu/?${from}`;

const STEPS = [
  { icon: MessageSquareText, title: "Beskriv", text: "Skriv vad ditt barn vill öva på – på vanlig svenska." },
  { icon: Sparkles, title: "Se den växa", text: "Appen byggs medan du tittar. Ändra tills den sitter." },
  { icon: Share2, title: "Dela", text: "Ett klick, så har den en egen adress. Tipsa oss – så hamnar den här." },
];

// The assistants a parent may already use. Those with a guide of their own here link to it.
const ASSISTANTS: { name: string; to?: string; href?: string }[] = [
  { name: "Claude", to: "/resurser/plattformar/claude-code" },
  { name: "ChatGPT", href: "https://chatgpt.com" },
  { name: "opencode", href: "https://opencode.ai" },
  { name: "Kilo Code", href: "https://kilo.ai" },
  { name: "Google AI Studio", to: "/resurser/plattformar/google-ai-studio" },
];

const chip =
  "inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm hover:bg-primary hover:text-primary-foreground transition-colors min-h-[36px]";

export function BuildYourOwn() {
  return (
    <section className="container mx-auto px-4 py-12" aria-labelledby="bygg-egen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-primary">Från förälder till förälder</p>
          <h2 id="bygg-egen" className="text-2xl md:text-3xl font-heading font-bold">
            Saknas en app? Bygg den själv.
          </h2>
          <p className="text-muted-foreground">Du behöver inte kunna koda. Beskriv – resten gör en AI.</p>
        </div>

        {/* The one we recommend */}
        <div className="rounded-3xl border-2 border-primary/40 bg-card shadow-playful-lg p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1">
              <Star className="w-3.5 h-3.5 fill-primary" aria-hidden /> Vårt tips
            </span>
            <h3 className="text-xl md:text-2xl font-heading font-bold">Shipholm Studio</h3>
            <p className="text-muted-foreground">
              Byggd för just det här. Gratis att prova, inget att installera – och appen ligger i Europa.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Button size="lg" className="h-12 gap-2 rounded-full shadow-playful-lg" asChild>
              <a href={STUDIO_URL} target="_blank" rel="noopener">
                Öppna Studio <ArrowUpRight className="w-5 h-5" aria-hidden />
              </a>
            </Button>
            <a href={SHIPHOLM_URL} target="_blank" rel="noopener" className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline">
              Publiceras på Shipholm
            </a>
          </div>
        </div>

        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-3xl bg-card/80 shadow-playful p-5 text-center space-y-2">
              <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-primary/10 text-primary">
                <step.icon className="w-6 h-6" aria-hidden />
              </span>
              <h3 className="font-heading font-bold">
                <span className="text-muted-foreground">{i + 1}.</span> {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>

        {/* The assistant you already have */}
        <div className="rounded-3xl bg-card/80 shadow-playful p-6 text-center space-y-3">
          <h3 className="font-heading font-bold">Har du redan en AI-assistent?</h3>
          <p className="text-sm text-muted-foreground">
            Bygg med den – och be den lägga ut appen på{" "}
            <a href={SHIPHOLM_URL} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-foreground">
              Shipholm
            </a>
            .
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {ASSISTANTS.map((a) =>
              a.to ? (
                <Link key={a.name} to={a.to} className={chip}>
                  {a.name} <ChevronRight className="w-3 h-3" aria-hidden />
                </Link>
              ) : (
                <a key={a.name} href={a.href} target="_blank" rel="noopener noreferrer" className={chip}>
                  {a.name} <ArrowUpRight className="w-3 h-3" aria-hidden />
                </a>
              ),
            )}
            <Link to="/resurser/plattformar" className={`${chip} bg-transparent border border-border`}>
              Fler verktyg <ChevronRight className="w-3 h-3" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Where the power comes from */}
        <p className="flex items-start sm:items-center justify-center gap-2 text-sm text-muted-foreground text-left sm:text-center max-w-2xl mx-auto">
          <Cpu className="w-4 h-4 mt-0.5 sm:mt-0 shrink-0 text-primary" aria-hidden />
          <span>
            I Studio kommer AI-kraften från datorer som människor delar med varandra. Har du ett grafikkort som vilar om nätterna?{" "}
            <a href={GARAGE_URL} target="_blank" rel="noopener" className="font-medium text-foreground underline underline-offset-4">
              Dela det via GarageAI
            </a>{" "}
            – så kan fler föräldrar bygga åt sina barn.
          </span>
        </p>
      </div>
    </section>
  );
}
