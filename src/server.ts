import { app } from '@core/app';
import { pool } from '@shared/configs/db';
import { env } from '@core/env';
import { initalize } from '@core/initialize';
import { logger } from '@shared/configs/logger';
import { liveSessionManager } from '@modules/media/live.service';
import { SocketServer } from '@shared/lib/socket';

await initalize();

const PORT = env.PORT;
app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});

const socketServer = new SocketServer();
export const io = socketServer.init();

process.on('SIGINT', async () => {
    app.stop();
    await pool.end();
    liveSessionManager.destroyAll();
    process.exit(0);
});
