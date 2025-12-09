import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface WordSearchProps {
  words: string[];
  gridSize?: number;
  onWordFound?: (word: string) => void;
  onComplete?: () => void;
  className?: string;
}

type Direction = [number, number];

const DIRECTIONS: Direction[] = [
  [0, 1],   // right
  [1, 0],   // down
  [1, 1],   // diagonal down-right
  [-1, 1],  // diagonal up-right
];

export function WordSearch({ 
  words, 
  gridSize = 10, 
  onWordFound, 
  onComplete,
  className 
}: WordSearchProps) {
  const [grid, setGrid] = useState<string[][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);

  const generateGrid = useCallback(() => {
    const newGrid: string[][] = Array(gridSize).fill(null).map(() => 
      Array(gridSize).fill("")
    );
    
    const placedWords: string[] = [];

    // Place words
    for (const word of words) {
      const upperWord = word.toUpperCase();
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const dir = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startRow = Math.floor(Math.random() * gridSize);
        const startCol = Math.floor(Math.random() * gridSize);

        if (canPlaceWord(newGrid, upperWord, startRow, startCol, dir, gridSize)) {
          placeWord(newGrid, upperWord, startRow, startCol, dir);
          placedWords.push(word);
          placed = true;
        }
        attempts++;
      }
    }

    // Fill empty cells with random letters
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        if (!newGrid[i][j]) {
          newGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    setGrid(newGrid);
    setFoundWords([]);
    setFoundCells(new Set());
  }, [words, gridSize]);

  useEffect(() => {
    generateGrid();
  }, [generateGrid]);

  const canPlaceWord = (
    grid: string[][], 
    word: string, 
    row: number, 
    col: number, 
    dir: Direction,
    size: number
  ): boolean => {
    const endRow = row + dir[0] * (word.length - 1);
    const endCol = col + dir[1] * (word.length - 1);

    if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
      return false;
    }

    for (let i = 0; i < word.length; i++) {
      const r = row + dir[0] * i;
      const c = col + dir[1] * i;
      if (grid[r][c] && grid[r][c] !== word[i]) {
        return false;
      }
    }

    return true;
  };

  const placeWord = (
    grid: string[][], 
    word: string, 
    row: number, 
    col: number, 
    dir: Direction
  ) => {
    for (let i = 0; i < word.length; i++) {
      grid[row + dir[0] * i][col + dir[1] * i] = word[i];
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!isSelecting) {
      setIsSelecting(true);
      setSelectedCells([[row, col]]);
    } else {
      const newSelected = [...selectedCells, [row, col]] as [number, number][];
      setSelectedCells(newSelected);

      // Check if selection forms a word
      const selectedWord = newSelected.map(([r, c]) => grid[r][c]).join("");
      const reversedWord = selectedWord.split("").reverse().join("");

      const matchedWord = words.find(w => 
        w.toUpperCase() === selectedWord || w.toUpperCase() === reversedWord
      );

      if (matchedWord && !foundWords.includes(matchedWord)) {
        setFoundWords(prev => [...prev, matchedWord]);
        setFoundCells(prev => {
          const newSet = new Set(prev);
          newSelected.forEach(([r, c]) => newSet.add(`${r}-${c}`));
          return newSet;
        });
        onWordFound?.(matchedWord);

        if (foundWords.length + 1 === words.length) {
          onComplete?.();
        }
      }

      setIsSelecting(false);
      setSelectedCells([]);
    }
  };

  const isCellSelected = (row: number, col: number) => 
    selectedCells.some(([r, c]) => r === row && c === col);

  const isCellFound = (row: number, col: number) => 
    foundCells.has(`${row}-${col}`);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Word list */}
      <div className="flex flex-wrap gap-2">
        {words.map((word) => (
          <span
            key={word}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium transition-all",
              foundWords.includes(word)
                ? "bg-success/20 text-success line-through"
                : "bg-muted text-foreground"
            )}
          >
            {word}
            {foundWords.includes(word) && <Check className="inline w-4 h-4 ml-1" />}
          </span>
        ))}
      </div>

      {/* Grid */}
      <div 
        className="inline-grid gap-1 p-2 bg-card rounded-xl border"
        style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              className={cn(
                "w-8 h-8 sm:w-10 sm:h-10 rounded-lg font-bold text-sm sm:text-base",
                "flex items-center justify-center transition-all",
                "hover:bg-primary/20 active:scale-95",
                isCellSelected(rowIndex, colIndex) && "bg-primary text-primary-foreground",
                isCellFound(rowIndex, colIndex) && "bg-success/30 text-success"
              )}
            >
              {cell}
            </button>
          ))
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Klicka på första och sista bokstaven i ordet för att markera det.
      </p>

      <Button variant="outline" size="sm" onClick={generateGrid}>
        Nytt pussel
      </Button>
    </div>
  );
}
