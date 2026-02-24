// routes/admin.js
const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { requireAuth, requireAdmin, requireDeveloper } = require('../middleware/auth');
const { adminMoneyRules, banRules, handleValidation } = require('../middleware/validate');

router.use(requireAuth);

// Admin & Developer
router.get ('/stats',       requireAdmin, ctrl.getStats);
router.post('/ban',         requireAdmin, banRules, handleValidation, ctrl.banUser);
router.post('/unban',       requireAdmin, ctrl.unbanUser);
router.post('/add-money',   requireAdmin, adminMoneyRules, handleValidation, ctrl.addMoney);
router.post('/set-money',   requireAdmin, adminMoneyRules, handleValidation, ctrl.setMoney);
router.post('/reset-user',  requireAdmin, ctrl.resetUser);
router.post('/set-price',   requireAdmin, ctrl.setPrice);
router.post('/event',       requireAdmin, ctrl.setEvent);

// Developer saja
router.post('/promote',     requireDeveloper, ctrl.promoteUser);

module.exports = router;
