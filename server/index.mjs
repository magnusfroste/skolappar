// Entry point: node server/index.mjs
import { createApp, loadConfig } from './app.mjs';

const config = loadConfig();
const app = createApp(config);

app.server.listen(config.port, () => {
  console.info(`skolappar listening on :${config.port} (data ${config.dataDir}, site ${config.siteUrl})`);
  if (!config.adminKey) console.warn('ADMIN_KEY not set – admin API, /admin and /mcp are disabled');
  if (app.mailer.problem) console.warn(`mail: ${app.mailer.problem} – messages are only logged`);
  else console.info(app.mailer.configured ? `mail via ${app.mailer.provider}` : 'mail not configured – messages are only logged');
});

let stopping = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, async () => {
    if (stopping) return;
    stopping = true;
    console.info(`${signal} received, shutting down`);
    const timer = setTimeout(() => process.exit(1), 10_000);
    timer.unref();
    await app.close();
    process.exit(0);
  });
}
