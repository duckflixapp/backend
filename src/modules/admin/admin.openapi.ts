/**
 * @openapi
 * components:
 *   schemas:
 *     SystemSettings:
 *       type: object
 *       properties:
 *         features:
 *           type: object
 *           properties:
 *             autoTranscoding:
 *               type: string
 *               enum: [off, compatibility, smart]
 *               description: |
 *                 off — no automatic transcoding.
 *                 compatibility — transcodes non-mp4 and hevc files to h264.
 *                 smart — additionally transcodes to lower resolutions.
 *             concurrentProcessing:
 *               type: integer
 *               minimum: 1
 *               maximum: 10
 *             registration:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 trustEmails:
 *                   type: boolean
 *                   description: If true, skips email verification on registration
 *         preferences:
 *           type: object
 *           properties:
 *             subtitles:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   lang:
 *                     type: string
 *                     example: en
 *                   variants:
 *                     type: integer
 *                     description: How many subtitle variants to download per language
 *         external:
 *           type: object
 *           properties:
 *             tmdb:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                   description: Sensitive fields are masked with *** in responses
 *             openSubtitles:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   type: string
 *                 username:
 *                   type: string
 *                 password:
 *                   type: string
 *                 useLogin:
 *                   type: boolean
 *             email:
 *               type: object
 *               properties:
 *                 enabled:
 *                   type: boolean
 *                 smtpSettings:
 *                   type: object
 *                   properties:
 *                     host:
 *                       type: string
 *                     port:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     password:
 *                       type: string
 */

/**
 * @openapi
 * /admin/system:
 *   get:
 *     summary: Get system settings
 *     description: |
 *       Returns current system configuration including features, preferences, and external service settings.
 *       Sensitive fields like API keys and passwords are masked with `**********` in the response.
 *       Requires admin role.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Current system settings
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
 *                     system:
 *                       $ref: '#/components/schemas/SystemSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   patch:
 *     summary: Update system settings
 *     description: |
 *       Partially updates system configuration. All fields are optional.
 *       If a sensitive field value contains `**********`, it is ignored and the existing value is kept.
 *       Changes take effect immediately without server restart.
 *       Requires admin role.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SystemSettings'
 *     responses:
 *       200:
 *         description: Updated system settings
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
 *                     system:
 *                       $ref: '#/components/schemas/SystemSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @openapi
 * /admin/users:
 *   get:
 *     summary: Get all users
 *     description: |
 *       Returns all users with any assigned role (watcher, contributor, admin),
 *       sorted by role hierarchy from admin down to watcher.
 *       Requires admin role.
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of users
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
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   patch:
 *     summary: Change user role
 *     description: |
 *       Updates the role of a user identified by email.
 *       Admins cannot change their own role.
 *       Requires admin role.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               role:
 *                 type: string
 *                 enum: [watcher, contributor, admin]
 *     responses:
 *       204:
 *         description: Role updated successfully
 *       403:
 *         description: Cannot change your own role
 *       404:
 *         description: User not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Delete a user
 *     description: |
 *       Permanently deletes a user account identified by email.
 *       Admins cannot delete their own account.
 *       Requires admin role.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       204:
 *         description: User deleted successfully
 *       403:
 *         description: Cannot delete your own account
 *       404:
 *         description: User not found
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
