import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { PublicNav } from '@/components/PublicNav';
import { PublicFooter } from '@/components/PublicFooter';
import { SEO } from '@/components/SEO';
import { useCreateIdea } from '@/hooks/useIdeas';
import { ApiError } from '@/lib/api';

const AGE_OPTIONS = ['Förskola', 'Lågstadiet', 'Mellanstadiet', 'Högstadiet', 'Gymnasiet'];
const SUBJECT_OPTIONS = ['Matte', 'Svenska', 'Engelska', 'NO', 'SO', 'Musik', 'Bild', 'Idrott', 'Annat'];

export default function NewIdea() {
  const navigate = useNavigate();
  const createIdea = useCreateIdea();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAge, setTargetAge] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot

  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const valid = title.trim().length >= 2 && description.trim().length >= 5 && emailOk;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) {
      toast.error('Fyll i titel och beskrivning (och en giltig e-postadress om du anger en)');
      return;
    }
    try {
      const res = await createIdea.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        target_age: targetAge || undefined,
        target_subject: targetSubject || undefined,
        email: email.trim() || undefined,
        website: website || undefined,
      });
      toast.success('Din idé har publicerats!');
      navigate(res.id ? `/ideer/${res.id}` : '/ideer');
    } catch (err) {
      toast.error(err instanceof ApiError && err.status === 429
        ? 'Du har skickat många idéer på kort tid. Vänta en stund och försök igen.'
        : 'Kunde inte skapa idén');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <SEO title="Föreslå en app" description="Beskriv vilken app du önskar dig – kanske bygger någon den." url="/ideer/ny" />
      <PublicNav variant="solid" />
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Föreslå en app</h1>
            </div>
            <CardDescription>
              Beskriv vilken app du önskar dig. Föräldrar som bygger appar kan ta sig an din idé.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Vad behöver ditt barn? *</Label>
                <Input id="title" placeholder="T.ex. Multiplikationstabellen som ett spel" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beskriv idén *</Label>
                <Textarea
                  id="description"
                  placeholder="Varför behövs appen? Vilket problem löser den? Hur skulle den fungera?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[150px]"
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Målgrupp (årskurs)</Label>
                  <Select value={targetAge} onValueChange={setTargetAge}>
                    <SelectTrigger><SelectValue placeholder="Välj årskurs" /></SelectTrigger>
                    <SelectContent>
                      {AGE_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ämne</Label>
                  <Select value={targetSubject} onValueChange={setTargetSubject}>
                    <SelectTrigger><SelectValue placeholder="Välj ämne" /></SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((opt) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Din e-postadress (valfritt)</Label>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} />
                <p className="text-xs text-muted-foreground">Visas inte på sajten. Ange den om du vill att vi hör av oss när idén blir en app.</p>
              </div>

              <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label htmlFor="website">Webbplats</label>
                <input id="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/ideer')}>Avbryt</Button>
                <Button type="submit" disabled={createIdea.isPending || !valid} className="gap-2">
                  <Send className="h-4 w-4" />
                  Publicera idé
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      <PublicFooter />
    </div>
  );
}
