// routes/economy.js
const router = require('express').Router();
const ctrl   = require('../controllers/economyController');
const { requireAuth } = require('../middleware/auth');
const { gameLimiter } = require('../middleware/rateLimiter');
const { betRules, transferRules, handleValidation } = require('../middleware/validate');

// Semua route membutuhkan login
router.use(requireAuth);

// Saldo & harian
router.get ('/balance',  ctrl.getBalance);
router.post('/daily',    ctrl.claimDaily);

// Bank
router.post('/deposit',  ctrl.deposit);
router.post('/withdraw', ctrl.withdraw);
router.post('/transfer', transferRules, handleValidation, ctrl.transfer);

// Games (pakai gameLimiter anti-spam)
router.post('/casino',   gameLimiter, betRules, handleValidation, ctrl.casino);
router.post('/slot',     gameLimiter, betRules, handleValidation, ctrl.slot);
router.post('/roulette', gameLimiter, ctrl.roulette);

// Survival
router.post('/makan',   ctrl.makan);
router.post('/tidur',   ctrl.tidur);
router.post('/bangun',  ctrl.bangun);
router.post('/revive',  ctrl.revive);

// Pekerjaan
router.post('/kerja',   ctrl.kerja);
router.post('/lamar',   ctrl.lamarJob);
router.post('/resign',  ctrl.resignJob);

module.exports = router;
