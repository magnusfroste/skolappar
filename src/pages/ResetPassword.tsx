import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ResetPassword() {
  const { user, loading, recoveryMode, signOut } = useAuth();
  const [hashRecovery] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('type') === 'recovery');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const canRecover = Boolean(user && (recoveryMode || hashRecovery));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canRecover) return;
    if (password !== confirmation) { setError('Lösenorden stämmer inte överens.'); return; }
    setBusy(true); setError('');
    try {
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user) { setError('Länken har gått ut. Begär en ny återställningslänk.'); return; }
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError('Lösenordet kunde inte sparas. Välj ett längre, unikt lösenord eller begär en ny länk.');
        return;
      }
      setSaved(true);
      await signOut();
    } catch { setError('Kontrollera din internetanslutning och försök igen.'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-gradient-hero flex items-center justify-center px-4 py-8">
    <Card className="w-full max-w-md shadow-playful-lg">
      <CardHeader><CardTitle className="font-heading">Nytt lösenord</CardTitle></CardHeader>
      <CardContent>
        {loading ? <p role="status">Kontrollerar länken…</p> : saved ? <div className="space-y-4">
          <p role="status">Ditt lösenord är uppdaterat.</p>
          <Button asChild className="min-h-12 w-full"><Link to="/auth">Logga in</Link></Button>
        </div> : !canRecover ? <div className="space-y-4">
          <p role="alert">Återställningslänken saknas eller har gått ut. Begär en ny länk via ”Glömt lösenord”.</p>
          <Button asChild className="min-h-12 w-full"><Link to="/auth">Till inloggningen</Link></Button>
        </div> : <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="new-password">Nytt lösenord</Label>
            <Input id="new-password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="min-h-12" />
          </div>
          <div className="space-y-2"><Label htmlFor="confirm-password">Bekräfta lösenordet</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={e => setConfirmation(e.target.value)} className="min-h-12" />
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="min-h-12 w-full">{busy ? 'Sparar…' : 'Spara nytt lösenord'}</Button>
        </form>}
      </CardContent>
    </Card>
  </main>;
}