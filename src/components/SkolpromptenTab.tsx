import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calculator, BookOpen, Grid3X3, Search, Move, 
  Timer, Trophy, Flame, BarChart3, Copy, Check,
  ExternalLink, ArrowRight, Rocket, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface ComponentPrompt {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  prompt: string;
}

const superPrompt = `# SKOLAPPAR STARTMALL - PEDAGOGISK WEBAPP

Skapa en komplett pedagogisk webapp för barn med React. Mallen ska innehålla färdiga komponenter som kan användas för att bygga lärorika spel och övningar.

## TEKNISK STACK
- React 18 + TypeScript + Vite
- Tailwind CSS för styling
- shadcn/ui för baskomponenter
- Lucide React för ikoner
- Framer Motion för animationer (om tillgänglig)

## DESIGN-SYSTEM

### Färgpalett (varma, lekfulla färger)
- Primary: Orange/korall (hsl 25 95% 53%)
- Secondary: Turkos (hsl 175 70% 45%)
- Accent: Gul (hsl 45 100% 60%)
- Success: Grön (hsl 142 70% 45%)
- Background: Ljus cream (hsl 40 30% 98%)

### Typografi
- Rubriker: Rundad, lekfull font
- Brödtext: Läsbar, tydlig font
- Storlekar: Generösa för barn

### Touch-targets
- Minst 48x48px för alla klickbara element
- Generös padding på knappar
- Tydlig hover/active feedback

### Animationer
- Mjuka övergångar (0.2-0.3s)
- Belöningsanimationer (confetti, stjärnor)
- Feedback vid rätt/fel svar

## MAPPSTRUKTUR

src/
├── components/
│   ├── edu/           # Pedagogiska komponenter
│   │   ├── QuizCard.tsx
│   │   ├── FlashCard.tsx
│   │   ├── MemoryGame.tsx
│   │   ├── WordSearch.tsx
│   │   ├── DragDropMatch.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Timer.tsx
│   │   └── AnswerButton.tsx
│   ├── feedback/      # Belöning & feedback
│   │   ├── SuccessAnimation.tsx
│   │   ├── ScoreDisplay.tsx
│   │   ├── RewardBadge.tsx
│   │   └── StreakCounter.tsx
│   └── layout/        # Navigation & layout
│       ├── GameContainer.tsx
│       ├── ChildFriendlyNav.tsx
│       └── BackButton.tsx
├── hooks/
│   ├── useScore.ts
│   ├── useTimer.ts
│   └── useLocalStorage.ts
├── data/
│   ├── mathQuestions.ts
│   ├── swedishWords.ts
│   └── gameData.ts
└── pages/
    └── Demo.tsx

## KOMPONENTER ATT SKAPA

### 1. QuizCard
Flervalsfrågor med 4 alternativ.
- Props: question, options[], correctIndex, onAnswer, difficulty?
- Markerar rätt (grön) / fel (röd) vid svar
- Animerad feedback
- Touch-vänliga knappar i 2x2 grid på mobil

### 2. FlashCard
Vändbara kort för glosor/fakta.
- Props: front, back, onFlip?
- 3D-flip animation vid klick
- Minst 200px höjd
- Tydlig indikation att kortet kan vändas

### 3. MemoryGame
Klassiskt memory-spel.
- Props: pairs[{id, content}], onComplete?
- Responsivt rutnät (2x3 mobil, 3x4 tablet, 4x4 desktop)
- Visar antal drag
- Firar vid vinst

### 4. WordSearch
Hitta ord i bokstavsrutnät.
- Props: words[], gridSize, onWordFound, onComplete
- Touch-vänligt för att markera ord
- Lista med ord att hitta
- Stryker över hittade ord

### 5. DragDropMatch
Dra objekt till rätt kategori.
- Props: items[], zones[], onComplete
- Touch-vänligt drag & drop
- Visuell feedback vid rätt/fel placering

### 6. Timer
Nedräkningstimer.
- Props: seconds, onComplete, showWarning?
- Cirkulär progress-indikator
- Byter färg: grön → gul → röd
- Visar tid i mitten

### 7. ProgressBar
Visar framsteg i övningar.
- Props: current, total, showLabel?, color?
- Animerad progress
- Visar "3 av 10" text

### 8. AnswerButton
Touch-optimerad svarsknapp.
- Props: children, state (default/correct/incorrect/selected), onClick
- Minst 48px höjd
- Tydliga färger för states

### 9. SuccessAnimation
Firande vid rätt svar.
- Props: type (confetti/stars/fireworks), duration?, onComplete?
- Animerade partiklar
- Auto-döljs efter duration

### 10. ScoreDisplay
Visar poäng.
- Props: score, maxScore?, showPercentage?
- Animerad vid poängökning
- Stjärn-ikon

### 11. RewardBadge
Belöningsmärke.
- Props: type (bronze/silver/gold/platinum), label, unlocked
- Gråtonad om ej upplåst
- Shine-effekt på upplåsta

### 12. StreakCounter
Rätt svar i rad.
- Props: count, milestone?
- Eldflamma-emoji vid streak
- Firar vid milstolpar (3, 5, 10)

### 13. GameContainer
Wrapper för spelinnehåll.
- Centrerad, max-width
- Responsiv padding
- Bakgrundsfärg

### 14. ChildFriendlyNav
Navigation för barn.
- Props: title, showBack?, rightContent?
- Stor tillbaka-knapp
- Plats för poäng/score

### 15. BackButton
Tillbaka-knapp.
- Stor, tydlig
- Touch-vänlig

## CUSTOM HOOKS

### useScore
Hantera poäng med localStorage.
- addPoints(n), subtractPoints(n), resetScore()
- Returnerar: score, highScore, isNewHighScore

### useTimer
Nedräkningstimer.
- start(), pause(), reset()
- Returnerar: timeLeft, isRunning, isComplete

### useLocalStorage
Generell localStorage-hook.
- get/set med JSON-hantering
- Fallback-värde

## EXEMPELDATA

### mathQuestions.ts
5-10 mattetal för årskurs 1-3.
Exempel: { question: "5 + 3 = ?", options: ["6", "7", "8", "9"], correctIndex: 2 }

### swedishWords.ts
5-10 svenska glosor.
Exempel: { front: "Katt", back: "Cat" }

### gameData.ts
- memoryPairs: [{ id: "1", content: "🍎" }, ...]
- wordSearchWords: ["KAT", "HUND", "BIL"]
- dragDropItems & zones för matchning

## DEMO-SIDA

Skapa en demo-sida med flikar som visar varje komponent:
1. Quiz - Interaktiv quiz med progress
2. Glosor - Flashcards att vända
3. Memory - Fullständigt memory-spel
4. Ordjakt - WordSearch-spel
5. Matcha - Drag & drop
6. Komponenter - Övriga komponenter

Varje flik ska vara interaktiv och visa komponenten i aktion.

## RESPONSIV DESIGN

- Tablet-first approach (primary target)
- Mobile: 1 kolumn, stackad layout
- Tablet: 2 kolumner där lämpligt
- Desktop: Max-width container, centrerad

## TILLGÄNGLIGHET

- Tydliga färgkontraster
- Stora klickytor
- Keyboard-navigation där möjligt
- Aria-labels på interaktiva element

---

Börja med att skapa mappstrukturen och de grundläggande komponenterna. Fokusera på att göra dem återanvändbara och konfiguerbara via props.`;

const platformInstructions = [
  {
    name: "Lovable",
    icon: "💜",
    instruction: "Klistra in prompten direkt i chatten"
  },
  {
    name: "Base44",
    icon: "🔵",
    instruction: "Lägg först i Custom Instructions, sedan i chatten"
  },
  {
    name: "Bolt.new",
    icon: "⚡",
    instruction: "Klistra som första prompt i nytt projekt"
  },
  {
    name: "Cursor",
    icon: "🖱️",
    instruction: "Lägg i .cursorrules eller Composer"
  }
];

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

export function SkolpromptenTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [superPromptCopied, setSuperPromptCopied] = useState(false);

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

  const copySuperPrompt = async () => {
    try {
      await navigator.clipboard.writeText(superPrompt);
      setSuperPromptCopied(true);
      toast.success("Super-prompt kopierad! Klistra in i valfri AI-plattform.");
      setTimeout(() => setSuperPromptCopied(false), 3000);
    } catch {
      toast.error("Kunde inte kopiera");
    }
  };

  return (
    <div className="space-y-8 pt-6">
      {/* Super-prompt Section */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold">
                Skapa din egen startmall
              </h2>
              <p className="text-sm text-muted-foreground">
                Kopiera super-prompten och klistra in i valfri AI-plattform
              </p>
            </div>
          </div>

          <Button 
            size="lg" 
            className="w-full gap-2 h-14 text-lg"
            onClick={copySuperPrompt}
          >
            {superPromptCopied ? (
              <>
                <Check className="w-5 h-5" />
                Kopierad!
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Kopiera super-prompt
              </>
            )}
          </Button>

          {/* Platform Instructions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            {platformInstructions.map((platform) => (
              <div 
                key={platform.name}
                className="flex items-center gap-2 p-2 rounded-lg bg-background/50 text-xs"
              >
                <span className="text-lg">{platform.icon}</span>
                <div>
                  <div className="font-medium">{platform.name}</div>
                  <div className="text-muted-foreground">{platform.instruction}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Prompts Header */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-heading font-semibold text-foreground">
          Enskilda komponenter
        </h3>
        <p className="text-sm text-muted-foreground">
          Eller kopiera prompts för specifika komponenter
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
          <Link to="/resurser/learn/skolprompten-pedagogiska-komponenter">
            Alla prompts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-2">
          <a 
            href="https://lovable.dev/invite/YLXOX36" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Prova Lovable
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}
