/**
 * @openapi
 * components:
 *   schemas:
 *     Genre:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *           example: Action
 *     MovieVersion:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         height:
 *           type: integer
 *           example: 1080
 *         width:
 *           type: integer
 *           example: 1920
 *         mimeType:
 *           type: string
 *           example: video/mp4
 *         streamUrl:
 *           type: string
 *         status:
 *           type: string
 *           enum: [ready, processing, canceled, error]
 *         isOriginal:
 *           type: boolean
 *         fileSize:
 *           type: integer
 *           nullable: true
 *     Movie:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         bannerUrl:
 *           type: string
 *           nullable: true
 *         posterUrl:
 *           type: string
 *           nullable: true
 *         rating:
 *           type: string
 *           example: "8.5"
 *         releaseYear:
 *           type: integer
 *           nullable: true
 *         duration:
 *           type: integer
 *           nullable: true
 *           description: Duration in seconds
 *         status:
 *           type: string
 *           enum: [downloading, processing, ready, error]
 *         genres:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Genre'
 *         isPlayable:
 *           type: boolean
 *     MovieDetailed:
 *       allOf:
 *         - $ref: '#/components/schemas/Movie'
 *         - type: object
 *           properties:
 *             versions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MovieVersion'
 *             generatedVersions:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MovieVersion'
 *               description: JIT live transcode versions, generated on demand
 *             inLibrary:
 *               type: boolean
 *               nullable: true
 *             uploader:
 *               type: object
 *               nullable: true
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *     PaginationMeta:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: integer
 *         itemCount:
 *           type: integer
 *         itemsPerPage:
 *           type: integer
 *         totalPages:
 *           type: integer
 *         currentPage:
 *           type: integer
 */

/**
 * @openapi
 * /movies:
 *   get:
 *     summary: Get paginated list of movies
 *     description: |
 *       Returns a paginated, filterable list of ready movies.
 *       Supports search by title, filtering by genre, and ordering by newest, oldest, rating, or title.
 *     tags: [Movies]
 *     parameters:
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
 *         description: Search by title (case-insensitive)
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [newest, oldest, rating, title]
 *           default: newest
 *       - in: query
 *         name: genreId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by genre
 *     responses:
 *       200:
 *         description: Paginated movie list
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
 *                     $ref: '#/components/schemas/Movie'
 *                 meta:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /movies/genres:
 *   get:
 *     summary: Get all movie genres
 *     description: Returns all available genres ordered alphabetically.
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: List of genres
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
 *                     genres:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Genre'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *   post:
 *     summary: Create a genre
 *     description: Creates a new genre. Requires admin role.
 *     tags: [Movies]
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
 *                 minLength: 1
 *                 maxLength: 32
 *                 example: Thriller
 *     responses:
 *       200:
 *         description: Genre created
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
 *                     genre:
 *                       $ref: '#/components/schemas/Genre'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @openapi
 * /movies/featured:
 *   get:
 *     summary: Get featured movie
 *     description: |
 *       Returns the most recently added ready movie that has a banner image.
 *       Intended for use as a hero element on the browse page.
 *       Returns 404 if no suitable movie is found.
 *     tags: [Movies]
 *     responses:
 *       200:
 *         description: Featured movie with full details
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
 *                     movie:
 *                       $ref: '#/components/schemas/MovieDetailed'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /movies/{id}:
 *   get:
 *     summary: Get movie by ID
 *     description: |
 *       Returns full movie details including all versions, subtitles, and uploader info.
 *       Also includes JIT-generated live transcode versions under `generatedVersions`.
 *       `inLibrary` indicates whether the authenticated user has this movie in their watchlist.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Movie details
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
 *                     movie:
 *                       $ref: '#/components/schemas/MovieDetailed'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @openapi
 * /movies/{id}:
 *   delete:
 *     summary: Delete a movie
 *     description: |
 *       Permanently deletes a movie, all its versions, subtitles, and associated files from storage.
 *       Requires at least `contributor` role.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Movie deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @openapi
 * /movies/{id}/watch:
 *   post:
 *     summary: Record watch start
 *     description: |
 *       Records that the authenticated user has started watching this movie.
 *       Automatically adds the movie to the user's watchlist if not already present.
 *       Called by the frontend when HLS manifest is successfully loaded.
 *     tags: [Movies]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Watch recorded
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
