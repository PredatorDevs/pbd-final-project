import { Router } from 'express';
const router = Router();

import controller from '../controllers/generals.js';
import middleware from '../middlewares/middleware.js';

const {
  findBanks,
  findDocumentTypes, 
  findPaymentTypes, 
  findPaymentMethods,
  findDepartments,
  findCities,
  findTaxes,
  findPackageTypes,
  validatePolicyDocNumber
} = controller;

const { checkToken, checkUserIsActive } = middleware;

router.get('/banks', checkToken, checkUserIsActive, findBanks);
router.get('/document-types', checkToken, checkUserIsActive, findDocumentTypes);
router.get('/payment-types', checkToken, checkUserIsActive, findPaymentTypes);
router.get('/payment-methods', checkToken, checkUserIsActive, findPaymentMethods);
router.get('/departments', checkToken, checkUserIsActive, findDepartments);
router.get('/cities', checkToken, checkUserIsActive, findCities);
router.get('/taxes', checkToken, checkUserIsActive, findTaxes);
router.get('/package-types', checkToken, checkUserIsActive, findPackageTypes);

router.post('/policy/validate-docnumber', checkToken, checkUserIsActive, validatePolicyDocNumber);

export default router;
