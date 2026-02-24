const { saveDB } = require('../helpers/database');
const crypto = require('crypto');

// HELPER
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// 🔑 KUNCI RAHASIA (WAJIB SAMA DENGAN DI FILE HTML GAME)
const SECRET_KEY = "ULTRALISK_OMEGA_KEY_2026";

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['slither', 'snake', 'claimslither'];
    if (!validCommands.includes(command)) return;

    const now = Date.now();

    // 1. LINK GAME
    if (command === 'slither' || command === 'snake') {
        const GAME_LINK = "https://papaya-unicorn-f3a5a1.netlify.app/";

        let txt = `🐍 *SLITHER SULTAN.IO* 🐍\n\n`;
        txt += `Mode: *Hardcore Economy*\n`;
        txt += `Kumpulkan receh demi receh untuk modal usaha!\n`;
        txt += `👉 *MAIN SEKARANG:* \n${GAME_LINK}\n\n`;
        txt += `_Game Over? Copy kode dan ketik:_ \n\`!claimslither <kode>\``;

        return msg.reply(txt);
    }

    // 2. CLAIM REWARD
    if (command === 'claimslither') {
        const code = args[0];
        if (!code) return msg.reply("❌ Mana kodenya?");

        // Format: SLIT-[TIMESTAMP]-[SCORE]-[SIGNATURE]
        const parts = code.split('-');
        if (parts.length !== 4 || parts[0] !== 'SLIT') return msg.reply("❌ Kode tidak valid.");

        const timestamp = parseInt(parts[1]);
        const score = parseInt(parts[2]); 
        const signature = parts[3];

        // Validasi Waktu & Replay
        if (now - timestamp > 5 * 60 * 1000) return msg.reply("❌ Kode kadaluarsa (Max 5 menit).");
        if (user.lastSlitherCode === code) return msg.reply("❌ Kode sudah dipakai.");

        // Validasi Anti-Cheat
        const checkString = `${timestamp}-${score}-${SECRET_KEY}`;
        const expectedSig = crypto.createHash('sha256').update(checkString).digest('hex').substring(0, 10).toUpperCase();

        if (signature !== expectedSig) {
            return msg.reply("❌ *CHEATER!* Jangan edit skornya bos.");
        }

        // UPDATE HARGA
        
        // RATE MEDIUM (Standard): Rp 500 per cm
        let basePrice = 500; 
        let tier = "Medium";
        
        // RATE HARD (Jika skor > 100): Rp 1.000 per cm
        if (score > 100) {
            basePrice = 1_000;
            tier = "Hard 🔥";
        }

        let reward = score * basePrice;

        user.balance += reward;
        user.dailyIncome = (user.dailyIncome || 0) + reward;
        user.lastSlitherCode = code;

        saveDB(db);

        return msg.reply(`🐍 *GAME OVER!* 🐍\nPanjang: ${score} cm\nTier: ${tier} (Rp ${fmt(basePrice)}/cm)\n\n💰 *Cair: Rp ${fmt(reward)}*`);
    }
};
