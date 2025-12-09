import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface AnswerButtonProps {
  children: ReactNode;
  state?: "default" | "selected" | "correct" | "incorrect";
  disabled?: boolean;
  onClick: () => void;
}

export function AnswerButton({
  children,
  state = "default",
  disabled = false,
  onClick,
}: AnswerButtonProps) {
  const stateStyles = {
    default: "bg-card border-border hover:border-primary hover:bg-primary/5",
    selected: "bg-primary/10 border-primary",
    correct: "bg-success/20 border-success text-success",
    incorrect: "bg-destructive/20 border-destructive text-destructive",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full min-h-[48px] px-6 py-4 rounded-xl border-2 font-body font-semibold text-lg",
        "transition-all duration-200 flex items-center justify-between gap-3",
        "active:scale-[0.98] touch-manipulation",
        stateStyles[state],
        disabled && state === "default" && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="flex-1 text-left">{children}</span>
      {state === "correct" && <Check className="w-6 h-6 text-success shrink-0" />}
      {state === "incorrect" && <X className="w-6 h-6 text-destructive shrink-0" />}
    </button>
  );
}
