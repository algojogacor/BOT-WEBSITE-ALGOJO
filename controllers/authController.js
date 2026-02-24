// ============================================================
//  controllers/authController.js
// ============================================================

const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../config/database');
const { createDefaultUserData } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

/**
 * POST /api/auth/register
 * Daftar akun web baru. Bisa juga link ke akun WA lama.
 */
async function register(req, res) {
    try {
        const { username, password, waId } = req.body;
        const webUsers = db.getWebUsers();

        if (webUsers[username]) {
            return res.status(409).json({ success: false, message: 'Username sudah dipakai.' });
        }

        const hash = await bcrypt.hash(password, 12);

        // Cek apakah ini developer pertama (dari env)
        const devIds    = (process.env.DEVELOPER_IDS || '').split(',').map(s => s.trim());
        const isDev     = waId && devIds.includes(waId);
        const role      = isDev ? ROLES.DEVELOPER : ROLES.USER;

        // Buat web user entry
        const webUser = db.getOrCreateWebUser(username);
        webUser.passwordHash = hash;
        webUser.role         = role;
        webUser.waId         = waId || null;

        // Jika ada waId, cek apakah data lama ada
        const waData = waId ? db.getUsers()[waId] : null;
        if (!waData) {
            // Buat data ekonomi baru untuk user ini
            const data = db.getData();
            if (!data.webGameData) data.webGameData = {};
            data.webGameData[username] = createDefaultUserData(username);
        }

        await db.saveData();

        const token = signToken(username, role);
        res.status(201).json({
            success: true,
            message: waData
                ? `✅ Akun berhasil dibuat & terhubung ke data WA lama! (${Object.keys(waData).length > 0 ? 'Data ditemukan' : 'Data kosong'})`
                : '✅ Akun baru berhasil dibuat.',
            token,
            user: { username, role, hasWaData: !!waData }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ success: false, message: 'Gagal mendaftar.' });
    }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { username, password } = req.body;
        const webUsers = db.getWebUsers();
        const user     = webUsers[username];

        if (!user || !user.passwordHash) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) {
            return res.status(401).json({ success: false, message: 'Username atau password salah.' });
        }

        // Cek ban
        if (user.banned) {
            const now = Date.now();
            if (!user.bannedUntil || now < user.bannedUntil) {
                const until = user.bannedUntil
                    ? new Date(user.bannedUntil).toLocaleString('id-ID')
                    : 'Permanen';
                return res.status(403).json({
                    success: false,
                    message: `Akun Anda di-banned hingga ${until}. Alasan: ${user.bannedReason || '-'}`
                });
            }
            // Auto-unban
            user.banned = false; user.bannedUntil = null;
            await db.saveData();
        }

        const token = signToken(username, user.role);
        res.json({
            success: true,
            message: '✅ Login berhasil!',
            token,
            user: { username, role: user.role, waId: user.waId }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Gagal login.' });
    }
}

/**
 * POST /api/auth/link-wa
 * Hubungkan akun web ke data WA bot lama
 */
async function linkWa(req, res) {
    try {
        const { waId } = req.body;
        const { username } = req.user;

        if (!waId) {
            return res.status(400).json({ success: false, message: 'waId wajib diisi.' });
        }

        const webUsers = db.getWebUsers();
        const user     = webUsers[username];

        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

        // Cek apakah waId sudah dipakai user lain
        for (const [u, data] of Object.entries(webUsers)) {
            if (u !== username && data.waId === waId) {
                return res.status(409).json({ success: false, message: 'Nomor WA ini sudah dipakai akun lain.' });
            }
        }

        const waData = db.getUsers()[waId];
        user.waId    = waId;
        await db.saveData();

        res.json({
            success: true,
            message: waData ? '✅ Berhasil terhubung! Data WA lama ditemukan.' : '⚠️ Terhubung, tapi data WA tidak ditemukan di database.',
            hasWaData: !!waData,
        });
    } catch (err) {
        console.error('Link WA error:', err);
        res.status(500).json({ success: false, message: 'Gagal link akun WA.' });
    }
}

/**
 * GET /api/auth/me
 * Ambil profil user yang sedang login
 */
async function getMe(req, res) {
    try {
        const { username } = req.user;
        const webUsers = db.getWebUsers();
        const user     = webUsers[username];

        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

        res.json({
            success: true,
            user: {
                username,
                role:    user.role,
                waId:    user.waId,
                createdAt: user.createdAt,
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal ambil profil.' });
    }
}

// Helper
function signToken(username, role) {
    return jwt.sign({ username, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
}

module.exports = { register, login, linkWa, getMe };
