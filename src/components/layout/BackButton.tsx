import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export function BackButton({
  to,
  label = "Tillbaka",
  className,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button
      variant="ghost"
      size="lg"
      onClick={handleClick}
      className={cn(
        "gap-2 text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <ArrowLeft className="w-5 h-5" />
      {label}
    </Button>
  );
}
