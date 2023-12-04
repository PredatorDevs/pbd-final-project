import { Router } from 'express';
const router = Router();

import controller from '../controllers/reports.js';
import middleware from '../middlewares/middleware.js';

const {
  testquery,
  kardexByProduct,
  createNewPdf,
  createNewPdfAlt,
  getPdf,
  getLocationProductsByCategory,
  getLocationProductsByBrand,
  getLocationProductsByFilteredData,
  shiftcutSettlement
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/kardex/by-product/:locationId/:productId/:startDate/:endDate', checkToken, checkUserIsActive, kardexByProduct);
router.post('/create-pdf', createNewPdf);
router.post('/create-pdf-alt', createNewPdfAlt);
router.get('/get-pdf', getPdf);
router.get('/get-product-by-cat/:locationId', getLocationProductsByCategory);
router.get('/get-product-by-brand/:locationId', getLocationProductsByBrand);
router.get('/shiftcut-settlement/:shiftcutId', shiftcutSettlement);

router.post('/get-product-by-filtered-data', getLocationProductsByFilteredData);

router.post('/testquery', testquery);

export default router;
