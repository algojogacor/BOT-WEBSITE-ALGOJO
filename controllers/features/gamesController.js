// ============================================================
//  controllers/features/gamesController.js
//  Casino, Roulette, Slot Machine
// ============================================================

const db  = require('../../config/database');
const { getUserGameData } = require('../userController');
const { fmt } = require('../../utils/helpers');
const { ECONOMY, ROULETTE_NUMBERS } = require('../../utils/constants');

const REDS  = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACKS= [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

// ── Helper: save user data ────────────────────────────────────
async function saveU(username, u, source) {
    const data = db.getData();
    if (source === 'wa') {
        const waId = db.getWebUsers()[username]?.waId;
        if (waId) data.users[waId] = u;
    } else {
        if (!data.webGameData) data.webGameData = {};
        data.webGameData[username] = u;
    }
    await db.saveData(data);
}

// ── Helper: parse bet ─────────────────────────────────────────
function parseBet(raw, balance) {
    if (!raw) return null;
    if (String(raw).toLowerCase() === 'all') return Math.floor(balance);
    const v = parseInt(raw);
    return isNaN(v) || v < 1000 ? null : v;
}

// ── GET /games/status ─────────────────────────────────────────
async function getStatus(req, res) {
    const { username } = req.user;
    const { data: u }  = getUserGameData(username);
    res.json({
        success: true,
        balance: u.balance || 0,
        gamesStats: u.gamesStats || { wins: 0, losses: 0, totalWon: 0, totalLost: 0 },
    });
}

// ── POST /games/casino ────────────────────────────────────────
// body: { bet: number }
async function casino(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const bet = parseBet(req.body.bet, u.balance || 0);
    if (!bet) return res.status(400).json({ success: false, message: '❌ Bet minimal Rp1.000.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    if (!u.gamesStats) u.gamesStats = { wins: 0, losses: 0, totalWon: 0, totalLost: 0 };

    const data    = db.getData();
    const event   = data.settings?.winrateGila && Date.now() < data.settings.winrateGilaUntil;
    const charm   = u.buffs?.gacha?.active && Date.now() < (u.buffs.gacha.until || 0);
    let threshold = 1 - ECONOMY.CASINO_WIN_RATE; // 0.65 → 65% chance kalah

    if (event)  threshold = 1 - ECONOMY.CASINO_EVENT_WIN_RATE; // 0.15
    else if (charm) threshold = 0.50;

    const roll  = Math.random();
    const menang= roll > threshold;

    if (menang) {
        u.balance = (u.balance || 0) + bet;
        u.gamesStats.wins++;
        u.gamesStats.totalWon += bet;
        await saveU(username, u, source);
        return res.json({ success: true, won: true, amount: bet, balance: u.balance, message: `🎉 Menang! +Rp${fmt(bet)}` });
    } else {
        u.balance = (u.balance || 0) - bet;
        u.gamesStats.losses++;
        u.gamesStats.totalLost += bet;
        await saveU(username, u, source);
        return res.json({ success: true, won: false, amount: bet, balance: u.balance, message: `💀 Kalah! -Rp${fmt(bet)}` });
    }
}

// ── POST /games/roulette ──────────────────────────────────────
// body: { bet, choice }  choice: merah|hitam|ganjil|genap|0-36
async function roulette(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const bet    = parseBet(req.body.bet, u.balance || 0);
    const choice = String(req.body.choice || '').toLowerCase().trim();

    if (!bet)   return res.status(400).json({ success: false, message: '❌ Bet minimal Rp1.000.' });
    if (!choice) return res.status(400).json({ success: false, message: '❌ Pilih: merah, hitam, ganjil, genap, atau angka 0-36.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    if (!u.gamesStats) u.gamesStats = { wins: 0, losses: 0, totalWon: 0, totalLost: 0 };

    // Spin
    const resultNum = Math.floor(Math.random() * 37); // 0-36
    const resultColor = resultNum === 0 ? 'green' : (REDS.includes(resultNum) ? 'red' : 'black');
    const resultType  = resultNum === 0 ? 'netral' : (resultNum % 2 === 0 ? 'genap' : 'ganjil');

    // Evaluasi
    let multiplier = 0;
    const parsedChoice = parseInt(choice);
    if (!isNaN(parsedChoice) && parsedChoice >= 0 && parsedChoice <= 36) {
        // Tebak angka → x15
        if (parsedChoice === resultNum) multiplier = 15;
    } else if (choice === 'merah' || choice === 'red') {
        if (resultColor === 'red') multiplier = 2;
    } else if (choice === 'hitam' || choice === 'black') {
        if (resultColor === 'black') multiplier = 2;
    } else if (choice === 'ganjil' || choice === 'odd') {
        if (resultType === 'ganjil') multiplier = 2;
    } else if (choice === 'genap' || choice === 'even') {
        if (resultType === 'genap') multiplier = 2;
    } else {
        return res.status(400).json({ success: false, message: '❌ Pilihan tidak valid.' });
    }

    const won = multiplier > 0;
    if (won) {
        const profit = bet * (multiplier - 1);
        u.balance = (u.balance || 0) + profit;
        u.gamesStats.wins++;
        u.gamesStats.totalWon += profit;
        await saveU(username, u, source);
        return res.json({
            success: true, won: true, resultNum, resultColor, resultType,
            amount: profit, balance: u.balance, multiplier,
            message: `🎰 Angka ${resultNum} (${resultColor}) — Menang x${multiplier}! +Rp${fmt(profit)}`
        });
    } else {
        u.balance = (u.balance || 0) - bet;
        u.gamesStats.losses++;
        u.gamesStats.totalLost += bet;
        await saveU(username, u, source);
        return res.json({
            success: true, won: false, resultNum, resultColor, resultType,
            amount: bet, balance: u.balance, multiplier: 0,
            message: `🎰 Angka ${resultNum} (${resultColor}) — Kalah! -Rp${fmt(bet)}`
        });
    }
}

// ── POST /games/slot ──────────────────────────────────────────
// body: { bet }
const SLOT_REELS = ['🍒','🍋','🍊','🍇','💎','7️⃣','BAR','🎰'];
const SLOT_MULTIPLIERS = {
    '💎💎💎': 50,
    '7️⃣7️⃣7️⃣': 30,
    'BARBARBAR': 15,
    '🎰🎰🎰': 10,
    '🍒🍒🍒': 5,
    '🍋🍋🍋': 4,
    '🍊🍊🍊': 4,
    '🍇🍇🍇': 3,
};

async function slot(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const bet = parseBet(req.body.bet, u.balance || 0);
    if (!bet) return res.status(400).json({ success: false, message: '❌ Bet minimal Rp1.000.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    if (!u.gamesStats) u.gamesStats = { wins: 0, losses: 0, totalWon: 0, totalLost: 0 };

    const spin = () => SLOT_REELS[Math.floor(Math.random() * SLOT_REELS.length)];
    const r1 = spin(), r2 = spin(), r3 = spin();

    const combo   = r1 + r2 + r3;
    const textKey = r1 === r2 && r2 === r3 ? `${r1}${r2}${r3}` : null;
    const multi   = textKey ? (SLOT_MULTIPLIERS[textKey] || 2) : 0;

    const won = multi > 0;
    const profit = won ? bet * (multi - 1) : -bet;

    u.balance = (u.balance || 0) + profit;
    if (won) { u.gamesStats.wins++; u.gamesStats.totalWon += profit; }
    else     { u.gamesStats.losses++; u.gamesStats.totalLost += Math.abs(profit); }

    await saveU(username, u, source);
    return res.json({
        success: true, won, reels: [r1, r2, r3], multiplier: multi,
        amount: Math.abs(profit), balance: u.balance,
        message: won
            ? `🎰 ${r1}|${r2}|${r3} — JACKPOT x${multi}! +Rp${fmt(profit)}`
            : `🎰 ${r1}|${r2}|${r3} — Tidak menang. -Rp${fmt(Math.abs(profit))}`
    });
}

// ── POST /games/coinflip ──────────────────────────────────────
// body: { bet, choice: 'heads'|'tails' }
async function coinflip(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const bet    = parseBet(req.body.bet, u.balance || 0);
    const choice = String(req.body.choice || '').toLowerCase();

    if (!bet) return res.status(400).json({ success: false, message: '❌ Bet minimal Rp1.000.' });
    if (!['heads','tails'].includes(choice)) return res.status(400).json({ success: false, message: '❌ Pilih heads atau tails.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    if (!u.gamesStats) u.gamesStats = { wins: 0, losses: 0, totalWon: 0, totalLost: 0 };

    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const won    = result === choice;

    if (won) {
        u.balance = (u.balance || 0) + bet;
        u.gamesStats.wins++;
        u.gamesStats.totalWon += bet;
    } else {
        u.balance = (u.balance || 0) - bet;
        u.gamesStats.losses++;
        u.gamesStats.totalLost += bet;
    }

    await saveU(username, u, source);
    return res.json({
        success: true, won, result, amount: bet, balance: u.balance,
        message: won
            ? `🪙 ${result.toUpperCase()}! Menang! +Rp${fmt(bet)}`
            : `🪙 ${result.toUpperCase()}! Kalah! -Rp${fmt(bet)}`
    });
}

// ── POST /games/dadu ──────────────────────────────────────────
// body: { bet, choice }  choice: 1-6
async function dadu(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const bet = parseBet(req.body.bet, u.balance || 0);
    const choice = parseInt(req.body.choice);

    if (!bet) return res.status(400).json({ success: false, message: '❌ Bet minimal Rp1.000.' });
    if (!Number.isInteger(choice) || choice < 1 || choice > 6) return res.status(400).json({ success: false, message: '❌ Pilih angka dadu 1-6.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    if (!u.gamesStats) u.gamesStats = { wins: 0, losses: 0, totalWon: 0, totalLost: 0 };

    const roll = Math.floor(Math.random() * 6) + 1;
    const won = roll === choice;
    const profit = won ? bet * 2 : -bet; // 3x total return = 2x profit

    u.balance = (u.balance || 0) + profit;
    if (won) { u.gamesStats.wins++; u.gamesStats.totalWon += Math.abs(profit); }
    else { u.gamesStats.losses++; u.gamesStats.totalLost += Math.abs(profit); }

    await saveU(username, u, source);
    return res.json({
        success: true, won, roll, choice, amount: Math.abs(profit), balance: u.balance,
        message: won ? `🎲 Dadu ${roll}! Benar! +Rp${fmt(profit)}` : `🎲 Dadu ${roll}! Salah (tebakan ${choice}). -Rp${fmt(Math.abs(profit))}`
    });
}

// ── POST /games/minigame-reward ────────────────────────────────
// body: { amount } — untuk hadiah tebak angka, memory, math dll
async function minigameReward(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const amount = Math.floor(Number(req.body.amount) || 0);
    if (amount <= 0 || amount > 100_000_000) return res.status(400).json({ success: false, message: '❌ Jumlah reward tidak valid (max Rp100jt).' });
    u.balance = (u.balance || 0) + amount;
    await saveU(username, u, source);
    return res.json({ success: true, balance: u.balance, message: `🎁 Reward +Rp${fmt(amount)}` });
}

module.exports = { getStatus, casino, roulette, slot, coinflip, dadu, minigameReward };
