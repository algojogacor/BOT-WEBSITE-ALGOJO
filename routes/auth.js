// routes/auth.js
const router  = require('express').Router();
const ctrl    = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { registerRules, loginRules, handleValidation } = require('../middleware/validate');

router.post('/register', authLimiter, registerRules, handleValidation, ctrl.register);
router.post('/login',    authLimiter, loginRules,    handleValidation, ctrl.login);
router.post('/link-wa',  requireAuth, ctrl.linkWa);
router.get('/me',        requireAuth, ctrl.getMe);

module.exports = router;
