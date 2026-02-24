const { saveDB } = require('../helpers/database');
const fmt = (num) => Math.floor(Number(num) || 0).toLocaleString('id-ID');

// Penyimpanan sementara tantangan duel (di memori RAM saja)
// Format: { 'id_penantang': { target: 'id_lawan', amount: 1000, time: 123456 } }
const activeDuels = {};

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['duel', 'tantang', 'hitman', 'terima', 'accept', 'tolak', 'deny'];
    if (!validCommands.includes(command)) return;

    const senderId = msg.author || msg.key.remoteJid;
    const now = Date.now();

    // 1. BUAT TANTANGAN (!duel)
    if (command === 'duel' || command === 'tantang') {
        const targetJid = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        let amount = parseInt(args[1]);
        
        // Handle format: !duel 1000 @user
        if (isNaN(amount)) amount = parseInt(args[0]);

        // Validasi
        if (!targetJid) return msg.reply("❌ Tag lawan yang mau diajak duel!\nContoh: `!duel @user 1000000`");
        if (isNaN(amount) || amount < 1000) return msg.reply("❌ Minimal taruhan 💰1.000");
        if (targetJid === senderId) return msg.reply("❌ Gak bisa duel sama diri sendiri (Depresi?)");

        // Cek Saldo Penantang
        if (user.balance < amount) return msg.reply(`❌ Uangmu kurang bos! Saldo: Rp ${user.balance.toLocaleString('id-ID')}`);

        // Cek Saldo Lawan (Harus terdaftar di DB)
        if (!db.users[targetJid]) return msg.reply("❌ Lawan belum main bot ini (Belum terdaftar).");
        if (db.users[targetJid].balance < amount) return msg.reply("❌ Lawan miskin! Uangnya gak cukup buat ladenin taruhanmu.");

        // Cek apakah sudah ada duel aktif
        if (activeDuels[senderId]) return msg.reply("❌ Kamu masih punya tantangan pending. Tunggu diterima/tolak dulu.");

        // Simpan Tantangan
        activeDuels[senderId] = {
            challenger: senderId,
            target: targetJid,
            amount: amount,
            timestamp: now
        };

        return msg.reply(
            `🔫 *TANTANGAN DUEL MAUT!* 🔫\n\n` +
            `💀 Penantang: @${senderId.split('@')[0]}\n` +
            `🎯 Target: @${targetJid.split('@')[0]}\n` +
            `💰 Taruhan: Rp ${amount.toLocaleString('id-ID')}\n\n` +
            `👉 @${targetJid.split('@')[0]}, Ketik \`!terima\` untuk duel, atau \`!tolak\` untuk kabur (cemen).`,
            { mentions: [senderId, targetJid] }
        );
    }

    // 2. TERIMA TANTANGAN (!terima)
    if (command === 'terima' || command === 'accept') {
        // Cari siapa yang menantang user ini
        const challengerId = Object.keys(activeDuels).find(key => activeDuels[key].target === senderId);

        if (!challengerId) return msg.reply("❌ Tidak ada yang menantang kamu saat ini.");

        const duelData = activeDuels[challengerId];
        const challengerUser = db.users[challengerId];
        const amount = duelData.amount;

        // Validasi Ulang Saldo (Takutnya udah dipake pas nunggu)
        if (challengerUser.balance < amount) {
            delete activeDuels[challengerId];
            return msg.reply("❌ Penantang mendadak miskin (Saldonya habis). Duel batal.");
        }
        if (user.balance < amount) {
            return msg.reply("❌ Saldo kamu kurang buat nerima taruhan ini.");
        }

        // --- EKSEKUSI DUEL (RUSSIAN ROULETTE) ---
        // 50:50 Chance
        // Math.random() < 0.5 --> Penantang Menang
        // Math.random() >= 0.5 --> Target (Penerima) Menang
        
        const isChallengerWin = Math.random() < 0.5;
        const tax = Math.floor(amount * 0.1); // Pajak 10% buat Admin/Bot (Biar deflasi)
        const winAmount = amount - tax; // Pemenang dapat uang lawan dikurangi pajak

        // 🎉 EVENT: Duel Berhadiah — bonus koin ekstra untuk pemenang
        const duelBonus = (db.settings?.duelBonus && Date.now() < db.settings.duelBonusUntil)
            ? db.settings.duelBonus : 0;

        let txt = `🔫 *DORRR!!!* Suara tembakan terdengar...\n\n`;

        if (isChallengerWin) {
            // Penantang Menang
            challengerUser.balance += winAmount + duelBonus;
            user.dailyIncome = (user.dailyIncome || 0) + winAmount;
            user.balance -= amount;
            
            txt += `💀 @${senderId.split('@')[0]} rubuh bersimbah darah!\n`;
            txt += `🏆 @${challengerId.split('@')[0]} MENANG!\n\n`;
            txt += `💰 Profit: +Rp ${winAmount.toLocaleString('id-ID')}\n`;
            txt += `💸 Pajak Preman: Rp ${tax.toLocaleString('id-ID')}`;
            if (duelBonus > 0) txt += `\n🎉 *EVENT Duel Berhadiah! +Rp ${fmt(duelBonus)} Bonus!*`;
        } else {
            // Target Menang
            user.balance += winAmount + duelBonus;
            challengerUser.balance -= amount;

            txt += `💀 @${challengerId.split('@')[0]} senjata meledak di tangan!\n`;
            txt += `🏆 @${senderId.split('@')[0]} MENANG!\n\n`;
            txt += `💰 Profit: +Rp ${winAmount.toLocaleString('id-ID')}\n`;
            txt += `💸 Pajak Preman: Rp ${tax.toLocaleString('id-ID')}`;
            if (duelBonus > 0) txt += `\n🎉 *EVENT Duel Berhadiah! +Rp ${fmt(duelBonus)} Bonus!*`;
        }

        // Hapus data duel
        delete activeDuels[challengerId];
        saveDB(db);

        return msg.reply(txt, { mentions: [challengerId, senderId] });
    }

    // 3. TOLAK TANTANGAN (!tolak)
    if (command === 'tolak' || command === 'deny') {
        // Bisa ditolak oleh Target ATAU dibatalkan oleh Penantang sendiri
        const challengerId = Object.keys(activeDuels).find(key => activeDuels[key].target === senderId); // Jika target nolak
        const myChallenge = activeDuels[senderId]; // Jika penantang batalin

        if (challengerId) {
            delete activeDuels[challengerId];
            return msg.reply(`🏳️ @${senderId.split('@')[0]} menolak duel (Cemen!). Tantangan dibatalkan.`);
        } else if (myChallenge) {
            delete activeDuels[senderId];
            return msg.reply(`🏳️ Kamu membatalkan tantangan duel.`);
        } else {
            return msg.reply("❌ Tidak ada duel aktif.");
        }
    }
};
