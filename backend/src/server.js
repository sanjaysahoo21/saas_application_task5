import http from 'http';
import app from './app.js';
import config from './config/env.js';

const server = http.createServer(app);

server.listen(config.port, () => {
  // Log to stdout for container visibility
  console.log(`${config.appName} listening on port ${config.port} (env: ${config.env})`);
});

// Graceful shutdown handlers
const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);
  server.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
