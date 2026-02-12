import { Router } from 'express';
import * as MoviesController from './movies.controller';
import { movieUpload } from '../../shared/configs/multer.config';

const router = Router();

router.post('/upload', movieUpload.single('video'), MoviesController.upload);
router.get('/', MoviesController.getMany);
router.get('/genres', MoviesController.getManyGenres);

router.get('/:id', MoviesController.getOne);

export default router;
