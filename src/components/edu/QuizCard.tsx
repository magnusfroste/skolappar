import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AnswerButton } from "./AnswerButton";

interface QuizCardProps {
  question: string;
  options: string[];
  correctIndex: number;
  onAnswer: (correct: boolean) => void;
  difficulty?: "easy" | "medium" | "hard";
  image?: string;
}

export function QuizCard({
  question,
  options,
  correctIndex,
  onAnswer,
  difficulty = "medium",
  image,
}: QuizCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const handleSelect = (index: number) => {
    if (answered) return;
    
    setSelectedIndex(index);
    setAnswered(true);
    
    const isCorrect = index === correctIndex;
    
    setTimeout(() => {
      onAnswer(isCorrect);
      setSelectedIndex(null);
      setAnswered(false);
    }, 1200);
  };

  const getButtonState = (index: number) => {
    if (!answered) return selectedIndex === index ? "selected" : "default";
    if (index === correctIndex) return "correct";
    if (index === selectedIndex) return "incorrect";
    return "default";
  };

  const difficultyColors = {
    easy: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    hard: "bg-destructive/10 text-destructive",
  };

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden animate-fade-in">
      <CardContent className="p-6 space-y-6">
        {difficulty && (
          <span className={cn("text-xs px-2 py-1 rounded-full font-medium", difficultyColors[difficulty])}>
            {difficulty === "easy" ? "Lätt" : difficulty === "medium" ? "Medel" : "Svår"}
          </span>
        )}
        
        {image && (
          <img 
            src={image} 
            alt="Quiz illustration" 
            className="w-full h-40 object-cover rounded-lg"
          />
        )}
        
        <h2 className="text-xl font-heading font-bold text-foreground text-center">
          {question}
        </h2>
        
        <div className="grid gap-3">
          {options.map((option, index) => (
            <AnswerButton
              key={index}
              state={getButtonState(index)}
              onClick={() => handleSelect(index)}
              disabled={answered}
            >
              {option}
            </AnswerButton>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
