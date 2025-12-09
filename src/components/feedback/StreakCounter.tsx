import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

interface StreakCounterProps {
  count: number;
  milestone?: number;
  className?: string;
}

export function StreakCounter({
  count,
  milestone = 5,
  className,
}: StreakCounterProps) {
  const isMilestone = count > 0 && count % milestone === 0;

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-heading font-bold transition-all",
        isMilestone
          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white scale-110 animate-bounce"
          : "bg-orange-100 text-orange-700",
        className
      )}
    >
      <Flame className={cn("w-5 h-5", isMilestone && "animate-pulse")} />
      <span>{count} rätt i rad!</span>
      {isMilestone && <span className="text-xl">🔥</span>}
    </div>
  );
}
