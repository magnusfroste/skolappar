import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, BookOpen, Grid3X3, Search, Move, 
  Timer, Trophy, Flame, BarChart3, Copy, Check,
  ExternalLink, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

interface ComponentPrompt {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompt: string;
}

const componentPrompts: ComponentPrompt[] = [
  {
    id: "quiz",
    name: "Quiz",
    icon: <Calculator className="w-5 h-5" />,
    description: "Flervalsfrågor med feedback",
    prompt: `Skapa en Quiz-komponent med följande:
- Visar en fråga med 4 svarsalternativ
- Markerar rätt/fel svar med grön/röd färg
- Går automatiskt vidare efter 1.5 sekunder
- Touch-vänliga knappar (minst 48px höjd)
- Responsiv: 1 kolumn på mobil, 2x2 grid på tablet
- Använd framer-motion för mjuka animationer
- Props: question, options[], correctIndex, onAnswer`
  },
  {
    id: "flashcard",
    name: "Flashcards",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Vändbara kort för glosor",
    prompt: `Skapa en FlashCard-komponent:
- Kort som vänds vid klick/touch
- Framsida visar fråga, baksida visar svar
- 3D flip-animation med framer-motion
- Swipe-stöd: vänster = fel, höger = rätt
- Minst 200px höjd på mobil, 300px på tablet
- Props: front, back, onSwipe`
  },
  {
    id: "memory",
    name: "Memory",
    icon: <Grid3X3 className="w-5 h-5" />,
    description: "Matchningsspel med kort",
    prompt: `Skapa ett MemoryGame:
- Rutnät med vändbara kort
- 2x3 på mobil, 3x4 på tablet, 4x4 på desktop
- Kort vänds tillbaka om de inte matchar (1.5s delay)
- Räknar antal försök
- Visar "Grattis!"-animation när klart
- Props: pairs[{id, content}], onComplete
- Touch-optimerat med 48px minimum touch target`
  },
  {
    id: "wordsearch",
    name: "Ordjakt",
    icon: <Search className="w-5 h-5" />,
    description: "Hitta ord i bokstavsrutnät",
    prompt: `Skapa ett WordSearch-spel:
- Rutnät med slumpade bokstäver
- Markera ord genom att dra finger/mus
- Visa lista med ord att hitta
- Markera hittade ord som överstrukna
- Touch-optimerat för surfplattor
- Props: words[], gridSize, onWordFound, onComplete`
  },
  {
    id: "dragdrop",
    name: "Drag & Drop",
    icon: <Move className="w-5 h-5" />,
    description: "Matcha begrepp med zoner",
    prompt: `Skapa en DragDropMatch-komponent:
- Dra objekt till rätt kategori/zon
- Touch-vänligt med tydlig feedback
- Visar rätt/fel vid släpp
- Stöd för flera zoner
- Props: items[], zones[], onComplete
- Responsiv: anpassar layout till skärmstorlek`
  },
  {
    id: "timer",
    name: "Timer",
    icon: <Timer className="w-5 h-5" />,
    description: "Countdown med färgkodning",
    prompt: `Skapa en Timer-komponent:
- Cirkulär progress-indikator
- Visar återstående tid i mitten
- Byter färg: grön → gul → röd
- Valfritt tickande ljud sista 5 sekunderna
- Callback när tiden är slut
- Props: seconds, onComplete, showWarning (default: true)`
  },
  {
    id: "score",
    name: "Poängsystem",
    icon: <Trophy className="w-5 h-5" />,
    description: "Hook med highscore",
    prompt: `Skapa ett useScore hook:
- Håller koll på aktuell poäng
- Sparar highscore i localStorage
- Funktioner: addPoints(n), subtractPoints(n), reset()
- Returnerar: score, highScore, isNewHighScore`
  },
  {
    id: "streak",
    name: "Svitsräknare",
    icon: <Flame className="w-5 h-5" />,
    description: "Rätt svar i rad",
    prompt: `Skapa en StreakCounter-komponent:
- Visar antal rätt svar i rad
- Firar vid milstolpar (3, 5, 10 i rad)
- Animerad eldflamma-emoji vid streak
- Shake-animation vid ny streak
- Props: count, milestone (default: 5)`
  },
  {
    id: "progress",
    name: "Progress",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Visa framsteg i övningar",
    prompt: `Skapa en ProgressBar-komponent:
- Visar aktuell/total (t.ex. "3 av 10")
- Animerad progress-bar
- Valfri färggradient baserad på progress
- Props: current, total, showLabel (default: true)`
  }
];

export function SkolkodenTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPrompt = async (id: string, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      toast.success("Prompt kopierad!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  return (
    <div className="space-y-6 pt-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-heading font-bold text-foreground">
          Skolkoden
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Kopiera en prompt och klistra in i Lovable för att skapa komponenten.
        </p>
      </div>

      {/* Component Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {componentPrompts.map((comp) => (
          <Card 
            key={comp.id} 
            className="group hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {comp.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{comp.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {comp.description}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => copyPrompt(comp.id, comp.prompt)}
              >
                {copiedId === comp.id ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                    Kopierad!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Kopiera prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Links */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Button asChild variant="default" className="gap-2">
          <Link to="/resurser/learn/skolkoden-pedagogiska-komponenter">
            Alla prompts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <a 
            href="https://lovable.dev/projects/73d9b3b0-6d5d-4f2a-88bc-b6df97aefc60" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Remixa mallen
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
