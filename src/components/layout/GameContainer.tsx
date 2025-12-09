import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GameContainerProps {
  children: ReactNode;
  className?: string;
  fullHeight?: boolean;
}

export function GameContainer({
  children,
  className,
  fullHeight = true,
}: GameContainerProps) {
  return (
    <div
      className={cn(
        "w-full max-w-2xl mx-auto px-4 py-6",
        fullHeight && "min-h-screen flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}
