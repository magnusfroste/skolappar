import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface MemoryCard {
  id: string;
  content: string;
  matched: boolean;
}

interface MemoryGameProps {
  pairs: { id: string; content: string }[];
  onComplete?: (moves: number) => void;
  className?: string;
}

export function MemoryGame({ pairs, onComplete, className }: MemoryGameProps) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    // Create pairs and shuffle
    const shuffled = [...pairs, ...pairs]
      .map((p, i) => ({ ...p, id: `${p.id}-${i}`, originalId: p.id, matched: false }))
      .sort(() => Math.random() - 0.5)
      .map((p, i) => ({ id: `card-${i}`, content: p.content, originalId: p.originalId, matched: false }));
    
    setCards(shuffled as any);
  }, [pairs]);

  const handleFlip = (id: string) => {
    if (isLocked || flipped.includes(id)) return;
    
    const card = cards.find(c => c.id === id);
    if (card?.matched) return;

    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      setIsLocked(true);

      const [first, second] = newFlipped.map(fid => cards.find(c => c.id === fid));
      
      if (first?.content === second?.content) {
        // Match found
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === first?.id || c.id === second?.id 
              ? { ...c, matched: true } 
              : c
          ));
          setFlipped([]);
          setIsLocked(false);

          // Check completion
          const matchedCount = cards.filter(c => c.matched).length + 2;
          if (matchedCount === cards.length) {
            onComplete?.(moves + 1);
          }
        }, 600);
      } else {
        // No match
        setTimeout(() => {
          setFlipped([]);
          setIsLocked(false);
        }, 1000);
      }
    }
  };

  const isFlipped = (id: string) => flipped.includes(id);
  const isMatched = (id: string) => cards.find(c => c.id === id)?.matched;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <span>Drag: {moves}</span>
        <span>Matchade: {cards.filter(c => c.matched).length / 2} / {pairs.length}</span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            disabled={isLocked || isMatched(card.id)}
            className={cn(
              "aspect-square rounded-xl text-2xl font-bold transition-all duration-300 transform",
              "min-h-[60px] flex items-center justify-center",
              isFlipped(card.id) || isMatched(card.id)
                ? "bg-primary text-primary-foreground rotate-y-0"
                : "bg-muted hover:bg-muted/80 hover:scale-105",
              isMatched(card.id) && "bg-success text-success-foreground scale-95 opacity-80"
            )}
            style={{
              perspective: "1000px",
            }}
          >
            {(isFlipped(card.id) || isMatched(card.id)) ? card.content : "?"}
          </button>
        ))}
      </div>
    </div>
  );
}
