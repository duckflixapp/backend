import http from 'node:http';
import { app } from './app';
import { pool } from './shared/configs/db';
import { SocketServer } from './shared/lib/socket';
import { env } from './env';
import { initalize } from './initialize';
import { logger } from './shared/configs/logger';

const PORT = env.PORT;

const httpServer = http.createServer(app);
const socketServer = new SocketServer(httpServer);

await initalize();

export const io = socketServer.init();
const server = httpServer.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    server.close();
    await pool.end();
    process.exit(0);
});
