import { TaskHandler } from '../tasks';

describe('TaskHandler', () => {
    let handler: TaskHandler;

    beforeEach(() => {
        handler = new TaskHandler();
    });

    test('should add a task and return a valid UUID', () => {
        const taskId = handler.handle(async () => 'test');
        expect(typeof taskId).toBe('string');
        expect(taskId.length).toBeGreaterThan(0);
    });

    test('should process tasks one by one in correct order', async () => {
        const results: number[] = [];

        const createTask = (val: number, ms: number) => async () => {
            await new Promise((resolve) => setTimeout(resolve, ms));
            results.push(val);
        };

        handler.handle(createTask(1, 50));
        handler.handle(createTask(2, 5));
        handler.handle(createTask(3, 10));

        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(handler.status).toEqual('waiting');
        expect(results).toEqual([1, 2, 3]);
    });

    test('should emit "start" and "completed" events', (done) => {
        const createTask = (val: number, ms: number) => async () => {
            await new Promise((resolve) => setTimeout(resolve, ms));
            return val;
        };
        handler.addListener('started', (_) => {
            try {
                expect(handler.status).toBe('working');
            } catch (e) {
                done(e);
            }
        });

        handler.addListener('completed', (_) => {
            try {
                expect(handler.status).toBe('waiting');
                done();
            } catch (e) {
                done(e);
            }
        });

        handler.handle(createTask(10, 50));
    });

    test('should emit "error" event when task fails', (done) => {
        const errorMsg = 'Boom!';
        const taskId = handler.handle(async () => {
            throw new Error(errorMsg);
        });

        handler.addListener('error', (id, err) => {
            expect(id).toBe(taskId);
            expect((err as Error).message).toBe(errorMsg);
            done();
        });
    });

    test('should correctly report status via check()', async () => {
        const task1Id = handler.handle(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
        });
        const task2Id = handler.handle(async () => {});

        expect(handler.check(task1Id)).toBe('working');
        expect(handler.check(task2Id)).toBe('waiting');

        await new Promise((resolve) => setTimeout(resolve, 100));

        expect(handler.check(task1Id)).toBeUndefined();
    });

    test('should be able to remove listeners', () => {
        let callCount = 0;
        const callback = () => {
            callCount++;
        };

        handler.addListener('completed', callback);
        handler.removeListener('completed', callback);

        handler.handle(async () => {});

        setTimeout(() => {
            expect(callCount).toBe(0);
        }, 10);
    });
});
