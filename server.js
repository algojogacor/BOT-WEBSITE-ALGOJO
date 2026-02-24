// ============================================================
//  server.js — ALGOJO WEB - Entry Point Utama
//  Untuk modifikasi: buka file ini lalu sesuaikan middleware/route
// ============================================================

require('dotenv').config();
const express     = require('express');
const http        = require('http');
const path        = require('path');
const helmet      = require('helmet');
const cors        = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean    = require('xss-clean');

const { connectDB }     = require('./config/database');
const { globalLimiter } = require('./middleware/rateLimiter');
const routes            = require('./routes/index');
const initSocket        = require('./socket/index');
const lifeService       = require('./services/lifeService');

const app    = express();
const server = http.createServer(app);

// ── 1. Security Middleware ────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc:     ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],  // Fix: izinkan onclick="..." di HTML
            styleSrc:   ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc:    ["'self'", "fonts.gstatic.com"],
            imgSrc:     ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
        }
    }
}));
app.use(cors({ origin: process.env.APP_URL || '*', credentials: true }));
app.use(mongoSanitize());   // Cegah NoSQL injection
app.use(xssClean());        // Sanitasi XSS
app.use(globalLimiter);     // Rate limit global

// ── 2. Body Parser ────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── 3. Static Files ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── 4. API Routes ─────────────────────────────────────────────
app.use('/api', routes);

// ── 5. SPA Catch-all (kirim index.html untuk semua route lain) ─
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── 6. Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan server.'
    });
});

// ── 7. Boot ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function boot() {
    try {
        // Koneksi database
        await connectDB();
        console.log('✅ Database terhubung');

        // Inisialisasi Socket.io untuk Live Chat
        initSocket(server);
        console.log('✅ Socket.IO aktif');

        // Mulai cron life system (HP/Lapar/Energi berkurang setiap menit)
        lifeService.startLifeCron();
        console.log('✅ Life System (Cron) berjalan');

        server.listen(PORT, () => {
            console.log(`\n🚀 ALGOJO WEB berjalan di http://localhost:${PORT}`);
            console.log(`   Mode: ${process.env.NODE_ENV || 'development'}\n`);
        });
    } catch (err) {
        console.error('💥 Gagal boot:', err.message);
        process.exit(1);
    }
}

boot();