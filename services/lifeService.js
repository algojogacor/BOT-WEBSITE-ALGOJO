// ============================================================
//  services/lifeService.js
//  Cron: HP / Lapar / Energi berkurang setiap menit
//  Sama persis dengan mekanik WA Bot
// ============================================================

const cron = require('node-cron');
const db   = require('../config/database');
const { LIFE } = require('../utils/constants');

function startLifeCron() {
    // Jalankan setiap 1 menit
    cron.schedule('* * * * *', async () => {
        try {
            const data = db.getData();
            if (data.settings?.matistatus) return; // Admin pause life system

            let changed = false;

            // Proses WA users
            for (const userId in (data.users || {})) {
                if (processUser(data.users[userId])) changed = true;
            }

            // Proses web game data users
            for (const username in (data.webGameData || {})) {
                if (processUser(data.webGameData[username])) changed = true;
            }

            if (changed) await db.saveData(data);
        } catch (err) {
            console.error('Life cron error:', err.message);
        }
    });

    console.log('⏱️  Life cron started (setiap 1 menit)');
}

/**
 * Proses satu user — kembalikan true jika ada perubahan
 */
function processUser(u) {
    if (!u) return false;

    // Skip jika sudah mati
    if ((u.hp || 0) <= 0) return false;

    let changed = false;

    // Jika tidur
    if (u.sleeping && u.sleepUntil) {
        if (Date.now() >= u.sleepUntil) {
            // Bangun otomatis
            u.sleeping  = false;
            u.sleepUntil= null;
            u.energy    = 100;
            changed     = true;
        } else {
            // Saat tidur: energi regen, lapar lebih lambat
            u.energy = Math.min(100, (u.energy || 0) + LIFE.SLEEP_ENERGY_REGEN);
            u.hunger = Math.max(0, (u.hunger || 100) - LIFE.SLEEP_HUNGER_DECAY);
            return true;
        }
    }

    // Penurunan normal
    const prevHunger = u.hunger ?? 100;
    u.hunger  = Math.max(0, (u.hunger  ?? 100) - LIFE.HUNGER_DECAY);
    u.energy  = Math.max(0, (u.energy  ?? 100) - LIFE.ENERGY_DECAY);

    // HP turun HANYA jika lapar = 0
    if (prevHunger <= 0 || u.hunger <= 0) {
        u.hp = Math.max(0, (u.hp ?? 100) - LIFE.HP_DECAY_ON_EMPTY);

        // MATI
        if (u.hp <= 0) {
            u.hp   = 0;
            u.dead = true;
            // Denda 20% saldo dompet
            if ((u.balance || 0) > 0) {
                u.balance = Math.floor(u.balance * (1 - 0.20));
            }
        }
    }

    return true;
}

module.exports = { startLifeCron };
