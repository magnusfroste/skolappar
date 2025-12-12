import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useMyApps } from '@/hooks/useMyApps';
import { useMarkIdeaAsBuilt } from '@/hooks/useIdeas';
import { useAuth } from '@/hooks/useAuth';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface MarkIdeaAsBuiltButtonProps {
  ideaId: string;
  status: 'open' | 'claimed' | 'built';
  claimedBy: string | null;
}

export function MarkIdeaAsBuiltButton({
  ideaId,
  status,
  claimedBy,
}: MarkIdeaAsBuiltButtonProps) {
  const { user } = useAuth();
  const { data: myApps, isLoading: isLoadingApps } = useMyApps();
  const markAsBuilt = useMarkIdeaAsBuilt();
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [open, setOpen] = useState(false);

  // Only show for the user who claimed the idea and when status is 'claimed'
  if (status !== 'claimed' || !user || claimedBy !== user.id) {
    return null;
  }

  const approvedApps = myApps?.filter(
    (app) => app.status === 'approved' || app.status === 'featured'
  );

  const handleMarkAsBuilt = () => {
    if (!selectedAppId) {
      toast.error('Välj en app att länka till');
      return;
    }

    markAsBuilt.mutate(
      { ideaId, appId: selectedAppId },
      {
        onSuccess: () => {
          toast.success('Idén har markerats som byggd!');
          setOpen(false);
        },
        onError: () => {
          toast.error('Kunde inte markera idén som byggd');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <CheckCircle className="h-4 w-4" />
          Markera som byggd
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Markera idén som byggd</DialogTitle>
          <DialogDescription>
            Välj vilken av dina godkända appar som byggdes från denna idé. 
            Idéskaparen kommer att få en notifikation.
          </DialogDescription>
        </DialogHeader>

        {isLoadingApps ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !approvedApps?.length ? (
          <div className="py-4 text-center text-muted-foreground">
            <p>Du har inga godkända appar ännu.</p>
            <p className="text-sm mt-2">
              Lägg till din app först och vänta på godkännande.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger>
                <SelectValue placeholder="Välj app..." />
              </SelectTrigger>
              <SelectContent>
                {approvedApps.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Avbryt
              </Button>
              <Button
                onClick={handleMarkAsBuilt}
                disabled={!selectedAppId || markAsBuilt.isPending}
              >
                {markAsBuilt.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Bekräfta
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
