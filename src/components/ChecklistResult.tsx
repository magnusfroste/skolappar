import { CheckCircle2, AlertTriangle, XCircle, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ChecklistResultProps {
  score: number;
  total: number;
}

export function ChecklistResult({ score, total }: ChecklistResultProps) {
  const percentage = total > 0 ? (score / total) * 100 : 0;
  
  const getStatus = () => {
    if (percentage >= 85) return { 
      label: "Utmärkt!", 
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      icon: CheckCircle2,
      message: "Din app verkar vara väl förberedd för barn på plattor och mobiler."
    };
    if (percentage >= 60) return { 
      label: "Nästan där!", 
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      icon: AlertTriangle,
      message: "Din app är på god väg. Kolla igenom de röda punkterna."
    };
    return { 
      label: "Behöver förbättras", 
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      icon: XCircle,
      message: "Det finns några saker att fixa innan appen är redo."
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  if (total === 0) {
    return (
      <div className="text-center p-6 rounded-xl bg-muted/50 border border-border">
        <p className="text-muted-foreground">
          Gå igenom checklistan ovan för att se hur redo din app är.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("p-6 rounded-xl border-2", status.bgColor, "border-current/20")}>
      <div className="flex items-center gap-4">
        <div className={cn("p-3 rounded-full", status.bgColor)}>
          <StatusIcon className={cn("h-8 w-8", status.color)} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-bold", status.color)}>
              {score}/{total}
            </span>
            <span className={cn("font-medium", status.color)}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {status.message}
          </p>
        </div>
      </div>

      {percentage >= 60 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button asChild className="w-full gap-2">
            <Link to="/min-sida/skapa">
              <Rocket className="h-4 w-4" />
              Min app är redo – skicka in!
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
