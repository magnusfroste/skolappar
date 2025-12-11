import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Hammer, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useClaimIdea, useUnclaimIdea } from '@/hooks/useIdeas';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ClaimIdeaButtonProps {
  ideaId: string;
  status: 'open' | 'claimed' | 'built';
  claimedBy: string | null;
}

export function ClaimIdeaButton({ ideaId, status, claimedBy }: ClaimIdeaButtonProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const claimIdea = useClaimIdea();
  const unclaimIdea = useUnclaimIdea();
  const [open, setOpen] = useState(false);

  const isOwner = user?.id === claimedBy;
  const canClaim = status === 'open' && user;
  const canUnclaim = status === 'claimed' && isOwner;

  const handleClaim = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      await claimIdea.mutateAsync(ideaId);
      toast.success('Du har tagit på dig att bygga denna app!');
      setOpen(false);
    } catch (error) {
      toast.error('Något gick fel');
    }
  };

  const handleUnclaim = async () => {
    try {
      await unclaimIdea.mutateAsync(ideaId);
      toast.success('Du har släppt denna idé');
    } catch (error) {
      toast.error('Något gick fel');
    }
  };

  if (status === 'built') {
    return null;
  }

  if (canUnclaim) {
    return (
      <Button
        variant="outline"
        onClick={handleUnclaim}
        disabled={unclaimIdea.isPending}
        className="gap-2"
      >
        <X className="h-4 w-4" />
        Släpp idén
      </Button>
    );
  }

  if (!canClaim) {
    return null;
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="gap-2">
          <Hammer className="h-4 w-4" />
          Jag vill bygga denna!
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bygga denna app?</AlertDialogTitle>
          <AlertDialogDescription>
            Genom att klicka "Jag bygger!" säger du att du kommer att försöka
            bygga en app baserad på denna idé. Idéskaparen kommer att få en
            notifikation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClaim}
            disabled={claimIdea.isPending}
          >
            Jag bygger!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
