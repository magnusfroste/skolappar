import { useEffect, useRef, useState } from "react";
import { Kotten } from "@/components/Kotten";

export type KottenCorner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

interface AppPlayerProps {
  url: string;
  title: string;
  onClose: () => void;
  /** The corner the app asked for (<meta name="skolappar:kotten">, read by the check); default top-left. */
  kotten?: KottenCorner | null;
}

// Where Kotten sits: a side and how far down (0 = top, 1 = bottom). Top left by default – out of the
// thumbs' reach in games held with both hands; an app can ask for another corner, and where the child
// drags Kotten is kept on the device for that app.
type Spot = { side: "left" | "right"; y: number };
const MOVE = 8; // px: a press that moves further than this is a drag, never a "go home"
const keyFor = (url: string) => { try { return `skolappar-kotten:${new URL(url).host}`; } catch { return "skolappar-kotten"; } };

function cornerSpot(corner?: KottenCorner | null): Spot {
  const c = corner || "top-left";
  return { side: c.endsWith("right") ? "right" : "left", y: c.startsWith("bottom") ? 1 : 0 };
}

function readSpot(url: string, corner?: KottenCorner | null): Spot {
  try {
    const s = JSON.parse(localStorage.getItem(keyFor(url)) || "null");
    if (s && (s.side === "left" || s.side === "right") && typeof s.y === "number") return { side: s.side, y: Math.min(1, Math.max(0, s.y)) };
  } catch { /* the app's corner */ }
  return cornerSpot(corner);
}

/**
 * Visar en extern app i helskärm inne på Skolappar. Appen får hela skärmen; hem kommer man med
 * Kotten, en flytande knapp (som iPhones gamla hemknapp) innanför skärmens säkra kanter (kamera,
 * notch, hemlinje). Uppe till vänster om appen inte bett om ett annat hörn. Tryck = hem. Dra =
 * flytta Kotten längs kanten om den ligger i vägen (sparas för appen på enheten). Ingen "ny flik" –
 * ett barn på en iPad ska inte öppna fyrtio flikar.
 */
export function AppPlayer({ url, title, onClose, kotten }: AppPlayerProps) {
  const stage = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<Spot>(() => readSpot(url, kotten));
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const press = useRef<{ x: number; y: number; moved: boolean } | null>(null);

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

  const SIZE = 56, EDGE = 12;
  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = { x: e.clientX, y: e.clientY, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    if (!p) return;
    if (!p.moved && Math.hypot(e.clientX - p.x, e.clientY - p.y) < MOVE) return;
    p.moved = true;
    const box = stage.current?.getBoundingClientRect();
    if (box) setDrag({ x: e.clientX - box.left - SIZE / 2, y: e.clientY - box.top - SIZE / 2 });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (!p.moved) { onClose(); return; }
    const box = stage.current?.getBoundingClientRect();
    if (box) {
      const next: Spot = {
        side: e.clientX - box.left < box.width / 2 ? "left" : "right",
        y: Math.min(1, Math.max(0, (e.clientY - box.top - EDGE - SIZE / 2) / Math.max(1, box.height - 2 * EDGE - SIZE))),
      };
      setSpot(next);
      try { localStorage.setItem(keyFor(url), JSON.stringify(next)); } catch { /* only for this time */ }
    }
    setDrag(null);
  };

  const place: React.CSSProperties = drag
    ? { left: drag.x, top: drag.y, transition: "none" }
    : { [spot.side]: EDGE, top: `calc(${EDGE}px + (100% - ${2 * EDGE + SIZE}px) * ${spot.y})` };

  return (
    <div
      className="fixed inset-0 z-[100] bg-background"
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
      <div ref={stage} className="relative h-full w-full">
        <iframe
          src={url}
          title={title}
          className="absolute inset-0 h-full w-full border-0 bg-background"
          allow="autoplay; fullscreen; clipboard-write; microphone; camera"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-pointer-lock"
        />
        <button
          type="button"
          aria-label="Hem till Skolappar"
          title="Hem till Skolappar – dra för att flytta"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => { press.current = null; setDrag(null); }}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClose())}
          style={{ width: SIZE, height: SIZE, touchAction: "none", ...place }}
          className={`absolute z-10 flex items-center justify-center rounded-full border-2 border-white bg-primary shadow-lg transition-[top,left,right,opacity] duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${drag ? "opacity-100 scale-110" : "opacity-70 hover:opacity-100 active:opacity-100"}`}
        >
          <Kotten mood="hej" attribute={false} className="h-10 w-10 pointer-events-none" title="" />
        </button>
      </div>
    </div>
  );
}
