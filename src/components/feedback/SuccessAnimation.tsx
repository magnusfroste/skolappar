import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SuccessAnimationProps {
  type?: "confetti" | "stars" | "fireworks";
  duration?: number;
  onComplete?: () => void;
}

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  size: Math.random() * 8 + 4,
}));

export function SuccessAnimation({
  type = "confetti",
  duration = 1500,
  onComplete,
}: SuccessAnimationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  if (!visible) return null;

  const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#95E1D3", "#F38181", "#AA96DA"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {type === "confetti" && (
        <>
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute animate-confetti"
              style={{
                left: `${p.x}%`,
                top: "-20px",
                width: p.size,
                height: p.size,
                backgroundColor: colors[p.id % colors.length],
                borderRadius: p.id % 2 === 0 ? "50%" : "2px",
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </>
      )}

      {type === "stars" && (
        <>
          {particles.slice(0, 10).map((p) => (
            <div
              key={p.id}
              className="absolute text-4xl animate-star"
              style={{
                left: `${p.x}%`,
                top: `${30 + Math.random() * 40}%`,
                animationDelay: `${p.delay}s`,
              }}
            >
              ⭐
            </div>
          ))}
        </>
      )}

      {type === "fireworks" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl animate-bounce">🎆</div>
        </div>
      )}

      <style>{`
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes star {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .animate-confetti { animation: confetti 1.5s ease-out forwards; }
        .animate-star { animation: star 1s ease-out forwards; }
      `}</style>
    </div>
  );
}
