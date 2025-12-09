import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RotateCcw } from "lucide-react";

interface FlashCardProps {
  front: React.ReactNode;
  back: React.ReactNode;
  onFlip?: () => void;
  className?: string;
}

export function FlashCard({ front, back, onFlip, className }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    onFlip?.();
  };

  return (
    <div 
      className={cn("perspective-1000 w-full max-w-sm mx-auto cursor-pointer", className)}
      onClick={handleFlip}
    >
      <div
        className={cn(
          "relative w-full h-64 transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        {/* Front */}
        <Card
          className="absolute inset-0 backface-hidden flex items-center justify-center p-6 bg-gradient-to-br from-primary/10 to-secondary/10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="text-center">
            <div className="text-2xl font-heading font-bold text-foreground mb-4">
              {front}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <RotateCcw className="w-4 h-4" />
              Tryck för att vända
            </div>
          </div>
        </Card>

        {/* Back */}
        <Card
          className="absolute inset-0 backface-hidden flex items-center justify-center p-6 bg-gradient-to-br from-secondary/10 to-accent/10"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="text-center">
            <div className="text-2xl font-heading font-bold text-foreground">
              {back}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
