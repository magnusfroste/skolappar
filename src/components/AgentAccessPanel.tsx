import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
export const MCP_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/mcp`;

const STEPS = [
  "Kopiera adressen ovan.",
  "Lägg till den som MCP-server (fjärr / HTTP) i agenten – t.ex. Claude, ChatGPT, Codex, Cursor eller Hermes.",
  "Agenten öppnar skolappar.com. Logga in med ditt admin-konto och tryck Godkänn.",
  "Klart. Agenten har nu samma rättigheter som kontot som godkände.",
];

const CAPABILITIES = ["Appar", "Granskning", "Idéer", "Kommentarer", "Kategorier", "Resurser", "Användare & roller", "Utseende & SEO", "Inställningar", "Statistik"];

/** Visar MCP-adress och hur man ansluter en AI-agent. */
export function AgentAccessPanel() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Anslut en AI-agent</CardTitle>
          <CardDescription>Låt en agent administrera Skolappar åt dig.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <code className="flex-1 min-w-0 truncate rounded-xl bg-muted px-4 py-3 text-sm">{MCP_URL}</code>
            <Button onClick={copy} className="h-12 gap-2 shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopierad" : "Kopiera"}
            </Button>
          </div>

          <ol className="space-y-3">
            {STEPS.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agenten kan hantera</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {CAPABILITIES.map((c) => (
            <span key={c} className="rounded-full bg-muted px-3 py-1.5 text-sm">{c}</span>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground px-1">
        Godkänn bara agenter du litar på. Koppla bort en agent genom att ta bort anslutningen i agentens inställningar.
      </p>
    </div>
  );
}
