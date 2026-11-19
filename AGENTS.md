# Architecture rules

- Admin and MCP must read app-opening reports through the same caller-scoped RPC and validated contract; timestamped events store no visitor identity and cannot reconstruct historical daily counts.

- Reuse a shared app-thumbnail component across card variants so screenshot and fallback behavior stays consistent.
- Keep password recovery on a public dedicated route and retain PASSWORD_RECOVERY state in the auth provider so lazy loading cannot lose the recovery event.
- Profile reads must allow owners/admins and public contributors, not enumerate inactive accounts; retain recipient access to notification senders.
- Agent API keys use a separate `mcp-key` edge function bundled from `src/lib/mcp` (scripts/build-mcp-key.mjs, run on Vite build) and share the same tool list; it acts as service_role only after `verify_agent_api_key` confirms an unrevoked, unexpired admin-owned key, because the MCP SDK only supports OAuth.
