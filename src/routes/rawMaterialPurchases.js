import { Router } from 'express';
const router = Router();

import controller from '../controllers/rawMaterialPurchases.js';
import middleware from '../middlewares/middleware.js';

const { find, findResume, findRecents, findById, add, update, remove, details } = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);
router.get('/resume', checkToken, checkUserIsActive, findResume);
router.get('/recents', checkToken, checkUserIsActive, findRecents);
router.get('/:rawMaterialPurchaseId', checkToken, checkUserIsActive, findById);

router.post('/', checkToken, checkUserIsActive, add);

router.put('/', checkToken, checkUserIsActive, update);

router.delete('/:rawMaterialPurchaseId', checkToken, checkUserIsActive, remove);

// PRODUCT DETAILS

router.get('/details/:rawMaterialPurchaseId', checkToken, checkUserIsActive, details.findByRawMaterialPurchaseId);

router.post('/details', checkToken, checkUserIsActive, details.add);

router.put('/details', checkToken, checkUserIsActive, details.update);

router.delete('/details/:rawMaterialPurchaseDetailId', checkToken, checkUserIsActive, details.remove);

export default router;
