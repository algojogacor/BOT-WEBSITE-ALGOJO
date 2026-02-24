// ============================================================
//  middleware/auth.js — Verifikasi JWT Token
// ============================================================

const jwt        = require('jsonwebtoken');
const { getWebUsers } = require('../config/database');

/**
 * Middleware: Wajib login (bearer token)
 */
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
        }

        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Cek user masih ada dan tidak di-ban
        const webUsers = getWebUsers();
        const user     = webUsers[decoded.username];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Akun tidak ditemukan.' });
        }

        if (user.banned) {
            const now = Date.now();
            if (!user.bannedUntil || now < user.bannedUntil) {
                const until = user.bannedUntil
                    ? new Date(user.bannedUntil).toLocaleString('id-ID')
                    : 'Permanen';
                return res.status(403).json({
                    success: false,
                    message: `Akun Anda telah di-banned hingga: ${until}. Alasan: ${user.bannedReason || '-'}`
                });
            } else {
                // Ban sudah kedaluwarsa — unban otomatis
                user.banned      = false;
                user.bannedUntil = null;
            }
        }

        req.user = { ...decoded, role: user.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Sesi habis. Silakan login ulang.' });
        }
        return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
}

/**
 * Middleware: Hanya untuk Admin atau Developer
 */
function requireAdmin(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Belum login.' });
    if (!['admin', 'developer'].includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Butuh role Admin.' });
    }
    next();
}

/**
 * Middleware: Hanya Developer (role tertinggi)
 */
function requireDeveloper(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, message: 'Belum login.' });
    if (req.user.role !== 'developer') {
        return res.status(403).json({ success: false, message: 'Akses ditolak: Butuh role Developer.' });
    }
    next();
}

module.exports = { requireAuth, requireAdmin, requireDeveloper };
