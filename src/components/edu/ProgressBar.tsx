import { cn } from "@/lib/utils";

interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  color?: "primary" | "secondary" | "success";
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  showLabel = true,
  color = "primary",
  animated = true,
  className,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((current / total) * 100), 100);

  const colorStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    success: "bg-success",
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-muted-foreground">
            {current} av {total}
          </span>
          <span className="text-foreground font-bold">{percentage}%</span>
        </div>
      )}
      
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            colorStyles[color],
            animated && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
