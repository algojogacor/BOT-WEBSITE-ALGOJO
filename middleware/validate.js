// ============================================================
//  middleware/validate.js — Validasi Input dengan express-validator
// ============================================================

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware handler: jalankan setelah rantai validasi
 */
function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: errors.array()[0].msg,  // Tampilkan error pertama
            errors: errors.array()
        });
    }
    next();
}

// ── Aturan Validasi per Endpoint ─────────────────────────────

const registerRules = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 20 }).withMessage('Username 3-20 karakter.')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, dan underscore.'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password minimal 6 karakter.')
        .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf kapital.')
        .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka.'),
];

const loginRules = [
    body('username').trim().notEmpty().withMessage('Username wajib diisi.'),
    body('password').notEmpty().withMessage('Password wajib diisi.'),
];

const betRules = [
    body('amount')
        .isInt({ min: 1 }).withMessage('Jumlah taruhan minimal 1.')
];

const transferRules = [
    body('target').trim().notEmpty().withMessage('Target user wajib diisi.'),
    body('amount').isInt({ min: 1 }).withMessage('Jumlah transfer minimal 1.'),
];

const adminMoneyRules = [
    body('username').trim().notEmpty().withMessage('Username target wajib diisi.'),
    body('amount').isInt({ min: 1 }).withMessage('Jumlah minimal 1.'),
];

const banRules = [
    body('username').trim().notEmpty().withMessage('Username wajib diisi.'),
    body('duration').optional().isInt({ min: 0 }).withMessage('Durasi ban tidak valid (dalam menit, 0 = permanen).'),
    body('reason').optional().trim().isLength({ max: 200 }).withMessage('Alasan maks 200 karakter.'),
];

const chatMessageRules = [
    body('message')
        .trim()
        .notEmpty().withMessage('Pesan tidak boleh kosong.')
        .isLength({ max: 500 }).withMessage('Pesan maks 500 karakter.'),
];

module.exports = {
    handleValidation,
    registerRules,
    loginRules,
    betRules,
    transferRules,
    adminMoneyRules,
    banRules,
    chatMessageRules,
};
