import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCreateIdea } from '@/hooks/useMyIdeas';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';

const AGE_OPTIONS = [
  { value: 'Förskola', label: 'Förskola' },
  { value: 'Lågstadiet', label: 'Lågstadiet' },
  { value: 'Mellanstadiet', label: 'Mellanstadiet' },
  { value: 'Högstadiet', label: 'Högstadiet' },
  { value: 'Gymnasiet', label: 'Gymnasiet' },
];

const SUBJECT_OPTIONS = [
  { value: 'Matte', label: 'Matte' },
  { value: 'Svenska', label: 'Svenska' },
  { value: 'Engelska', label: 'Engelska' },
  { value: 'NO', label: 'NO' },
  { value: 'SO', label: 'SO' },
  { value: 'Musik', label: 'Musik' },
  { value: 'Bild', label: 'Bild' },
  { value: 'Idrott', label: 'Idrott' },
  { value: 'Annat', label: 'Annat' },
];

export default function DashboardCreateIdea() {
  const navigate = useNavigate();
  const createIdea = useCreateIdea();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAge, setTargetAge] = useState('');
  const [targetSubject, setTargetSubject] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      toast.error('Fyll i titel och beskrivning');
      return;
    }

    try {
      await createIdea.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        target_age: targetAge || undefined,
        target_subject: targetSubject || undefined,
      });
      toast.success('Din idé har publicerats!');
      navigate('/min-sida');
    } catch (error) {
      toast.error('Kunde inte skapa idén');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Lightbulb className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle>Föreslå en app</CardTitle>
          </div>
          <CardDescription>
            Beskriv vilken app du önskar dig. Vibe-coders i communityt kan ta
            sig an din idé och bygga den.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Vad behöver ditt barn? *</Label>
              <Input
                id="title"
                placeholder="T.ex. Multiplikationstabellen som ett spel"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
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
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/2000
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Målgrupp (ålder)</Label>
                <Select value={targetAge} onValueChange={setTargetAge}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj åldersgrupp" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ämne</Label>
                <Select value={targetSubject} onValueChange={setTargetSubject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Välj ämne" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/min-sida')}
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={createIdea.isPending || !title.trim() || !description.trim()}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Publicera idé
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
