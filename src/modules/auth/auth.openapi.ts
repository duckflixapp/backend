/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Register a new account
 *     description: |
 *       Creates a new user account. Registration can be disabled by the system administrator.
 *       The first registered user automatically receives the `admin` role.
 *       If email verification is required, a verification email is sent after registration.
 *       If `trustEmails` is enabled in system settings, the account is immediately verified.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 32
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 64
 *                 description: Must contain at least one uppercase, one lowercase, and one special character
 *                 example: Secure@123
 *     responses:
 *       201:
 *         description: Account created successfully
 *       409:
 *         description: Email already in use
 *       503:
 *         description: Registration is disabled or email service is misconfigured
 */

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: |
 *       Verifies the user's email using the token sent during registration.
 *       Tokens expire after 24 hours.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: a3f2c1...
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Token is missing, invalid, or expired
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login
 *     description: |
 *       Authenticates the user and sets three HttpOnly cookies:
 *       - `auth_token` — short-lived JWT access token
 *       - `refresh_token` — long-lived session token (path restricted)
 *       - `csrf_token` — CSRF protection token (readable by JS)
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 maxLength: 64
 *                 example: Secure@123
 *     responses:
 *       200:
 *         description: Login successful, cookies set
 *         headers:
 *           Set-Cookie:
 *             description: auth_token, refresh_token, csrf_token
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid email or password
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout
 *     description: |
 *       Invalidates the current session and clears all auth cookies.
 *       If the refresh token is missing, cookies are still cleared.
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully, cookies cleared
 */

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Issues a new access token and refresh token using the existing refresh token cookie.
 *       Implements refresh token rotation — the old token is marked as used.
 *       If a used token is detected, all sessions for that user are immediately invalidated
 *       as a security breach response.
 *     tags: [Auth]
 *     security: []
 *     responses:
 *       200:
 *         description: Tokens refreshed, new cookies set
 *         headers:
 *           Set-Cookie:
 *             description: New auth_token, refresh_token, csrf_token
 *             schema:
 *               type: string
 *       401:
 *         description: Refresh token missing or session expired
 *       403:
 *         description: Security breach detected — all sessions invalidated
 */
