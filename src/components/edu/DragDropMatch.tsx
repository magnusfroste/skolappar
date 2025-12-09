import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface DragDropItem {
  id: string;
  content: string;
}

interface DragDropZone {
  id: string;
  label: string;
  correctItemId: string;
}

interface DragDropMatchProps {
  items: DragDropItem[];
  zones: DragDropZone[];
  onComplete?: (correct: number, total: number) => void;
  className?: string;
}

export function DragDropMatch({ items, zones, onComplete, className }: DragDropMatchProps) {
  const [placements, setPlacements] = useState<Record<string, string | null>>({});
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (zoneId: string) => {
    if (!draggedItem) return;

    // Remove item from previous zone
    const newPlacements = { ...placements };
    Object.keys(newPlacements).forEach(key => {
      if (newPlacements[key] === draggedItem) {
        newPlacements[key] = null;
      }
    });

    // Place in new zone
    newPlacements[zoneId] = draggedItem;
    setPlacements(newPlacements);
    setDraggedItem(null);
    setChecked(false);
  };

  const handleTouchDrop = (zoneId: string, itemId: string) => {
    const newPlacements = { ...placements };
    Object.keys(newPlacements).forEach(key => {
      if (newPlacements[key] === itemId) {
        newPlacements[key] = null;
      }
    });
    newPlacements[zoneId] = itemId;
    setPlacements(newPlacements);
    setChecked(false);
  };

  const handleCheck = () => {
    setChecked(true);
    const correct = zones.filter(z => placements[z.id] === z.correctItemId).length;
    onComplete?.(correct, zones.length);
  };

  const handleReset = () => {
    setPlacements({});
    setChecked(false);
  };

  const getItemInZone = (zoneId: string) => {
    const itemId = placements[zoneId];
    return items.find(i => i.id === itemId);
  };

  const isPlaced = (itemId: string) => {
    return Object.values(placements).includes(itemId);
  };

  const isCorrect = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone && placements[zoneId] === zone.correctItemId;
  };

  const allPlaced = zones.every(z => placements[z.id]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Draggable items */}
      <div className="flex flex-wrap gap-3 justify-center p-4 bg-muted/50 rounded-xl min-h-[60px]">
        {items.filter(item => !isPlaced(item.id)).map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              "px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium",
              "cursor-grab active:cursor-grabbing shadow-md",
              "hover:scale-105 transition-transform touch-manipulation",
              draggedItem === item.id && "opacity-50"
            )}
          >
            {item.content}
          </div>
        ))}
        {items.every(i => isPlaced(i.id)) && (
          <span className="text-muted-foreground text-sm">Alla placerade!</span>
        )}
      </div>

      {/* Drop zones */}
      <div className="grid gap-4 sm:grid-cols-2">
        {zones.map((zone) => {
          const placedItem = getItemInZone(zone.id);
          const correct = checked && isCorrect(zone.id);
          const incorrect = checked && placedItem && !isCorrect(zone.id);

          return (
            <div
              key={zone.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(zone.id)}
              className={cn(
                "p-4 rounded-xl border-2 border-dashed min-h-[80px]",
                "flex flex-col items-center justify-center gap-2 transition-all",
                !placedItem && "border-muted-foreground/30 bg-muted/30",
                placedItem && !checked && "border-primary bg-primary/5",
                correct && "border-success bg-success/10",
                incorrect && "border-destructive bg-destructive/10"
              )}
            >
              <span className="text-sm font-medium text-muted-foreground">
                {zone.label}
              </span>
              
              {placedItem && (
                <div className="flex items-center gap-2">
                  <span
                    onClick={() => {
                      if (!checked) {
                        setPlacements(prev => ({ ...prev, [zone.id]: null }));
                      }
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg font-medium cursor-pointer",
                      !checked && "bg-primary text-primary-foreground hover:bg-primary/80",
                      correct && "bg-success text-success-foreground",
                      incorrect && "bg-destructive text-destructive-foreground"
                    )}
                  >
                    {placedItem.content}
                  </span>
                  {correct && <Check className="w-5 h-5 text-success" />}
                  {incorrect && <X className="w-5 h-5 text-destructive" />}
                </div>
              )}

              {/* Touch-friendly: show available items to place */}
              {!placedItem && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {items.filter(i => !isPlaced(i.id)).slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleTouchDrop(zone.id, item.id)}
                      className="text-xs px-2 py-1 bg-muted rounded hover:bg-primary/20"
                    >
                      {item.content}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={handleCheck}
          disabled={!allPlaced || checked}
          className={cn(
            "px-6 py-2 rounded-lg font-medium transition-all",
            allPlaced && !checked
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Kontrollera
        </button>
        <button
          onClick={handleReset}
          className="px-6 py-2 rounded-lg font-medium bg-muted hover:bg-muted/80 transition-all"
        >
          Börja om
        </button>
      </div>
    </div>
  );
}
