import { useState } from "react";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
export const MCP_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/mcp`;
export const MCP_KEY_URL = `${MCP_URL}-key`;

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

      <ApiKeysCard />

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
        Godkänn bara agenter du litar på. Spärra en nyckel med papperskorgen.
      </p>
    </div>
  );
}

type AgentKey = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; expires_at: string | null; revoked_at: string | null };
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("sv-SE") : "–");
const db = supabase as unknown as { from: (t: string) => any; rpc: (f: string, a: object) => Promise<{ data: any; error: { message: string } | null }> };

/** API-nycklar: enklaste sättet att ansluta en agent som kör i t.ex. Docker. */
function ApiKeysCard() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const { data: keys = [] } = useQuery({
    queryKey: ["agent-keys"],
    queryFn: async () => {
      const { data, error } = await db.from("agent_api_keys").select("id,name,key_prefix,created_at,last_used_at,expires_at,revoked_at").is("revoked_at", null).order("created_at", { ascending: false });
      if (error) throw error;
      return data as AgentKey[];
    },
  });

  const create = async () => {
    const { data, error } = await db.rpc("create_agent_api_key", { key_name: name.trim(), valid_days: 90 });
    if (error) return toast.error(error.message);
    setNewKey(data.key); setName("");
    qc.invalidateQueries({ queryKey: ["agent-keys"] });
  };
  const revoke = async (id: string) => {
    const { error } = await db.rpc("revoke_agent_api_key", { key_id: id });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["agent-keys"] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" />API-nyckel</CardTitle>
        <CardDescription>Enklast för agenter i Docker. Gäller 90 dagar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <CopyRow value={MCP_KEY_URL} />
          <p className="text-xs text-muted-foreground px-1">Skicka nyckeln i headern <code>Authorization: Bearer …</code></p>
        </div>
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namn, t.ex. Hermes" className="h-12" maxLength={60} />
          <Button onClick={create} disabled={!name.trim()} className="h-12 shrink-0">Skapa</Button>
        </div>
        {newKey && (
          <div className="rounded-xl border border-primary/40 bg-primary/5 p-3 space-y-2">
            <p className="text-sm font-medium">Kopiera nu – nyckeln visas bara en gång.</p>
            <CopyRow value={newKey} />
          </div>
        )}
        {keys.length > 0 && (
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{k.name}</p>
                  <p className="text-xs text-muted-foreground">{k.key_prefix}… · använd {fmt(k.last_used_at)} · går ut {fmt(k.expires_at)}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-12 w-12" aria-label={`Spärra ${k.name}`} onClick={() => revoke(k.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function CopyRow({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <code className="flex-1 min-w-0 truncate rounded-xl bg-muted px-4 py-3 text-sm">{value}</code>
      <Button variant="outline" className="h-12 shrink-0" aria-label="Kopiera" onClick={async () => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </Button>
    </div>
  );
}
