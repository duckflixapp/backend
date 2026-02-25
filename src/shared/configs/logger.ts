import pino, { type TransportTargetOptions } from 'pino';
import path from 'node:path';
import { paths } from './path.config';
import pinoHttp from 'pino-http';
import type { Request, Response } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

const targets: TransportTargetOptions[] = [];

targets.push({
    target: isProduction ? 'pino/file' : 'pino-pretty',
    level: 'debug',
    options: { colorize: !isProduction, ignore: 'pid,hostname,reqId,responseTime' },
});

if (isProduction)
    targets.push({
        target: 'pino-roll',
        level: 'warn',
        options: {
            file: path.join(paths.logs, '/app.log'),
            frequency: 'daily',
            size: '10m',
            mkdir: true,
        },
    });

const transport = pino.transport({ targets });

export const logger = pino({ level: isProduction ? 'info' : 'debug' }, transport);

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

const getStatusColor = (status: number) => {
    if (status >= 500) return colors.red;
    if (status >= 400) return colors.yellow;
    if (status >= 300) return colors.cyan;
    if (status >= 200) return colors.green;
    return colors.reset;
};

export const httpLogger = pinoHttp({
    logger,
    autoLogging: {
        ignore: (req) => req.method === 'OPTIONS',
    },
    quietReqLogger: true,
    customSuccessMessage: (req: Request, res: Response, responseTime: number) => {
        const statusColor = getStatusColor(res.statusCode);
        const methodColor = colors.bright + colors.cyan;

        return `${methodColor}${req.method}${colors.reset} ${req.originalUrl} ${statusColor}${res.statusCode}${colors.reset} ${colors.gray} ${responseTime}ms${colors.reset}`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.originalUrl} ${res.statusCode} - ${err.message}`;
    },
    serializers: {
        req: () => undefined,
        res: () => undefined,
        err: pino.stdSerializers.err,
    },
});
