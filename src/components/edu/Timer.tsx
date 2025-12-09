import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

interface TimerProps {
  initialTime: number;
  countDown?: boolean;
  onComplete?: () => void;
  autoStart?: boolean;
  className?: string;
}

export function Timer({
  initialTime,
  countDown = true,
  onComplete,
  autoStart = true,
  className,
}: TimerProps) {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTime((prev) => {
        const next = countDown ? prev - 1 : prev + 1;
        
        if (countDown && next <= 0) {
          clearInterval(interval);
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, countDown, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = countDown && time <= 10;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-bold",
        isLowTime 
          ? "bg-destructive/10 text-destructive animate-pulse" 
          : "bg-muted text-foreground",
        className
      )}
    >
      <Clock className="w-5 h-5" />
      {formatTime(time)}
    </div>
  );
}
