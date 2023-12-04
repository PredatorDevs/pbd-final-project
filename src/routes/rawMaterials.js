import { Router } from 'express';
const router = Router();

import controller from '../controllers/rawMaterials.js';
import middleware from '../middlewares/middleware.js';

const { find, findByLocationStockData, findCurrentStock, add, update, remove, stocks } = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);
router.get('/current-stock', checkToken, checkUserIsActive, findCurrentStock);
router.get('/by-location-stock-data/:locationId', checkToken, checkUserIsActive, findByLocationStockData);

router.post('/', checkToken, checkUserIsActive, add);

router.put('/', checkToken, checkUserIsActive, update);

router.delete('/:rawMaterialId', checkToken, checkUserIsActive, remove);

// RAW MATERIAL STOCKS

router.get('/stocks/:rawMaterialId', checkToken, checkUserIsActive, stocks.findByRawMaterialId);

router.put('/stocks', checkToken, checkUserIsActive, stocks.updateById);

export default router;
