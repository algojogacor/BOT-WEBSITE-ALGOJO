// ============================================================
//  controllers/economyController.js
//  Semua fitur ekonomi: daily, casino, slot, rob, transfer, bank, toko
// ============================================================

const db  = require('../config/database');
const { getUserGameData } = require('./userController');
const { parseBet, fmt, randInt, isSleeping, isDead } = require('../utils/helpers');
const { ECONOMY, JOBS } = require('../utils/constants');

// Helper: simpan perubahan data user
async function saveUser(username, userData, source) {
    const data = db.getData();
    if (source === 'wa') {
        const webUsers = db.getWebUsers();
        const waId     = webUsers[username]?.waId;
        if (waId) data.users[waId] = userData;
    } else {
        if (!data.webGameData) data.webGameData = {};
        data.webGameData[username] = userData;
    }
    await db.saveData(data);
}

// Helper: guard — cegah action kalau mati atau tidur
function lifeGuard(u) {
    if (isDead(u))     return '💀 Kamu mati! Gunakan /rs untuk revive.';
    if (isSleeping(u)) return '😴 Kamu sedang tidur. Gunakan /bangun terlebih dahulu.';
    return null;
}

// ─────────────────────────────────────────────────────────────
//  SALDO & HARIAN
// ─────────────────────────────────────────────────────────────

async function getBalance(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    res.json({
        success: true,
        balance: Math.floor(u.balance || 0),
        bank:    Math.floor(u.bank    || 0),
    });
}

async function claimDaily(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const now = Date.now();

    const guard = lifeGuard(u);
    if (guard) return res.status(400).json({ success: false, message: guard });

    if (u.lastDaily && now - u.lastDaily < ECONOMY.DAILY_COOLDOWN_MS) {
        const sisa = ECONOMY.DAILY_COOLDOWN_MS - (now - u.lastDaily);
        const jam  = Math.floor(sisa / 3600_000);
        const mnt  = Math.floor((sisa % 3600_000) / 60_000);
        return res.status(400).json({ success: false, message: `⏳ Tunggu ${jam} jam ${mnt} menit lagi.` });
    }

    u.balance    = (u.balance || 0) + ECONOMY.DAILY_REWARD;
    u.lastDaily  = now;
    u.dailyIncome = (u.dailyIncome || 0) + ECONOMY.DAILY_REWARD;
    await saveUser(username, u, source);

    res.json({ success: true, message: `🎁 Daily claim! +💰${fmt(ECONOMY.DAILY_REWARD)} koin`, balance: Math.floor(u.balance) });
}

// ─────────────────────────────────────────────────────────────
//  BANK
// ─────────────────────────────────────────────────────────────

async function deposit(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const amount = parseBet(req.body.amount, u.balance);

    if (!amount || amount < 1)            return res.status(400).json({ success: false, message: '❌ Jumlah tidak valid.' });
    if ((u.balance || 0) < amount)        return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    u.balance = (u.balance || 0) - amount;
    u.bank    = (u.bank    || 0) + amount;
    await saveUser(username, u, source);

    res.json({ success: true, message: `🏦 Deposit Rp${fmt(amount)} berhasil.`, balance: Math.floor(u.balance), bank: Math.floor(u.bank) });
}

async function withdraw(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const amount = parseBet(req.body.amount, u.bank);

    if (!amount || amount < 1)        return res.status(400).json({ success: false, message: '❌ Jumlah tidak valid.' });
    if ((u.bank || 0) < amount)       return res.status(400).json({ success: false, message: '❌ Saldo bank tidak cukup.' });

    u.bank    = (u.bank    || 0) - amount;
    u.balance = (u.balance || 0) + amount;
    await saveUser(username, u, source);

    res.json({ success: true, message: `💸 Tarik Rp${fmt(amount)} berhasil.`, balance: Math.floor(u.balance), bank: Math.floor(u.bank) });
}

async function transfer(req, res) {
    const { username } = req.user;
    const { target, amount: rawAmount } = req.body;
    const { source, data: u } = getUserGameData(username);
    const amount = parseBet(rawAmount, u.balance);

    if (!amount || amount < 1)  return res.status(400).json({ success: false, message: '❌ Jumlah tidak valid.' });
    if (target === username)     return res.status(400).json({ success: false, message: '❌ Tidak bisa transfer ke diri sendiri.' });
    if ((u.balance || 0) < amount) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    // Cek limit harian
    const now = Date.now();
    if (!u.lastTransferReset || now - u.lastTransferReset > 86400_000) {
        u.dailyTransferred = 0; u.lastTransferReset = now;
    }
    if ((u.dailyTransferred || 0) + amount > ECONOMY.TRANSFER_DAILY_LIMIT) {
        return res.status(400).json({ success: false, message: `❌ Limit transfer harian Rp${fmt(ECONOMY.TRANSFER_DAILY_LIMIT)}/hari terlampaui.` });
    }

    // Ambil data target
    const { source: tSrc, data: tData } = getUserGameData(target);
    if (!tData) return res.status(404).json({ success: false, message: '❌ User target tidak ditemukan.' });

    u.balance          -= amount;
    u.dailyTransferred  = (u.dailyTransferred || 0) + amount;
    tData.balance       = (tData.balance || 0) + amount;

    await saveUser(username, u, source);
    await saveUser(target, tData, tSrc);

    res.json({ success: true, message: `💳 Transfer Rp${fmt(amount)} ke @${target} berhasil.`, balance: Math.floor(u.balance) });
}

// ─────────────────────────────────────────────────────────────
//  GAMES EKONOMI
// ─────────────────────────────────────────────────────────────

async function casino(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const guard = lifeGuard(u);
    if (guard) return res.status(400).json({ success: false, message: guard });

    const bet = parseBet(req.body.amount, u.balance);
    if (!bet)                        return res.status(400).json({ success: false, message: '❌ Jumlah taruhan tidak valid.' });
    if ((u.balance || 0) < bet)      return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    const data = db.getData();
    const now  = Date.now();
    let winThreshold = ECONOMY.CASINO_WIN_RATE;
    let eventNote    = '';

    if (data.settings?.winrateGila && now < (data.settings?.winrateGilaUntil || 0)) {
        winThreshold = 1 - ECONOMY.CASINO_EVENT_WIN_RATE;
        eventNote    = ' 🎉 EVENT WINRATE GILA AKTIF!';
    } else if (u.buffs?.gacha?.active && now < u.buffs.gacha.until) {
        winThreshold = 0.50;
        eventNote    = ' 🍀 Gacha Charm aktif!';
    }

    const menang = Math.random() > winThreshold;
    if (menang) {
        u.balance += bet;
        await saveUser(username, u, source);
        return res.json({ success: true, result: 'win', message: `🎉 MENANG! +Rp${fmt(bet)}${eventNote}`, balance: Math.floor(u.balance) });
    } else {
        u.balance -= bet;
        await saveUser(username, u, source);
        return res.json({ success: true, result: 'lose', message: `😢 KALAH! -Rp${fmt(bet)}${eventNote}`, balance: Math.floor(u.balance) });
    }
}

async function slot(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const guard = lifeGuard(u);
    if (guard) return res.status(400).json({ success: false, message: guard });

    const bet = parseBet(req.body.amount, u.balance);
    if (!bet)                   return res.status(400).json({ success: false, message: '❌ Jumlah taruhan tidak valid.' });
    if ((u.balance || 0) < bet) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    const symbols  = ['🍋', '🍒', '⭐', '💎', '7️⃣', '🍉', 'BAR'];
    const reels    = [0, 1, 2].map(() => symbols[randInt(0, symbols.length - 1)]);
    const isTriple = reels[0] === reels[1] && reels[1] === reels[2];
    const isDouble = reels[0] === reels[1] || reels[1] === reels[2];

    let multiplier = 0;
    let message    = '';
    if (isTriple) {
        multiplier = reels[0] === '7️⃣' ? 10 : reels[0] === '💎' ? 7 : 3;
        message    = `🎰 JACKPOT! ${reels.join('')} x${multiplier}!`;
    } else if (isDouble) {
        multiplier = 0; // Hanya kembali modal (rounding)
        message    = `🎰 Double! ${reels.join('')}`;
    } else {
        message = `🎰 Gagal. ${reels.join('')}`;
    }

    const profit = isTriple ? bet * multiplier - bet : isDouble ? 0 : -bet;
    u.balance = (u.balance || 0) + profit;
    await saveUser(username, u, source);

    res.json({ success: true, reels, message, profit, balance: Math.floor(u.balance) });
}

async function roulette(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const guard = lifeGuard(u);
    if (guard) return res.status(400).json({ success: false, message: guard });

    const { bet: betType, amount: rawAmount } = req.body;
    // betType: 'red', 'black', 'green', atau angka 0-36
    const amount = parseBet(rawAmount, u.balance);
    if (!amount)                  return res.status(400).json({ success: false, message: '❌ Jumlah taruhan tidak valid.' });
    if ((u.balance || 0) < amount) return res.status(400).json({ success: false, message: '❌ Saldo tidak cukup.' });

    const spin    = randInt(0, 36);
    const redNums = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    const color   = spin === 0 ? 'green' : redNums.includes(spin) ? 'red' : 'black';

    let win = false;
    let multiplier = 0;

    if (['red','black','green'].includes(betType)) {
        win = betType === color;
        multiplier = betType === 'green' ? 35 : 1;
    } else if (!isNaN(parseInt(betType))) {
        win = parseInt(betType) === spin;
        multiplier = 35;
    } else {
        return res.status(400).json({ success: false, message: '❌ Jenis bet tidak valid. Gunakan: red/black/green atau angka 0-36.' });
    }

    const profit = win ? amount * multiplier : -amount;
    u.balance = (u.balance || 0) + profit;
    await saveUser(username, u, source);

    res.json({
        success: true,
        spin, color,
        win, profit,
        message: win ? `🎡 MENANG! Bola jatuh di ${spin} (${color}) +Rp${fmt(amount * multiplier)}` : `🎡 Kalah. Bola jatuh di ${spin} (${color}).`,
        balance: Math.floor(u.balance)
    });
}

// ─────────────────────────────────────────────────────────────
//  SURVIVAL (MAKAN, TIDUR, BANGUN, REVIVE)
// ─────────────────────────────────────────────────────────────

async function makan(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    if (isDead(u)) return res.status(400).json({ success: false, message: '💀 Kamu mati! Pakai /revive.' });
    if ((u.balance || 0) < ECONOMY.MAKAN_COST)
        return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(ECONOMY.MAKAN_COST)} untuk makan.` });

    u.balance  = (u.balance || 0) - ECONOMY.MAKAN_COST;
    u.hunger   = 100;
    u.hp       = Math.min(100, (u.hp || 0) + ECONOMY.MAKAN_HP_RESTORE);
    await saveUser(username, u, source);

    res.json({ success: true, message: `🍗 Makan enak! Lapar → 100%, HP +${ECONOMY.MAKAN_HP_RESTORE}%`, hp: u.hp, hunger: u.hunger, balance: Math.floor(u.balance) });
}

async function tidur(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const jam = parseInt(req.body.hours) || 8;

    if (isDead(u))    return res.status(400).json({ success: false, message: '💀 Kamu mati! Pakai /revive.' });
    if (isSleeping(u))return res.status(400).json({ success: false, message: '😴 Kamu sudah tidur.' });
    if (jam < 1 || jam > 10) return res.status(400).json({ success: false, message: '❌ Tidur 1-10 jam.' });

    u.sleeping  = true;
    u.sleepUntil= Date.now() + jam * 3600_000;
    await saveUser(username, u, source);

    res.json({ success: true, message: `😴 Tidur ${jam} jam. Energi akan terisi saat bangun!`, sleepUntil: u.sleepUntil });
}

async function bangun(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    if (!isSleeping(u)) return res.status(400).json({ success: false, message: '⚡ Kamu tidak sedang tidur.' });

    u.sleeping  = false;
    u.sleepUntil= null;
    u.energy    = Math.min(100, (u.energy || 0) + 60); // Simulasi regen
    await saveUser(username, u, source);

    res.json({ success: true, message: '☀️ Kamu bangun! Energi terisi.', energy: u.energy });
}

async function revive(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    const isFree = (u.balance || 0) < ECONOMY.REVIVE_FREE_BALANCE;
    if (!isFree && (u.balance || 0) < ECONOMY.RS_COST) {
        return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(ECONOMY.RS_COST)} untuk berobat (atau saldo < Rp${fmt(ECONOMY.REVIVE_FREE_BALANCE)} → gratis BPJS).` });
    }

    if (!isFree) u.balance = (u.balance || 0) - ECONOMY.RS_COST;
    u.hp     = 100;
    u.hunger = 100;
    u.energy = 100;
    u.dead   = false;
    u.sleeping = false;
    await saveUser(username, u, source);

    res.json({
        success: true,
        message: isFree ? '🏥 Gratis BPJS! HP, Lapar, Energi pulih.' : `🏥 Bayar Rp${fmt(ECONOMY.RS_COST)}. HP, Lapar, Energi pulih.`,
        hp: 100, hunger: 100, energy: 100, balance: Math.floor(u.balance)
    });
}

// ─────────────────────────────────────────────────────────────
//  KERJA
// ─────────────────────────────────────────────────────────────

async function kerja(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const guard = lifeGuard(u);
    if (guard) return res.status(400).json({ success: false, message: guard });
    if (!u.job) return res.status(400).json({ success: false, message: '❌ Kamu belum punya pekerjaan. Gunakan /lamar.' });

    const job = JOBS[u.job];
    const now = Date.now();
    const cd  = job.cooldown * 60_000;

    if (u.lastWork && now - u.lastWork < cd) {
        const sisa = cd - (now - u.lastWork);
        const jam  = Math.floor(sisa / 3600_000);
        const mnt  = Math.floor((sisa % 3600_000) / 60_000);
        return res.status(400).json({ success: false, message: `⏳ Tunggu ${jam > 0 ? jam + ' jam ' : ''}${mnt} menit lagi.` });
    }

    u.balance   = (u.balance || 0) + job.salary;
    u.lastWork  = now;
    u.xp        = (u.xp || 0) + 50;
    await saveUser(username, u, source);

    res.json({ success: true, message: `💼 Gaji diterima! +Rp${fmt(job.salary)} dari pekerjaan ${job.role}`, balance: Math.floor(u.balance) });
}

async function lamarJob(req, res) {
    const { username } = req.user;
    const { jobName }  = req.body;
    const { source, data: u } = getUserGameData(username);

    const job = JOBS[jobName];
    if (!job) return res.status(400).json({ success: false, message: `❌ Pekerjaan '${jobName}' tidak ada. Pilih: ${Object.keys(JOBS).join(', ')}` });
    if (u.job === jobName) return res.status(400).json({ success: false, message: `❌ Kamu sudah bekerja sebagai ${job.role}.` });
    if ((u.balance || 0) < job.cost)
        return res.status(400).json({ success: false, message: `❌ Butuh modal Rp${fmt(job.cost)} untuk melamar.` });

    u.balance -= job.cost;
    u.job      = jobName;
    await saveUser(username, u, source);

    res.json({ success: true, message: `🎉 Selamat! Kamu sekarang bekerja sebagai ${job.role}`, job: jobName, balance: Math.floor(u.balance) });
}

async function resignJob(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);

    if (!u.job) return res.status(400).json({ success: false, message: '❌ Kamu tidak punya pekerjaan.' });

    const oldJob = u.job;
    u.job     = null;
    u.lastWork= 0;
    await saveUser(username, u, source);

    res.json({ success: true, message: `👋 Kamu resign dari pekerjaan ${JOBS[oldJob]?.role || oldJob}.` });
}

module.exports = {
    getBalance, claimDaily,
    deposit, withdraw, transfer,
    casino, slot, roulette,
    makan, tidur, bangun, revive,
    kerja, lamarJob, resignJob,
};
