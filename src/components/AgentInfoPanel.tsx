import { Bot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** How an AI agent (e.g. Hermes) connects to the admin MCP endpoint. */
export function AgentInfoPanel() {
  const endpoint = `${window.location.origin}/mcp`;
  const config = JSON.stringify(
    { mcpServers: { skolappar: { type: 'http', url: endpoint, headers: { Authorization: 'Bearer <nyckel>' } } } },
    null,
    2
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle>AI-agent (MCP)</CardTitle>
        </div>
        <CardDescription>
          En agent kan administrera sajten via MCP: granska tips, prova och klassa appar, godkänna, redigera,
          hantera kategorier, resurser, idéer och inställningar samt läsa statistik. Utan nyckel är samma adress
          öppen för föräldrars agenter: de läser katalogen, skickar in sin app och följer den.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="font-medium">Adress</p>
          <code className="block rounded-md bg-muted p-2 break-all">{endpoint}</code>
        </div>
        <div>
          <p className="font-medium">Inloggning</p>
          <p className="text-muted-foreground">
            Header <code>Authorization: Bearer &lt;nyckel&gt;</code> – agentens egen nyckel (<code>skol_…</code>, öppnar bara MCP)
            eller samma nyckel som för den här sidan.
          </p>
        </div>
        <div>
          <p className="font-medium">Exempel på konfiguration</p>
          <pre className="rounded-md bg-muted p-3 overflow-x-auto text-xs">{config}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
