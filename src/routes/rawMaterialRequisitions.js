import { Router } from 'express';
const router = Router();

import controller from '../controllers/rawMaterialRequisitions.js';
import middleware from '../middlewares/middleware.js';

const { 
  find, 
  findRecents, 
  findById, 
  findByLocationCurrentActiveShiftcut, 
  findByRangeDate, 
  findByLocationRangeDate, 
  add, 
  update, 
  remove, 
  details 
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/', checkToken, checkUserIsActive, find);
router.get('/recents', checkToken, checkUserIsActive, findRecents);
router.get('/:rawMaterialRequisitionId', checkToken, checkUserIsActive, findById);
router.get('/active-shiftcut/location/:locationId', checkToken, checkUserIsActive, findByLocationCurrentActiveShiftcut);
router.get('/by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findByRangeDate);
router.get('/by-location/:locationId/by-range-date/:initialDate/:finalDate', checkToken, checkUserIsActive, findByLocationRangeDate);

router.post('/', checkToken, checkUserIsActive, add);

router.put('/', checkToken, checkUserIsActive, update);

router.delete('/:rawMaterialRequisitionId', checkToken, checkUserIsActive, remove);

// PRODUCT DETAILS

router.get('/details/:rawMaterialRequisitionId', checkToken, checkUserIsActive, details.findByRawMaterialRequisitionId);

router.post('/details', checkToken, checkUserIsActive, details.add);

router.put('/details', checkToken, checkUserIsActive, details.update);

router.delete('/details/:rawMaterialRequisitionDetailId', checkToken, checkUserIsActive, details.remove);

export default router;
