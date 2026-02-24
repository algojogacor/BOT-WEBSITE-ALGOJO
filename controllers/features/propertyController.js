// controllers/features/propertyController.js
const db = require('../../config/database');
const { getUserGameData } = require('../userController');
const { fmt } = require('../../utils/helpers');
const { PROPERTY_PRICES, PROPERTY_INCOME } = require('../../utils/constants');

async function saveU(username, u, source) {
    const data = db.getData();
    if (source === 'wa') { const waId = db.getWebUsers()[username]?.waId; if (waId) data.users[waId] = u; }
    else { if (!data.webGameData) data.webGameData = {}; data.webGameData[username] = u; }
    await db.saveData(data);
}

async function getStatus(req, res) {
    const { username } = req.user;
    const { data: u }  = getUserGameData(username);
    const properties   = u.properties || [];
    const totalIncome  = properties.reduce((sum, p) => sum + (PROPERTY_INCOME[p] || 0), 0);
    const balance = Math.floor(u.balance || 0);
    res.json({ success: true, properties, totalHourlyIncome: totalIncome, lastCollect: u.lastPropCollect || 0, balance });
}

async function beli(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const { property } = req.body;
    const price = PROPERTY_PRICES[property];
    if (!price) return res.status(400).json({ success: false, message: `❌ Properti tidak valid: ${Object.keys(PROPERTY_PRICES).join(', ')}` });
    if ((u.balance || 0) < price) return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(price)}.` });
    if (!u.properties) u.properties = [];
    if (u.properties.includes(property)) return res.status(400).json({ success: false, message: '❌ Sudah punya properti ini.' });
    u.balance -= price;
    u.properties.push(property);
    await saveU(username, u, source);
    res.json({ success: true, message: `🏢 ${property} dibeli! Income: +Rp${fmt(PROPERTY_INCOME[property])}/jam` });
}

async function collect(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    if (!u.properties?.length) return res.status(400).json({ success: false, message: '❌ Tidak punya properti.' });
    const now  = Date.now();
    const last = u.lastPropCollect || u.createdAt || now;
    const hrs  = (now - last) / 3600_000;
    if (hrs < 0.1) return res.status(400).json({ success: false, message: '⏳ Tunggu minimal 6 menit.' });
    let income = 0;
    u.properties.forEach(p => { income += (PROPERTY_INCOME[p] || 0) * hrs; });
    income = Math.floor(income);
    u.balance = (u.balance || 0) + income;
    u.lastPropCollect = now;
    await saveU(username, u, source);
    res.json({ success: true, message: `🏢 Pendapatan properti: +Rp${fmt(income)} (${hrs.toFixed(1)} jam)`, income });
}

module.exports = { getStatus, beli, collect };
