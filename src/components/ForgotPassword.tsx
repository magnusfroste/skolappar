import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function ForgotPassword({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(email);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(address.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (sendError) {
        setError(sendError.status === 429 ? 'För många försök. Vänta en stund och försök igen.' : 'Mejlet kunde inte skickas. Försök igen om en stund.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Kontrollera din internetanslutning och försök igen.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Button type="button" variant="link" className="min-h-12 px-0" onClick={() => {
      setAddress(email); setSent(false); setError(''); setOpen(true);
    }}>Glömt lösenord?</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>Återställ lösenord</DialogTitle></DialogHeader>
        {sent ? <div role="status" className="space-y-4">
          <p>Om adressen har ett konto får du ett mejl med en återställningslänk. Kontrollera även skräpposten.</p>
          <Button className="min-h-12" onClick={() => setOpen(false)}>Stäng</Button>
        </div> : <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="recovery-email">E-postadress</Label>
            <Input id="recovery-email" type="email" autoComplete="email" value={address} onChange={e => setAddress(e.target.value)} required className="min-h-12" />
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full min-h-12">{busy ? 'Skickar…' : 'Skicka återställningslänk'}</Button>
        </form>}
      </DialogContent>
    </Dialog>
  </>;
}