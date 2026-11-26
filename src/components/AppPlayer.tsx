import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Kotten } from "@/components/Kotten";

interface AppPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
}

/**
 * Visar en extern app i helskärm inne på Skolappar. Appen får nästan hela skärmen: överst bara en
 * tunn strimma i Skolappars färg, och från den hänger en liten flik uppe till vänster (pil + Kotten)
 * som leder tillbaka. Ingen "ny flik"-knapp – ett barn på en iPad ska inte öppna fyrtio flikar.
 * Guiden ber apparna lämna det hörnet fritt (avsnittet touch).
 */
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
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="h-1.5 shrink-0 bg-primary" aria-hidden="true" />
      <div className="relative flex-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tillbaka till Skolappar"
          title="Tillbaka till Skolappar"
          className="absolute left-3 top-0 z-10 flex h-11 items-center gap-0.5 rounded-b-2xl bg-primary pl-1.5 pr-2 pb-0.5 text-primary-foreground shadow-md transition-[padding] hover:pb-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={3} aria-hidden="true" />
          <Kotten mood="hej" attribute={false} className="h-7 w-7" title="" />
        </button>
        <iframe
          src={url}
          title={title}
          className="absolute inset-0 h-full w-full border-0 bg-background"
          allow="autoplay; fullscreen; clipboard-write; microphone; camera"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
        />
      </div>
    </div>
  );
}
