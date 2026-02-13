import { spawn as nodeSpawn } from 'node:child_process';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const isBun = typeof Bun !== 'undefined';

export interface UniversalProcess {
    native: unknown;
    getStdout: () => Promise<string>;
    getStderr: () => Promise<string>;
    wait: () => Promise<number>;
    exitCode: () => number | null;
}

export const spawn = async (command: string, args: string[]): Promise<UniversalProcess> => {
    if (isBun) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const proc = Bun.spawn([command, ...args]);

        return {
            native: proc,
            getStdout: async () => await new Response(proc.stdout).text(),
            getStderr: async () => await new Response(proc.stderr).text(),
            wait: async () => await proc.exited,
            exitCode: () => proc.exitCode,
        };
    } else {
        const proc = nodeSpawn(command, args);
        let stdoutData = '';
        let stderrData = '';

        proc.stdout?.on('data', (chunk) => (stdoutData += chunk.toString()));
        proc.stderr?.on('data', (chunk) => (stderrData += chunk.toString()));

        const promise = new Promise<number>((resolve, reject) => {
            proc.on('close', (code) => resolve(code ?? 0));
            proc.on('error', (err) => reject(err));
        });

        return {
            native: proc,
            getStdout: async () => {
                await promise;
                return stdoutData;
            },
            getStderr: async () => {
                await promise;
                return stderrData;
            },
            wait: () => promise,
            exitCode: () => proc.exitCode ?? 0,
        };
    }
};
