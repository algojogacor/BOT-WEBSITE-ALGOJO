// routes/user.js
const router = require('express').Router();
const ctrl   = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/profile',     requireAuth,  ctrl.getProfile);
router.get('/leaderboard', ctrl.getLeaderboard);    // Publik
router.get('/list',        requireAuth, requireAdmin, ctrl.getAllUsers);

module.exports = router;
