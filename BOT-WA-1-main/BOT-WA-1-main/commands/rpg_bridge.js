const { saveDB } = require('../helpers/database');
const crypto = require('crypto'); 

// HELPER
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// 🔑 KUNCI RAHASIA (WAJIB SAMA DENGAN DI FILE HTML GAME)
const SECRET_KEY = "SULTAN_OMEGA_SECURE_9999"; 

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['rpg', 'battle', 'claim', 'redeem'];
    if (!validCommands.includes(command)) return;

    const now = Date.now();

    // 1. MEMULAI BATTLE (DENGAN TARUHAN)
    if (command === 'rpg' || command === 'battle') {
        const bet = parseInt(args[0]);

        // Validasi Taruhan
        if (!bet || isNaN(bet)) return msg.reply("❌ Masukkan jumlah taruhan!\nContoh: `!battle 100000`");
        if (bet < 10000) return msg.reply("❌ Minimal taruhan Rp 10.000");
        if (user.balance < bet) return msg.reply("❌ Uangmu kurang bos!");

        // Cek Cooldown (Opsional, bisa dihapus kalau mau bar-bar)
        const CD = 5 * 60 * 1000; // 5 Menit
        if (now - (user.lastBattle || 0) < CD) {
            const sisa = Math.ceil((CD - (now - user.lastBattle)) / 60000);
            return msg.reply(`🔋 *STAMINA LOW!* Istirahat dulu ${sisa} menit.`);
        }

        // POTONG SALDO DI AWAL (Biar kalau kabur/kalah, uang hilang)
        user.balance -= bet;
        
        // Simpan info taruhan user yang sedang berjalan
        user.activeRpgBet = {
            amount: bet,
            timestamp: now
        };
        
        saveDB(db);

        // Link Game (Ganti dengan link game kamu)
        const GAME_LINK = "https://rpgkeren.netlify.app/"; 

        let txt = `⚔️ *NEON WARS: DEATH MATCH* ⚔️\n\n`;
        txt += `💸 Taruhan: Rp ${fmt(bet)}\n`;
        txt += `🔥 Potensi Menang: Rp ${fmt(Math.floor(bet * 1.3))} (+30%)\n\n`;
        txt += `👉 *FIGHT NOW:* \n${GAME_LINK}\n\n`;
        txt += `_Menang? Copy kode Victory dan ketik:_ \n\`!claim <kode>\`\n`;
        txt += `_Kalah/Kabur? Uang taruhan HANGUS!_`;

        return msg.reply(txt);
    }

    // 2. CLAIM REWARD (JIKA MENANG)
    if (command === 'claim' || command === 'redeem') {
        const code = args[0];
        if (!code) return msg.reply("❌ Mana kodenya?");

        // Cek apakah user punya taruhan aktif?
        if (!user.activeRpgBet || !user.activeRpgBet.amount) {
            return msg.reply("❌ Kamu belum pasang taruhan! Ketik `!battle <jumlah>` dulu.");
        }

        // Format Kode: WIN-[TIMESTAMP]-[IGNORE]-[SIGNATURE]
        // (Bagian 'amount' di kode game bisa diabaikan atau diset 0, karena kita pakai data taruhan di DB)
        const parts = code.split('-');
        if (parts.length !== 4 || parts[0] !== 'WIN') return msg.reply("❌ Kode Palsu / Rusak.");

        const timestamp = parseInt(parts[1]);
        const gameAmount = parseInt(parts[2]); // Ini dari game HTML (bisa diset 1 atau berapapun)
        const signature = parts[3];

        // A. Cek Expired (Kode valid 5 menit)
        if (now - timestamp > 5 * 60 * 1000) return msg.reply("❌ Kode Kadaluarsa! Taruhan hangus.");

        // B. Cek Duplikat
        if (user.lastClaimCode === code) return msg.reply("❌ Kode sudah pernah diklaim!");

        // C. VERIFIKASI KEAMANAN
        const checkString = `${timestamp}-${gameAmount}-${SECRET_KEY}`;
        const expectedSig = crypto.createHash('sha256').update(checkString).digest('hex').substring(0, 10).toUpperCase();

        if (signature !== expectedSig) {
            return msg.reply("❌ *CHEATER DETECTED!* Kode tidak valid.");
        }

        // D. HITUNG HADIAH (Taruhan + 30%)
        const modal = user.activeRpgBet.amount;
        const profit = Math.floor(modal * 0.30); // 30% Profit
        const totalWin = modal + profit;

        // Cairkan Dana
        user.balance += totalWin;
        user.dailyIncome = (user.dailyIncome || 0) + totalWin;
        user.xp = (user.xp || 0) + 500;
        
        // Bersihkan data taruhan & Update history
        delete user.activeRpgBet;
        user.lastBattle = now;
        user.lastClaimCode = code;
        
        saveDB(db);

        return msg.reply(`🎉 *VICTORY SECURED!* 🎉\n\n💸 Modal Balik: Rp ${fmt(modal)}\n📈 Profit (30%): Rp ${fmt(profit)}\n💰 *Total Diterima: Rp ${fmt(totalWin)}*\n\n_Siap taruhan lebih besar?_`);
    }
};
