import { Router } from 'express';
const router = Router();

import controller from '../controllers/sales.js';
import middleware from '../middlewares/middleware.js';

const { 
    find, findById, findByLocationCurrentActiveShiftcut, findByMyCashier, findPendings, findPendingsByLocation, findPendingAmountToPay, 
    add, validateDocNumber, voidSale, update, remove, details, payments } = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);

router.get('/byId/:saleId', checkToken, checkUserIsActive, findById);
router.get('/my-cashier/:cashierId', checkToken, checkUserIsActive, findByMyCashier);

router.get('/active-shiftcut/location/:locationId', checkToken, checkUserIsActive, findByLocationCurrentActiveShiftcut);

router.get('/pendings', checkToken, checkUserIsActive, findPendings);
router.get('/pendings/by-location/:locationId', checkToken, checkUserIsActive, findPendingsByLocation);

router.get('/pending-amount-to-pay/:saleId', checkToken, checkUserIsActive, findPendingAmountToPay);

router.post('/', checkToken, checkUserIsActive, add);
router.post('/validate', checkToken, checkUserIsActive, validateDocNumber);
router.post('/void', checkToken, checkUserIsActive, voidSale);

router.put('/', checkToken, checkUserIsActive, update);

router.delete('/:saleId', checkToken, checkUserIsActive, remove);

// SALES DETAILS

router.get('/details/:saleId', checkToken, checkUserIsActive, details.findBySaleId);

router.post('/details', checkToken, checkUserIsActive, details.add);

router.put('/details', checkToken, checkUserIsActive, details.update);

router.delete('/details/:saleDetailId', checkToken, checkUserIsActive, details.remove);

// SALES PAYMENTS

router.post('/payments/new-single-payment', checkToken, checkUserIsActive, payments.add);

export default router;
