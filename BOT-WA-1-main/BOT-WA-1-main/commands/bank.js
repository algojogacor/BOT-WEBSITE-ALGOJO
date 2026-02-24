const { saveDB } = require('../helpers/database');
const { updateLife, KONFIG_LIFE } = require('./life');

// =================================================================
// KONFIGURASI EKONOMI
// =================================================================
const KONFIG_ECO = {
    // BANK
    BANK_COOLDOWN: 10 * 60 * 1000,  // 10 menit

    // TRANSFER
    LIMIT_HARIAN:  10000000000,      // 10 Miliar per hari
    TRANSFER_TAX:  0.05,             // Pajak 5%

    // PINJAM
    MAX_LOAN:      5000000000,       // Max 5 Miliar
    INTEREST_RATE: 0.2,             // Bunga 20%

    // ROB
    ROB_COOLDOWN:  30 * 60 * 1000,  // 30 menit
    ROB_SUCCESS_RATE: 0.4,          // 40% berhasil
    ROB_STEAL_PCT:    0.2,          // Ambil 20% saldo korban
    ROB_FINE_PCT:     0.10,         // Denda 10% jika gagal
    ROB_HP_PENALTY:   20,           // HP berkurang 20 jika gagal
    ROB_ENERGY_COST:  10,           // Energi -10 per rob
    ROB_MIN_TARGET:   1000000,      // Target minimal saldo 1 Juta
};

// =================================================================
// MODULE EXPORT — ECONOMY COMMANDS
// =================================================================
module.exports = async (command, args, msg, user, db, sock) => {
    const now = Date.now();

    // --- Init Data User ---
    if (typeof user.bank         === 'undefined' || isNaN(user.bank))     user.bank     = 0;
    if (typeof user.balance      === 'undefined' || isNaN(user.balance))  user.balance  = 0;
    if (typeof user.debt         === 'undefined' || isNaN(user.debt))     user.debt     = 0;
    if (typeof user.dailyUsage   === 'undefined' || isNaN(user.dailyUsage)) user.dailyUsage = 0;
    if (typeof user.dailyIncome  === 'undefined') user.dailyIncome = 0;

    // --- Init Global Settings ---
    if (!db.settings) db.settings = { lifeSystem: true };

    // --- Jalankan Update Kehidupan (agar status terupdate) ---
    updateLife(user, db, now);

    // --- Reset Limit Harian ---
    const todayStr = new Date().toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' });
    if (user.lastLimitDate !== todayStr) {
        user.dailyUsage  = 0;
        user.dailyIncome = 0;
        user.lastLimitDate = todayStr;
    }

    saveDB(db);

    // Guard: Mati — block semua economy command
    if (user.isDead) {
        return msg.reply(
            `💀 *KAMU PINGSAN/MATI!*\n\n` +
            `Kamu tidak bisa bertransaksi dalam kondisi mati.\n` +
            `Ketik \`!revive\` untuk ke RS (Biaya 💰${KONFIG_LIFE.BIAYA_RS.toLocaleString()}).`
        );
    }

    // =================================================================
    // !bank / !atm / !dompet — Info Saldo
    // =================================================================
    if (['bank', 'atm', 'dompet'].includes(command)) {
        const sisaLimit = KONFIG_ECO.LIMIT_HARIAN - user.dailyUsage;
        let txt =
            `🏦 *BANK ARYA* 🏦\n\n` +
            `👤 Nasabah: ${msg.author ? `@${msg.author.split('@')[0]}` : 'Kamu'}\n` +
            `💳 Saldo Bank : 💰${Math.floor(user.bank).toLocaleString()}\n` +
            `👛 Dompet     : 💰${Math.floor(user.balance).toLocaleString()}\n`;

        if (user.debt > 0)
            txt += `📉 *Utang*     : 💰${Math.floor(user.debt).toLocaleString()}\n`;

        txt +=
            `\n📊 *Limit Transfer Harian:*\n` +
            `Terpakai : 💰${user.dailyUsage.toLocaleString()} / ${KONFIG_ECO.LIMIT_HARIAN.toLocaleString()}\n` +
            `Sisa     : 💰${sisaLimit.toLocaleString()}\n` +
            `\n❤️ ${Math.floor(user.hp)}% | 🍗 ${Math.floor(user.hunger)}% | ⚡ ${Math.floor(user.energy)}%`;

        return msg.reply(txt, null, { mentions: [msg.author] });
    }

    // =================================================================
    // !depo / !deposit — Setor ke Bank
    // =================================================================
    if (command === 'depo' || command === 'deposit') {
        const lastBank = user.lastBank || 0;
        if (now - lastBank < KONFIG_ECO.BANK_COOLDOWN) {
            const sisa = Math.ceil((KONFIG_ECO.BANK_COOLDOWN - (now - lastBank)) / 60000);
            return msg.reply(`⏳ *ANTRIAN PENUH!* Tunggu *${sisa} menit* lagi.`);
        }

        if (!args[0]) return msg.reply("❌ Contoh: `!depo 1000000` atau `!depo all`");

        let amount = args[0].toLowerCase() === 'all'
            ? Math.floor(user.balance)
            : parseInt(args[0].replace(/[^0-9]/g, ''));

        if (isNaN(amount) || amount <= 0) return msg.reply("❌ Nominal tidak valid.");
        if (user.balance < amount)        return msg.reply("❌ Uang di dompet kurang!");

        user.balance -= amount;
        user.bank    += amount;
        user.lastBank = now;
        saveDB(db);

        return msg.reply(`✅ *DEPOSIT SUKSES*\nSetor 💰${amount.toLocaleString()} ke Bank.\nSaldo Bank: 💰${Math.floor(user.bank).toLocaleString()}`);
    }

    // =================================================================
    // !tarik / !withdraw — Tarik dari Bank
    // =================================================================
    if (command === 'tarik' || command === 'withdraw') {
        const lastBank = user.lastBank || 0;
        if (now - lastBank < KONFIG_ECO.BANK_COOLDOWN) {
            const sisa = Math.ceil((KONFIG_ECO.BANK_COOLDOWN - (now - lastBank)) / 60000);
            return msg.reply(`⏳ *ANTRIAN PENUH!* Tunggu *${sisa} menit* lagi.`);
        }

        if (!args[0]) return msg.reply("❌ Contoh: `!tarik 1000000` atau `!tarik all`");

        let amount = args[0].toLowerCase() === 'all'
            ? Math.floor(user.bank)
            : parseInt(args[0].replace(/[^0-9]/g, ''));

        if (isNaN(amount) || amount <= 0) return msg.reply("❌ Nominal tidak valid.");
        if (user.bank < amount)           return msg.reply("❌ Saldo Bank kurang!");

        user.bank    -= amount;
        user.balance += amount;
        user.lastBank = now;
        saveDB(db);

        return msg.reply(`✅ *TARIK SUKSES*\nTarik 💰${amount.toLocaleString()} ke Dompet.\nDompet: 💰${Math.floor(user.balance).toLocaleString()}`);
    }

    // =================================================================
    // !transfer / !tf — Transfer ke User Lain
    // =================================================================
    if (command === 'transfer' || command === 'tf') {
        const mentions  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || msg.mentionedIds || [];
        const targetId  = mentions[0];

        if (!targetId || !args[1])
            return msg.reply("❌ Format: `!transfer @user 1000000`");
        if (targetId === msg.author)
            return msg.reply("❌ Tidak bisa transfer ke diri sendiri.");

        let amount = parseInt(args[1].replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount <= 0) return msg.reply("❌ Nominal tidak valid.");

        // Cek limit harian
        if ((user.dailyUsage + amount) > KONFIG_ECO.LIMIT_HARIAN) {
            const sisa = KONFIG_ECO.LIMIT_HARIAN - user.dailyUsage;
            return msg.reply(`❌ *LIMIT HABIS!*\nSisa limit hari ini: 💰${sisa.toLocaleString()}`);
        }

        const tax   = Math.floor(amount * KONFIG_ECO.TRANSFER_TAX);
        const total = amount + tax;

        if (user.balance < total)
            return msg.reply(`❌ Uang kurang! Butuh 💰${total.toLocaleString()} (termasuk pajak 5%).`);

        if (!db.users[targetId])
            db.users[targetId] = { balance: 0, bank: 0, debt: 0, xp: 0, level: 1 };

        user.balance              -= total;
        user.dailyUsage           += amount;
        db.users[targetId].balance = (db.users[targetId].balance || 0) + amount;
        saveDB(db);

        return msg.reply(
            `✅ *TRANSFER SUKSES*\n` +
            `💰 Kirim : ${amount.toLocaleString()}\n` +
            `💸 Pajak : ${tax.toLocaleString()} (5%)\n` +
            `📉 Sisa Limit: ${(KONFIG_ECO.LIMIT_HARIAN - user.dailyUsage).toLocaleString()}`,
            null, { mentions: [targetId] }
        );
    }

    // =================================================================
    // !pinjam / !loan — Pinjam Uang
    // =================================================================
    if (command === 'pinjam' || command === 'loan') {
        if (user.debt > 0)
            return msg.reply(`❌ Lunasi dulu utangmu: 💰${Math.floor(user.debt).toLocaleString()}`);
        if (!args[0])
            return msg.reply(`❌ Contoh: \`!pinjam 50000000\`\nMax: 💰${KONFIG_ECO.MAX_LOAN.toLocaleString()}`);

        let amount = parseInt(args[0].replace(/[^0-9]/g, ''));
        if (isNaN(amount) || amount <= 0)
            return msg.reply("❌ Nominal salah.");
        if (amount > KONFIG_ECO.MAX_LOAN)
            return msg.reply(`❌ Maksimal pinjaman: 💰${KONFIG_ECO.MAX_LOAN.toLocaleString()}`);

        const totalDebt = Math.floor(amount * (1 + KONFIG_ECO.INTEREST_RATE));

        user.balance += amount;
        user.debt     = totalDebt;
        saveDB(db);

        return msg.reply(
            `🤝 *PINJAMAN CAIR*\n` +
            `💰 Terima   : ${amount.toLocaleString()}\n` +
            `📉 Total Utang: ${totalDebt.toLocaleString()} (Bunga 20%)`
        );
    }

    // =================================================================
    // !bayar / !pay — Bayar Utang
    // =================================================================
    if (command === 'bayar' || command === 'pay') {
        if (user.debt <= 0) return msg.reply("✅ Kamu tidak punya utang.");

        let amount = args[0]?.toLowerCase() === 'all'
            ? user.debt
            : parseInt((args[0] || '0').replace(/[^0-9]/g, ''));

        if (amount <= 0)          return msg.reply(`❌ Tagihan utangmu: 💰${Math.floor(user.debt).toLocaleString()}`);
        if (user.balance < amount) return msg.reply("❌ Uang di dompet kurang!");

        if (amount > user.debt) amount = user.debt;

        user.balance -= amount;
        user.debt    -= amount;
        saveDB(db);

        return msg.reply(
            `💸 *UTANG DIBAYAR*\n` +
            `Nominal  : 💰${amount.toLocaleString()}\n` +
            `Sisa Utang: 💰${Math.floor(user.debt).toLocaleString()}`
        );
    }

    // =================================================================
    // !top / !leaderboard — Top Pendapatan Harian (Grup)
    // =================================================================
    if (['top', 'leaderboard', 'dailyrank'].includes(command)) {
        const chatId = msg.from || msg.key.remoteJid;
        if (!chatId.endsWith('@g.us'))
            return msg.reply("❌ Fitur ini hanya untuk Grup!");

        let groupMetadata;
        try {
            groupMetadata = await sock.groupMetadata(chatId);
        } catch (e) {
            return msg.reply("⚠️ Gagal mengambil data grup.");
        }

        const memberIds = groupMetadata.participants.map(p => p.id);

        const getJobIcon = (job = '') => {
            const j = job.toLowerCase();
            if (j.includes('petani') || j.includes('tanam')) return '🌾';
            if (j.includes('polisi'))                         return '👮';
            if (j.includes('dokter') || j.includes('rs'))     return '👨‍⚕️';
            if (j.includes('maling') || j.includes('perampok')) return '🥷';
            if (j.includes('tambang') || j.includes('miner')) return '⛏️';
            if (j.includes('karyawan') || j.includes('pabrik')) return '👷';
            return '💼';
        };

        const sorted = Object.entries(db.users)
            .filter(([id]) => memberIds.includes(id))
            .map(([id, data]) => ({
                id,
                name:        data.name || id.split('@')[0],
                job:         data.job  || 'Pengangguran',
                dailyIncome: data.dailyIncome || 0,
            }))
            .filter(u => u.dailyIncome > 0)
            .sort((a, b) => b.dailyIncome - a.dailyIncome)
            .slice(0, 10);

        const medals = ['🥇', '🥈', '🥉'];
        let txt =
            `🏆 *TOP PENDAPATAN HARI INI* 🏆\n` +
            `(Reset setiap jam 00:00 WIB)\n` +
            `${'―'.repeat(28)}\n\n`;

        if (sorted.length === 0) {
            txt += '💤 Belum ada yang berpenghasilan hari ini.\nAyo kerja atau nge-rob!';
        } else {
            sorted.forEach((u, i) => {
                const medal = medals[i] || `${i + 1}.`;
                txt += `${medal} @${u.name}\n`;
                txt += `   └ ${getJobIcon(u.job)} ${u.job} | 💸 +Rp ${u.dailyIncome.toLocaleString('id-ID')}\n`;
            });
        }

        const myId    = msg.author || msg.key.participant;
        const myRank  = sorted.findIndex(x => x.id === myId);
        const myIncome = (user.dailyIncome || 0).toLocaleString('id-ID');

        txt +=
            `\n${'―'.repeat(28)}\n` +
            `👤 *Posisi Kamu: #${myRank >= 0 ? myRank + 1 : 'Belum masuk'}*\n` +
            `💰 Cuan Hari Ini: Rp ${myIncome}`;

        return msg.reply(txt);
    }

    // =================================================================
    // !rob / !maling — Rampok User Lain
    // =================================================================
    if (command === 'rob' || command === 'maling') {
        if (user.energy < 10)
            return msg.reply("⚠️ *TERLALU LELAH*\nEnergimu kurang dari 10%. Tidur dulu (`!tidur`)!");

        const lastRob = user.lastRob || 0;
        if (now - lastRob < KONFIG_ECO.ROB_COOLDOWN) {
            const sisa = Math.ceil((KONFIG_ECO.ROB_COOLDOWN - (now - lastRob)) / 60000);
            return msg.reply(`👮 Polisi lagi patroli! Tunggu *${sisa} menit* lagi.`);
        }

        const mentions  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || msg.mentionedIds || [];
        const targetId  = mentions[0];

        if (!targetId || targetId === msg.author)
            return msg.reply("❌ Tag korban yang valid!");

        const targetUser = db.users[targetId];
        if (!targetUser) return msg.reply("❌ Target belum terdaftar.");

        const targetWallet = Math.floor(targetUser.balance || 0);
        if (targetWallet < KONFIG_ECO.ROB_MIN_TARGET)
            return msg.reply(`❌ Target terlalu miskin (Saldo < ${KONFIG_ECO.ROB_MIN_TARGET.toLocaleString()}). Gak worth it.`);

        user.energy -= KONFIG_ECO.ROB_ENERGY_COST;
        user.lastRob = now;

        if (Math.random() < KONFIG_ECO.ROB_SUCCESS_RATE) {
            // BERHASIL
            const stolen = Math.floor(targetWallet * KONFIG_ECO.ROB_STEAL_PCT);
            targetUser.balance -= stolen;
            user.balance       += stolen;
            user.dailyIncome    = (user.dailyIncome || 0) + stolen;
            saveDB(db);

            return msg.reply(
                `🥷 *SUKSES!*\nDapat 💰${stolen.toLocaleString()} dari @${targetId.split('@')[0]}\n` +
                `⚡ Energi -${KONFIG_ECO.ROB_ENERGY_COST}`,
                null, { mentions: [targetId] }
            );
        } else {
            // GAGAL
            const fine   = Math.floor(user.balance * KONFIG_ECO.ROB_FINE_PCT);
            user.balance -= fine;
            user.hp      -= KONFIG_ECO.ROB_HP_PENALTY;
            if (user.balance < 0) user.balance = 0;
            saveDB(db);

            return msg.reply(
                `👮 *TERTANGKAP!*\nDenda 💰${fine.toLocaleString()}\n` +
                `🤕 Dipukuli warga (HP -${KONFIG_ECO.ROB_HP_PENALTY})\n` +
                `⚡ Energi -${KONFIG_ECO.ROB_ENERGY_COST}`
            );
        }
    }
};