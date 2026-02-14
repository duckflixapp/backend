import { app } from './app';
import { pool } from './shared/db';

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

process.on('SIGINT', async () => {
    server.close();
    await pool.end();
    process.exit(0);
});
