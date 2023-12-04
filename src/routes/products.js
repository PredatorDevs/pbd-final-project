import { Router } from 'express';
const router = Router();

import controller from '../controllers/products.js';
import middleware from '../middlewares/middleware.js';

const {
  find,
  findByLocationStockData,
  findByMultipleParams,
  findTaxesByProductId,
  findLocationStockCheck,
  add,
  update,
  remove,
  checkAvailability,
  prices,
  stocks,
  packageConfigs
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);
router.get('/taxes-data/:productId', checkToken, checkUserIsActive, findTaxesByProductId);
router.get('/by-location-stock-data/:locationId', checkToken, checkUserIsActive, findByLocationStockData);
router.get('/check-availability/:locationId/:productId/:quantity', checkToken, checkUserIsActive, checkAvailability);
router.get('/location-stock-check/:locationId', checkToken, checkUserIsActive, findLocationStockCheck);
router.get('/by-multiple-params/:locationId/:productFilterParam/:excludeServices', checkToken, checkUserIsActive, findByMultipleParams);

router.post('/', checkToken, checkUserIsActive, add);

router.put('/', checkToken, checkUserIsActive, update);

router.delete('/:productId', checkToken, checkUserIsActive, remove);

// PRODUCT STOCKS

router.get('/stocks/:productId', checkToken, checkUserIsActive, stocks.findByProductId);

router.put('/stocks', checkToken, checkUserIsActive, stocks.updateById);

// PRODUCT PRICES

router.get('/prices/:productId', checkToken, checkUserIsActive, prices.findByProductId);

router.post('/prices', checkToken, checkUserIsActive, prices.add);

router.put('/prices', checkToken, checkUserIsActive, prices.update);

router.delete('/prices/:productPriceId', checkToken, checkUserIsActive, prices.remove);

// PACKAGE CONFIGS

router.get('/package-configs/:productId', checkToken, checkUserIsActive, packageConfigs.findByProductId);

router.post('/package-configs', checkToken, checkUserIsActive, packageConfigs.add);

router.delete('/package-configs/:productPackageConfigId', checkToken, checkUserIsActive, packageConfigs.remove);

export default router;
