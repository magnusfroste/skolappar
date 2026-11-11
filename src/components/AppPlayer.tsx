import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AppPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

/** Visar en extern app i helskärm inne på Skolappar. */
export function AppPlayer({ url, title, onClose }: AppPlayerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center gap-2 px-2 h-14 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="icon" className="h-12 w-12" onClick={onClose} aria-label="Stäng">
          <X className="w-5 h-5" />
        </Button>
        <span className="flex-1 truncate font-heading font-semibold">{title}</span>
        <Button variant="ghost" size="sm" className="h-12 gap-2" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <span className="hidden sm:inline">Ny flik</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </Button>
      </div>
      <iframe
        src={url}
        title={title}
        className="flex-1 w-full border-0 bg-background"
        allow="autoplay; fullscreen; clipboard-write; microphone; camera"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
      />
    </div>
  );
}
