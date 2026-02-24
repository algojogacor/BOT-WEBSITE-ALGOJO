// ============================================================
//  middleware/rateLimiter.js — Anti Brute Force & DDoS
// ============================================================

const rateLimit = require('express-rate-limit');

// Limiter global: semua endpoint
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 menit
    max: 300,                   // Maks 300 request per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Terlalu banyak request. Coba lagi dalam 15 menit.' }
});

// Limiter ketat untuk login — anti brute-force
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 menit
    max: 10,                    // Maks 10 percobaan login
    skipSuccessfulRequests: true,
    message: { success: false, message: 'Terlalu banyak percobaan login. Tunggu 15 menit.' }
});

// Limiter untuk game/ekonomi (mencegah abuse otomatis)
const gameLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 menit
    max: 30,                    // Maks 30 action game per menit
    message: { success: false, message: 'Slow down! Maks 30 action game per menit.' }
});

// Limiter untuk API eksternal (AI, TTS, dll)
const externalApiLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 menit
    max: 10,                    // Maks 10 panggilan API mahal per menit
    message: { success: false, message: 'Terlalu banyak request API. Tunggu sebentar.' }
});

module.exports = { globalLimiter, authLimiter, gameLimiter, externalApiLimiter };
