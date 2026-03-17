/**
 * @openapi
 * components:
 *   schemas:
 *     LibraryMin:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: My Favorites
 *         type:
 *           type: string
 *           enum: [watchlist, custom]
 *         size:
 *           type: integer
 *           description: Number of movies in the library
 *     Library:
 *       allOf:
 *         - $ref: '#/components/schemas/LibraryMin'
 *         - type: object
 *           properties:
 *             user:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *     LibraryItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         libraryId:
 *           type: string
 *           format: uuid
 *         movieId:
 *           type: string
 *           format: uuid
 *         addedAt:
 *           type: string
 *           format: date-time
 *         movie:
 *           $ref: '#/components/schemas/Movie'
 */

/**
 * @openapi
 * /library:
 *   get:
 *     summary: Get user libraries
 *     description: |
 *       Returns all libraries belonging to the authenticated user.
 *       Optionally filter to return only custom libraries by passing `custom=true`.
 *       Always includes the system `watchlist` library unless filtered.
 *     tags: [Library]
 *     parameters:
 *       - in: query
 *         name: custom
 *         schema:
 *           type: boolean
 *         description: If true, returns only custom libraries
 *     responses:
 *       200:
 *         description: List of user libraries
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
 *                     libraries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LibraryMin'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create a custom library
 *     description: |
 *       Creates a new custom library for the authenticated user.
 *       Users are limited to 10 custom libraries.
 *       Reserved names like `watchlist` are not allowed.
 *       Duplicate names are not allowed per user.
 *     tags: [Library]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 32
 *                 example: Weekend Watch
 *     responses:
 *       200:
 *         description: Library created
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
 *                     library:
 *                       $ref: '#/components/schemas/LibraryMin'
 *       403:
 *         description: Library limit reached (max 10)
 *       409:
 *         description: Name is reserved or already in use
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /library/{id}:
 *   get:
 *     summary: Get library by ID
 *     description: Returns a single library with user info. Only accessible by the owner.
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Library details
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
 *                     library:
 *                       $ref: '#/components/schemas/Library'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Delete a custom library
 *     description: |
 *       Deletes a custom library and all its items.
 *       Only custom libraries can be deleted — system libraries like `watchlist` cannot be removed.
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Library deleted
 *       403:
 *         description: Cannot delete system libraries
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /library/{id}/movies:
 *   get:
 *     summary: Get movies in a library
 *     description: |
 *       Returns a paginated list of movies in the specified library.
 *       Supports search by movie title.
 *       Only accessible by the library owner.
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           maxLength: 100
 *     responses:
 *       200:
 *         description: Paginated library items
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LibraryItem'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /library/{libraryId}/movies/{movieId}:
 *   post:
 *     summary: Add movie to library
 *     description: |
 *       Adds a movie to the specified library.
 *       Use `watchlist` as `libraryId` to add to the system watchlist.
 *       Returns 409 if the movie is already in the library.
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: libraryId
 *         required: true
 *         schema:
 *           type: string
 *           description: Library UUID or the literal string "watchlist"
 *           example: watchlist
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Movie added to library
 *       404:
 *         description: Library or movie not found
 *       409:
 *         description: Movie already in library
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Remove movie from library
 *     description: |
 *       Removes a movie from the specified library.
 *       Use `watchlist` as `libraryId` to remove from the system watchlist.
 *     tags: [Library]
 *     parameters:
 *       - in: path
 *         name: libraryId
 *         required: true
 *         schema:
 *           type: string
 *           description: Library UUID or the literal string "watchlist"
 *           example: watchlist
 *       - in: path
 *         name: movieId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Movie removed from library
 *       404:
 *         description: Library not found or movie not in library
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
