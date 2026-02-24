// ============================================================
//  controllers/adminController.js
//  Panel Admin & Developer — Fitur manajemen user & sistem
// ============================================================

const bcrypt = require('bcryptjs');
const db     = require('../config/database');
const { getUserGameData } = require('./userController');
const { fmt } = require('../utils/helpers');
const { ROLES } = require('../utils/constants');

// Helper simpan user game data
async function saveUserGame(username, userData, source) {
    const data = db.getData();
    if (source === 'wa') {
        const waId = db.getWebUsers()[username]?.waId;
        if (waId) data.users[waId] = userData;
    } else {
        if (!data.webGameData) data.webGameData = {};
        data.webGameData[username] = userData;
    }
    await db.saveData(data);
}

// ─────────────────────────────────────────────────────────────
//  MANAJEMEN USER
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/ban  — Ban user
 * Body: { username, duration (menit, 0=permanen), reason }
 */
async function banUser(req, res) {
    const { username: target, duration, reason } = req.body;
    const { username: actor, role } = req.user;

    const webUsers = db.getWebUsers();
    if (!webUsers[target]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    // Cegah ban developer oleh non-developer
    if (webUsers[target].role === ROLES.DEVELOPER && role !== ROLES.DEVELOPER) {
        return res.status(403).json({ success: false, message: '❌ Tidak bisa ban Developer.' });
    }
    if (target === actor) return res.status(400).json({ success: false, message: '❌ Tidak bisa ban diri sendiri.' });

    const durationMs = duration > 0 ? duration * 60_000 : null;
    webUsers[target].banned      = true;
    webUsers[target].bannedUntil = durationMs ? Date.now() + durationMs : null;
    webUsers[target].bannedReason= reason || 'Pelanggaran aturan';
    await db.saveData();

    const until = durationMs ? `${duration} menit` : 'Permanen';
    res.json({ success: true, message: `🔨 @${target} di-ban (${until}). Alasan: ${reason || '-'}` });
}

/**
 * POST /api/admin/unban
 */
async function unbanUser(req, res) {
    const { username: target } = req.body;
    const webUsers = db.getWebUsers();

    if (!webUsers[target]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    webUsers[target].banned      = false;
    webUsers[target].bannedUntil = null;
    webUsers[target].bannedReason= null;
    await db.saveData();

    res.json({ success: true, message: `✅ @${target} berhasil di-unban.` });
}

/**
 * POST /api/admin/add-money
 * Body: { username, amount }
 */
async function addMoney(req, res) {
    const { username: target, amount: rawAmount } = req.body;
    const amount = parseInt(rawAmount);

    if (isNaN(amount) || amount < 1) return res.status(400).json({ success: false, message: '❌ Jumlah tidak valid.' });

    const { source, data: u } = getUserGameData(target);
    if (!u) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    u.balance = (u.balance || 0) + amount;
    await saveUserGame(target, u, source);

    res.json({ success: true, message: `💰 +Rp${fmt(amount)} ditambahkan ke @${target}. Saldo baru: Rp${fmt(u.balance)}` });
}

/**
 * POST /api/admin/set-money
 * Body: { username, amount }
 */
async function setMoney(req, res) {
    const { username: target, amount: rawAmount } = req.body;
    const amount = parseInt(rawAmount);

    if (isNaN(amount) || amount < 0) return res.status(400).json({ success: false, message: '❌ Jumlah tidak valid.' });

    const { source, data: u } = getUserGameData(target);
    if (!u) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    u.balance = amount;
    await saveUserGame(target, u, source);

    res.json({ success: true, message: `💳 Saldo @${target} diset ke Rp${fmt(amount)}` });
}

/**
 * POST /api/admin/reset-user
 * Body: { username }
 */
async function resetUser(req, res) {
    const { username: target } = req.body;
    const { role } = req.user;
    const webUsers = db.getWebUsers();

    if (!webUsers[target]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    if (webUsers[target].role === ROLES.DEVELOPER && role !== ROLES.DEVELOPER)
        return res.status(403).json({ success: false, message: '❌ Tidak bisa reset data Developer.' });

    const data = db.getData();
    // Reset game data
    const waId = webUsers[target].waId;
    if (waId && data.users[waId]) {
        // Reset hanya data ekonomi, bukan data akun
        const u = data.users[waId];
        u.balance = 0; u.bank = 0; u.hp = 100; u.hunger = 100; u.energy = 100;
        u.level = 1; u.xp = 0; u.job = null; u.inv = []; u.properties = [];
        u.crops = []; u.animals = []; u.rigs = []; u.stocks = {}; u.crypto = {};
    }
    if (data.webGameData?.[target]) {
        const { createDefaultUserData } = require('../utils/helpers');
        data.webGameData[target] = createDefaultUserData(target);
    }
    await db.saveData(data);

    res.json({ success: true, message: `🔄 Data @${target} berhasil direset.` });
}

// ─────────────────────────────────────────────────────────────
//  PROMOTE / DEMOTE — Hanya Developer
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/promote
 * Body: { username, role: 'admin'|'user' }
 */
async function promoteUser(req, res) {
    const { username: target, role: newRole } = req.body;
    const { username: actor } = req.user;

    if (actor === target) return res.status(400).json({ success: false, message: '❌ Tidak bisa mengubah role diri sendiri.' });

    const webUsers = db.getWebUsers();
    if (!webUsers[target]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const validRoles = [ROLES.ADMIN, ROLES.USER]; // Developer hanya bisa di-assign manual
    if (!validRoles.includes(newRole))
        return res.status(400).json({ success: false, message: `❌ Role valid: ${validRoles.join(', ')}` });

    webUsers[target].role = newRole;
    await db.saveData();

    res.json({ success: true, message: `⬆️ @${target} berhasil di-${newRole === ROLES.ADMIN ? 'promote ke Admin' : 'demote ke User'}.` });
}

// ─────────────────────────────────────────────────────────────
//  EVENT KONTROL
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/event
 * Body: { type: 'winrateGila', duration: (menit), active: boolean }
 */
async function setEvent(req, res) {
    const { type, duration, active } = req.body;
    const data = db.getData();
    if (!data.settings) data.settings = {};

    const validEvents = ['winrateGila', 'doubleXp', 'doubleIncome'];
    if (!validEvents.includes(type))
        return res.status(400).json({ success: false, message: `❌ Event: ${validEvents.join(', ')}` });

    data.settings[type]              = !!active;
    data.settings[`${type}Until`]    = active ? Date.now() + (duration || 30) * 60_000 : 0;
    await db.saveData(data);

    res.json({ success: true, message: `🎉 Event ${type} ${active ? `diaktifkan (${duration || 30} menit)` : 'dinonaktifkan'}.` });
}

/**
 * GET /api/admin/stats — Statistik global
 */
async function getStats(req, res) {
    const data     = db.getData();
    const webUsers = db.getWebUsers();
    const waUsers  = db.getUsers();

    const totalWebUsers = Object.keys(webUsers).length;
    const totalWaUsers  = Object.keys(waUsers).length;
    const adminCount    = Object.values(webUsers).filter(u => u.role === ROLES.ADMIN).length;
    const bannedCount   = Object.values(webUsers).filter(u => u.banned).length;

    let totalMoney = 0;
    for (const u of Object.values(waUsers)) {
        totalMoney += (u.balance || 0) + (u.bank || 0);
    }
    for (const u of Object.values(data.webGameData || {})) {
        totalMoney += (u.balance || 0) + (u.bank || 0);
    }

    res.json({
        success: true,
        stats: {
            totalWebUsers,
            totalWaUsers,
            adminCount,
            bannedCount,
            totalMoney: Math.floor(totalMoney),
            settings: data.settings || {},
        }
    });
}

/**
 * POST /api/admin/set-price
 * Body: { item, price } — Override harga item di market
 */
async function setPrice(req, res) {
    const { item, price } = req.body;
    if (!item || isNaN(price) || price < 0)
        return res.status(400).json({ success: false, message: '❌ Item atau harga tidak valid.' });

    const data = db.getData();
    if (!data.market) data.market = { commodities: {} };
    data.market.commodities[item] = parseInt(price);
    await db.saveData(data);

    res.json({ success: true, message: `💹 Harga '${item}' diset ke Rp${fmt(price)}` });
}

module.exports = { banUser, unbanUser, addMoney, setMoney, resetUser, promoteUser, setEvent, getStats, setPrice };
