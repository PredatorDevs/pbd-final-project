import { Router } from 'express';
const router = Router();

import controller from '../controllers/reports.js';
import middleware from '../middlewares/middleware.js';

const {
  generateMarkersReport
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/markers', generateMarkersReport);

export default router;
