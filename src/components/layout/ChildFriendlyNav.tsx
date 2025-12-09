import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BackButton } from "./BackButton";

interface ChildFriendlyNavProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
  rightContent?: ReactNode;
  className?: string;
}

export function ChildFriendlyNav({
  title,
  showBack = true,
  backTo,
  rightContent,
  className,
}: ChildFriendlyNavProps) {
  return (
    <nav
      className={cn(
        "sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm border-b border-border",
        className
      )}
    >
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBack && <BackButton to={backTo} label="" />}
          {title && (
            <h1 className="text-lg font-heading font-bold text-foreground">
              {title}
            </h1>
          )}
        </div>
        
        {rightContent && (
          <div className="flex items-center gap-2">
            {rightContent}
          </div>
        )}
      </div>
    </nav>
  );
}
