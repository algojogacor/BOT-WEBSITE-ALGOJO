// controllers/features/miningController.js
const db = require('../../config/database');
const { getUserGameData } = require('../userController');
const { fmt } = require('../../utils/helpers');
const { MINING_RIGS, MINING_INCOME_PER_HASH_PER_HOUR } = require('../../utils/constants');

async function saveU(username, u, source) {
    const data = db.getData();
    if (source === 'wa') { const waId = db.getWebUsers()[username]?.waId; if (waId) data.users[waId] = u; }
    else { if (!data.webGameData) data.webGameData = {}; data.webGameData[username] = u; }
    await db.saveData(data);
}

async function getStatus(req, res) {
    const { username } = req.user;
    const { data: u }  = getUserGameData(username);
    const rigs   = u.rigs || [];
    let totalHash = 0;
    rigs.forEach(r => { totalHash += MINING_RIGS[r]?.hashrate || 0; });
    const hourlyIncome = totalHash * MINING_INCOME_PER_HASH_PER_HOUR;
    const balance = Math.floor(u.balance || 0);
    res.json({ success: true, rigs, totalHash, hourlyIncome, lastCollect: u.lastMineCollect || 0, balance });
}

async function beliRig(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const { rig } = req.body;
    const rigData = MINING_RIGS[rig];
    if (!rigData) return res.status(400).json({ success: false, message: `❌ Rig tidak valid. Pilih: ${Object.keys(MINING_RIGS).join(', ')}` });
    if ((u.balance || 0) < rigData.price) return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(rigData.price)}.` });
    if (!u.rigs) u.rigs = [];
    u.balance -= rigData.price;
    u.rigs.push(rig);
    await saveU(username, u, source);
    res.json({ success: true, message: `⛏️ Rig ${rig} dibeli! Hashrate: ${rigData.hashrate} MH/s` });
}

async function collectIncome(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    if (!u.rigs?.length) return res.status(400).json({ success: false, message: '❌ Tidak punya rig.' });
    const now  = Date.now();
    const last = u.lastMineCollect || u.createdAt || now;
    const hrs  = (now - last) / 3600_000;
    if (hrs < 0.1) return res.status(400).json({ success: false, message: '⏳ Tunggu minimal 6 menit.' });
    let totalHash = 0;
    u.rigs.forEach(r => { totalHash += MINING_RIGS[r]?.hashrate || 0; });
    const income = Math.floor(totalHash * MINING_INCOME_PER_HASH_PER_HOUR * hrs);
    u.balance = (u.balance || 0) + income;
    u.lastMineCollect = now;
    await saveU(username, u, source);
    res.json({ success: true, message: `⛏️ Mining income: +Rp${fmt(income)} (${hrs.toFixed(1)} jam)`, income });
}

module.exports = { getStatus, beliRig, collectIncome };
