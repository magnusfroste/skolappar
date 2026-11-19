// API-key MCP endpoint (bundled to supabase/functions/mcp-key by scripts/build-mcp-key.mjs).
// A key is created by an admin in Admin → AI-agenter; verify_agent_api_key only
// accepts unrevoked, unexpired keys whose owner is still admin.
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ToolContext, ToolHandlerResult } from "@lovable.dev/mcp-js";
import mcp from "./index";
import { tools } from "./tools";

const env = (n: string) => (globalThis as { Deno?: { env: { get(n: string): string | undefined } } }).Deno?.env.get(n);
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, content-type, mcp-session-id, mcp-protocol-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

type AnyTool = { name: string; title?: string; description?: string; annotations?: unknown; inputSchema?: z.ZodRawShape; handler: (a: unknown, c: ToolContext) => Promise<ToolHandlerResult> | ToolHandlerResult };
const list = tools as unknown as AnyTool[];
const byName = new Map(list.map((t) => [t.name, t]));

export async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Använd POST" }, 405);

  const raw = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!raw.startsWith("skol_")) return json({ error: "API-nyckel saknas" }, 401);
  const admin = createClient(env("SUPABASE_URL")!, env("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: userId } = await admin.rpc("verify_agent_api_key" as never, { raw_key: raw } as never);
  if (!userId) return json({ error: "Ogiltig, spärrad eller utgången nyckel" }, 401);

  let msg: { id?: unknown; method?: string; params?: { name?: string; arguments?: unknown } };
  try { msg = await req.json(); } catch { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  const reply = (result: unknown) => json({ jsonrpc: "2.0", id: msg.id ?? null, result });
  const error = (code: number, message: string) => json({ jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } });

  switch (msg.method) {
    case "initialize":
      return reply({
        protocolVersion: "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: mcp.name, title: mcp.title, version: mcp.version },
        instructions: mcp.instructions,
      });
    case "ping": return reply({});
    case "tools/list":
      return reply({ tools: list.map((t) => ({
        name: t.name, title: t.title, description: t.description, annotations: t.annotations,
        inputSchema: zodToJsonSchema(z.object(t.inputSchema ?? {}).strict(), { $refStrategy: "none" }),
      })) });
    case "tools/call": {
      const tool = byName.get(msg.params?.name ?? "");
      if (!tool) return error(-32602, "Okänt verktyg");
      const parsed = z.object(tool.inputSchema ?? {}).strict().safeParse(msg.params?.arguments ?? {});
      if (!parsed.success) return reply({ content: [{ type: "text", text: parsed.error.message }], isError: true });
      const ctx = {
        keyClient: admin, signal: req.signal,
        isAuthenticated: () => true, getUserId: () => userId as string, getToken: () => undefined,
        progress: async () => {},
      } as unknown as ToolContext;
      try { return reply(await tool.handler(parsed.data, ctx)); }
      catch (e) { return reply({ content: [{ type: "text", text: e instanceof Error ? e.message : "Fel" }], isError: true }); }
    }
    default:
      if (msg.method?.startsWith("notifications/")) return new Response(null, { status: 202, headers: cors });
      return error(-32601, "Okänd metod");
  }
}
