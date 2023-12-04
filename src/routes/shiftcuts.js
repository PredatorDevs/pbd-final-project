import { Router } from 'express';
const router = Router();

import controller from '../controllers/shiftcuts.js';
import middleware from '../middlewares/middleware.js';

const { find, findById, settlements, settlementsById, settlementsByLocation, settlementsOrderSaleById } = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);

router.get('/settlements', checkToken, checkUserIsActive, settlements);
router.get('/settlements/:shiftcutId', checkToken, checkUserIsActive, settlementsById);
router.get('/settlements/by-location/:locationId', checkToken, checkUserIsActive, settlementsByLocation);
router.get('/settlements/order-sales/:shiftcutId', checkToken, checkUserIsActive, settlementsOrderSaleById);

router.get('/:shiftcutId', checkToken, checkUserIsActive, findById);

export default router;
