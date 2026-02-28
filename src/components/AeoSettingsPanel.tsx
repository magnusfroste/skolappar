import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Bot, ExternalLink } from 'lucide-react';
import { useSetting, useUpdateSetting } from '@/hooks/useSettings';
import { toast } from '@/hooks/use-toast';

export function AeoSettingsPanel() {
  const updateSetting = useUpdateSetting();
  const { data: llmsIntro } = useSetting('llms_txt_intro');
  const { data: llmsExtra } = useSetting('llms_txt_extra');

  const [intro, setIntro] = useState('');
  const [extra, setExtra] = useState('');

  useEffect(() => {
    if (typeof llmsIntro === 'string') setIntro(llmsIntro);
  }, [llmsIntro]);

  useEffect(() => {
    if (typeof llmsExtra === 'string') setExtra(llmsExtra);
  }, [llmsExtra]);

  const handleSave = async () => {
    try {
      await updateSetting.mutateAsync({ key: 'llms_txt_intro', value: intro });
      await updateSetting.mutateAsync({ key: 'llms_txt_extra', value: extra });
      toast({ title: 'AEO-inställningar sparade!' });
    } catch {
      toast({ title: 'Kunde inte spara', variant: 'destructive' });
    }
  };

  const llmsTxtUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llms-txt`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AEO – Answer Engine Optimization
        </CardTitle>
        <CardDescription>
          Optimera för AI-sökmotorer som ChatGPT, Perplexity och Google AI Overview.
          llms.txt-filen genereras dynamiskt med sajt-info, appar och FAQ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
          <p className="font-medium">Din llms.txt-fil:</p>
          <a
            href={llmsTxtUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1 break-all"
          >
            {llmsTxtUrl}
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
          <p className="text-muted-foreground text-xs mt-1">
            Lägg till i robots.txt eller länka från din hemsida för att AI-sökmotorer ska hitta den.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Introduktionstext</Label>
          <Textarea
            value={intro}
            onChange={e => setIntro(e.target.value)}
            placeholder="Beskriv sidan och dess syfte för AI-sökmotorer..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Visas direkt efter sidbeskrivningen i llms.txt.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Extra innehåll (valfritt)</Label>
          <Textarea
            value={extra}
            onChange={e => setExtra(e.target.value)}
            placeholder="T.ex. kontaktinfo, teknisk stack, samarbetspartners..."
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Visas i slutet av llms.txt, efter appar och resurser.
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateSetting.isPending}>
          {updateSetting.isPending ? 'Sparar...' : 'Spara AEO-inställningar'}
        </Button>
      </CardContent>
    </Card>
  );
}
