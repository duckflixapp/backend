/**
 * @openapi
 * /users/@me/notifications:
 *   get:
 *     summary: Get current user notifications
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Last 10 notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   patch:
 *     summary: Mark notifications as read
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 30
 *                 description: Empty array marks all as read
 *                 example: []
 *     responses:
 *       200:
 *         description: Notifications marked as read
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Clear all notifications
 *     tags: [Users]
 *     responses:
 *       204:
 *         description: All notifications cleared
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
