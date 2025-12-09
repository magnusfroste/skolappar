import { useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  resourceLink?: string;
}

const checklistItems: ChecklistItem[] = [
  {
    id: "touch",
    title: "Touch-vänlighet",
    description: "Är alla knappar och interaktiva element minst 48×48 pixlar?",
    resourceLink: "/resurser/responsiv-design-pedagogiska-appar",
  },
  {
    id: "responsive",
    title: "Responsiv layout",
    description: "Ser appen bra ut på mobil, platta och desktop?",
    resourceLink: "/resurser/responsiv-design-pedagogiska-appar",
  },
  {
    id: "no-hover",
    title: "Fungerar utan hover",
    description: "Fungerar alla funktioner utan att hovra med musen?",
    resourceLink: "/resurser/responsiv-design-pedagogiska-appar",
  },
  {
    id: "readable",
    title: "Läsbar text",
    description: "Är texten tillräckligt stor för barn att läsa? (minst 16px)",
  },
  {
    id: "child-friendly",
    title: "Barnanpassat språk",
    description: "Är språket enkelt, tydligt och lämpligt för målgruppen?",
  },
  {
    id: "fast-loading",
    title: "Snabb laddning",
    description: "Laddar appen inom några sekunder?",
  },
  {
    id: "creator-visible",
    title: "Skapare synlig",
    description: "Syns du som skapare tydligt i appen?",
  },
];

interface AppChecklistProps {
  onScoreChange: (score: number, total: number) => void;
}

export function AppChecklist({ onScoreChange }: AppChecklistProps) {
  const [checked, setChecked] = useState<Record<string, boolean | null>>({});

  const handleCheck = (id: string, value: boolean) => {
    const newChecked = { ...checked, [id]: value };
    setChecked(newChecked);
    
    const score = Object.values(newChecked).filter((v) => v === true).length;
    onScoreChange(score, checklistItems.length);
  };

  return (
    <div className="space-y-3">
      {checklistItems.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-4 p-4 rounded-xl border-2 transition-all",
            checked[item.id] === true && "border-green-500/50 bg-green-500/5",
            checked[item.id] === false && "border-red-500/50 bg-red-500/5",
            checked[item.id] === undefined && "border-border bg-card"
          )}
        >
          <div className="flex gap-2 pt-0.5">
            <button
              onClick={() => handleCheck(item.id, true)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                checked[item.id] === true
                  ? "bg-green-500 text-white"
                  : "bg-muted hover:bg-green-500/20 text-muted-foreground"
              )}
              aria-label="Ja"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleCheck(item.id, false)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                checked[item.id] === false
                  ? "bg-red-500 text-white"
                  : "bg-muted hover:bg-red-500/20 text-muted-foreground"
              )}
              aria-label="Nej"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{item.title}</h4>
            <p className="text-sm text-muted-foreground">{item.description}</p>
            {item.resourceLink && checked[item.id] === false && (
              <Link
                to={item.resourceLink}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
              >
                Läs mer om hur du fixar detta
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
