// Server entry point. Starts the HTTP server on the configured port.
import { config } from './config.js';
import { createApp } from './app.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[scrollguard] API listening on http://localhost:${config.port}`);
  console.log(`[scrollguard] Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown so SQLite flushes cleanly.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}