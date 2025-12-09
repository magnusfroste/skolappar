import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreDisplay({
  score,
  maxScore,
  showPercentage = false,
  size = "md",
  className,
}: ScoreDisplayProps) {
  const percentage = maxScore ? Math.round((score / maxScore) * 100) : null;

  const sizeStyles = {
    sm: "text-lg px-3 py-1.5",
    md: "text-2xl px-4 py-2",
    lg: "text-4xl px-6 py-3",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-accent/20 text-accent-foreground font-heading font-bold",
        sizeStyles[size],
        className
      )}
    >
      <Trophy className={cn(iconSizes[size], "text-accent")} />
      <span>
        {score}
        {maxScore && <span className="text-muted-foreground">/{maxScore}</span>}
        {showPercentage && percentage !== null && (
          <span className="text-muted-foreground ml-2">({percentage}%)</span>
        )}
      </span>
    </div>
  );
}
