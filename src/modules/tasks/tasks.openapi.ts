/**
 * @openapi
 * /tasks/{id}/kill:
 *   delete:
 *     summary: Kill a movie processing task
 *     description: |
 *       Terminates an active FFmpeg transcoding process or removes a pending task from the queue.
 *       Updates the movie version status to `canceled` in either case.
 *       Requires at least `contributor` role.
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Movie version ID to kill
 *     responses:
 *       200:
 *         description: Task successfully killed or removed from queue
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Active movie processing was terminated.
 *                 details:
 *                   type: object
 *                   properties:
 *                     wasInQueue:
 *                       type: boolean
 *                       description: True if task was waiting in queue
 *                     wasRunning:
 *                       type: boolean
 *                       description: True if task was actively transcoding
 *       404:
 *         description: Task not found or not currently active
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
