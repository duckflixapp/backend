import { randomUUID } from 'node:crypto';
import { Queue } from './queue';

export type Runnable = (...args: unknown[]) => Promise<unknown>;
export type TaskStatus = 'working' | 'waiting';

type TaskEvents = {
    started: [taskId: string];
    completed: [taskId: string];
    error: [taskId: string, error: unknown];
};

interface Task {
    id: string;
    run: Runnable;
}

export class TaskHandler {
    private taskQueue = new Queue<Task>();
    private tasksMap = new Map<string, true>();
    private current: Task | null = null;

    private listeners: { [K in keyof TaskEvents]?: ((...args: TaskEvents[K]) => void)[] } = {};

    /**
     * Returns the current overall status of the task handler.
     * @returns 'working' if a task is currently being processed, 'waiting' otherwise.
     */
    public get status(): TaskStatus {
        return this.current != null ? 'working' : 'waiting';
    }

    /**
     * Checks the status of a specific task by its ID.
     * @param taskId - The unique identifier of the task.
     * @returns 'working' if active, 'waiting' if in queue, or undefined if not found.
     */
    public check(taskId: string): TaskStatus | undefined {
        if (this.current?.id === taskId) return 'working';
        return this.tasksMap.has(taskId) ? 'waiting' : undefined;
    }

    /**
     * Adds a new runnable task to the execution queue.
     * @param runnable - An asynchronous function to be executed.
     * @param id - Optional custom identifier for the task.
     * @returns The unique identifier assigned to the task.
     */
    public handle(runnable: Runnable, id?: string): string {
        const task = { id: id ?? randomUUID(), run: runnable };
        this.taskQueue.add(task);
        this.tasksMap.set(task.id, true);
        void this.checkQueue();
        return task.id;
    }

    /**
     * Calculates the current position of a task within the entire workflow.
     * @param taskId - The unique identifier of the task.
     * @returns 0 if currently processing, a positive integer for queue position, or -1 if not found.
     */
    public findPosition(taskId: string) {
        if (this.current && this.current.id === taskId) return 0;
        const position = this.taskQueue.findPosition((t) => t.id === taskId);
        return position >= 0 ? position + 1 : -1;
    }

    private async checkQueue(): Promise<void> {
        if (this.current) return; // already working
        if (this.taskQueue.isEmpty) return; // finished - no more tasks
        await this.process();
    }

    private async process() {
        this.current = this.taskQueue.remove() as Task;
        this.tasksMap.delete(this.current.id);
        const taskId = this.current.id;
        this.emit('started', taskId);
        this.current
            .run()
            .then(() => {
                this.current = null;
                this.emit('completed', taskId);
            })
            .catch((e) => {
                this.current = null;
                this.emit('error', taskId, e);
            })
            .finally(() => this.checkQueue());
    }

    private emit<K extends keyof TaskEvents>(event: K, ...args: TaskEvents[K]) {
        this.listeners[event]?.forEach((callback) => callback(...args));
    }

    /**
     * Registers a callback function for a specific task event.
     * @param event - The name of the event to listen for.
     * @param callback - The function to be executed when the event is emitted.
     */
    public addListener<K extends keyof TaskEvents>(event: K, callback: (...args: TaskEvents[K]) => void) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }

    /**
     * Removes a previously registered callback function for a specific task event.
     * @param event - The name of the event.
     * @param callback - The reference of the callback to remove.
     * @returns True if the listener was found and removed, false otherwise.
     */
    public removeListener<K extends keyof TaskEvents>(event: K, callback: (...args: TaskEvents[K]) => void): boolean {
        if (!this.listeners[event]) return false;
        const index = this.listeners[event].findIndex((v) => v == callback);
        if (index === -1) return false;
        this.listeners[event]?.splice(index, 1);
        return true;
    }

    /**
     * Removes all previously registered callback functions for a specific task event if event is provided.
     * If event is not provided it clears all listeners.
     * @param event - The name of the event.
     */
    public clearListeners<K extends keyof TaskEvents>(event?: K): void {
        if (!event) {
            this.listeners = {};
            return;
        }

        if (!this.listeners[event]) return;
        this.listeners[event] = [];
    }
}
