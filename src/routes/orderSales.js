import { Router } from 'express';
const router = Router();

import controller from '../controllers/orderSales.js';
import middleware from '../middlewares/middleware.js';

const { 
  find, 
  findRecents, 
  findById, 
  findByLocationCurrentActiveShiftcut, 
  findByRangeDate, 
  findByLocationRangeDate,
  findSettlementByRangeDate,
  findSettlementByLocationRangeDate, 
  add, 
  update, 
  changeStatus, 
  recalculateTotal, 
  remove, 
  details,
  bulkInsertAfterNormalInsert
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);

router.get('/byId/:orderSaleId', checkToken, checkUserIsActive, findById);

router.get('/active-shiftcut/location/:locationId', checkToken, checkUserIsActive, findByLocationCurrentActiveShiftcut);

router.get('/by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findByRangeDate);

router.get('/by-location/:locationId/by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findByLocationRangeDate);

router.get('/settlement-by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findSettlementByRangeDate);

router.get('/settlement/by-location/:locationId/by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findSettlementByLocationRangeDate);

router.get('/recents', checkToken, checkUserIsActive, findRecents);

router.post('/', checkToken, checkUserIsActive, add);

router.put('/', checkToken, checkUserIsActive, update);

router.put('/setstatus', checkToken, checkUserIsActive, changeStatus);

router.put('/recalculate/:orderSaleId', checkToken, checkUserIsActive, recalculateTotal);

router.delete('/:orderSaleId', checkToken, checkUserIsActive, remove);

// PRODUCTION DETAILS

router.get('/details/:orderSaleId', checkToken, checkUserIsActive, details.findByOrderSaleId);

router.post('/details', checkToken, checkUserIsActive, details.add);

router.put('/details', checkToken, checkUserIsActive, details.update);

router.delete('/details/:orderSaleDetailId', checkToken, checkUserIsActive, details.remove);

router.post('/testing-bulk/testv1', bulkInsertAfterNormalInsert);

export default router;
