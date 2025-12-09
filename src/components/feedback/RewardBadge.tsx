import { cn } from "@/lib/utils";
import { Award, Lock } from "lucide-react";

interface RewardBadgeProps {
  type: "bronze" | "silver" | "gold" | "platinum";
  label: string;
  unlocked: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RewardBadge({
  type,
  label,
  unlocked,
  size = "md",
  className,
}: RewardBadgeProps) {
  const typeStyles = {
    bronze: "from-amber-600 to-amber-800 text-amber-100",
    silver: "from-gray-300 to-gray-500 text-gray-800",
    gold: "from-yellow-400 to-amber-500 text-yellow-900",
    platinum: "from-indigo-400 to-purple-500 text-white",
  };

  const sizeStyles = {
    sm: "w-16 h-16 text-xs",
    md: "w-24 h-24 text-sm",
    lg: "w-32 h-32 text-base",
  };

  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-full bg-gradient-to-br shadow-lg",
        sizeStyles[size],
        unlocked ? typeStyles[type] : "from-gray-200 to-gray-400 text-gray-500",
        !unlocked && "opacity-50",
        className
      )}
    >
      {unlocked ? (
        <Award className={iconSizes[size]} />
      ) : (
        <Lock className={iconSizes[size]} />
      )}
      <span className="font-heading font-bold mt-1 text-center px-2 leading-tight">
        {label}
      </span>
      
      {unlocked && (
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-current" />
      )}
    </div>
  );
}
