import { Router } from 'express';
const router = Router();

import controller from '../controllers/authorizations.js';
import middleware from '../middlewares/middleware.js';

const { authLogin, authUserPassword, authUserPINCode, successVerification, testingmongo, testingmongopost } = controller;

const { checkToken } = middleware;

router.get('/testingmongo', testingmongo);

router.post('/', authLogin);
router.post('/testingmongopost', testingmongopost);
router.post('/authpassword', authUserPassword);
router.post('/authuserpincode', authUserPINCode);
router.post('/checktoken', checkToken, successVerification);

export default router;
