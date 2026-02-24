// ============================================================
//  routes/index.js — Agregator semua route
//  Tambahkan route baru di sini agar terdaftar ke server
// ============================================================

const router = require('express').Router();

router.use('/auth',    require('./auth'));
router.use('/user',    require('./user'));
router.use('/economy', require('./economy'));
router.use('/chat',    require('./chat'));
router.use('/admin',   require('./admin'));
router.use('/features',require('./features'));

// Health check
router.get('/health', (req, res) => res.json({ success: true, status: 'ok', ts: Date.now() }));

module.exports = router;
