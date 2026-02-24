const { saveDB } = require('../helpers/database');

// =================================================================
// KONFIGURASI KEHIDUPAN
// =================================================================
// Target desain:
//   - Lapar habis dalam ~12 jam → butuh makan 2x sehari
//   - Energi habis dalam ~12 jam → butuh tidur 2x sehari (atau 1x tidur 6-8 jam)
//   - Saat tidur: energi terisi, lapar turun sangat lambat
// =================================================================
const KONFIG_LIFE = {
    // DECAY (Per Menit)
    // 100% / 720 menit (12 jam) ≈ 0.1389
    DECAY_LAPAR:  0.139,   // Habis dalam ~12 jam → wajib makan 2x/hari
    DECAY_ENERGI: 0.139,   // Habis dalam ~12 jam → wajib tidur/istirahat 2x/hari
    DECAY_HP:     0.07,    // HP turun saat lapar (habis dalam ~24 jam jika lapar terus)

    // SAAT TIDUR
    // Tidur 6 jam → energi naik 6 * 60 * 0.28 = 100.8% (penuh)
    SLEEP_REGEN_ENERGI: 0.28,   // Regen energi per menit saat tidur
    SLEEP_DECAY_LAPAR:  0.025,  // Lapar turun sangat lambat saat tidur

    // BIAYA & DENDA
    BIAYA_MAKAN:  50000000,
    BIAYA_RS:     500000000,
    DENDA_MATI:   0.2,

    // COOLDOWN
    TIDUR_COOLDOWN: 10 * 60 * 1000, // 10 menit
};

// =================================================================
// HELPER: UPDATE STATUS KEHIDUPAN
// =================================================================
const updateLife = (user, db, now) => {
    // Init default
    if (typeof user.isSleeping    === 'undefined') user.isSleeping    = false;
    if (typeof user.hp            === 'undefined') user.hp            = 100;
    if (typeof user.hunger        === 'undefined') user.hunger        = 100;
    if (typeof user.energy        === 'undefined') user.energy        = 100;
    if (typeof user.lastLifeUpdate=== 'undefined') user.lastLifeUpdate= now;
    if (typeof user.isDead        === 'undefined') user.isDead        = false;
    if (typeof user.sleepEndTime  === 'undefined') user.sleepEndTime  = 0;

    // Jika sistem dimatikan admin, skip (tapi tetap update timestamp)
    if (db.settings && db.settings.lifeSystem === false) {
        user.lastLifeUpdate = now;
        return;
    }

    if (user.isDead) return;

    const diffMs      = now - user.lastLifeUpdate;
    const diffMinutes = diffMs / 60000; // Biarkan desimal untuk presisi

    if (diffMinutes <= 0) return;

    if (user.isSleeping) {
        // ============================================================
        // MODE TIDUR
        // Bug fix: hitung hanya waktu yang benar-benar tidur,
        // sisanya hitung sebagai mode bangun (jika waktu tidur sudah habis).
        // ============================================================
        if (now >= user.sleepEndTime) {
            // Tidur sudah selesai dalam rentang waktu ini
            const sleepMs      = Math.max(0, user.sleepEndTime - user.lastLifeUpdate);
            const awakeMs      = now - Math.max(user.lastLifeUpdate, user.sleepEndTime);

            const sleepMinutes = sleepMs / 60000;
            const awakeMinutes = awakeMs / 60000;

            // Proses saat tidur
            user.energy += sleepMinutes * KONFIG_LIFE.SLEEP_REGEN_ENERGI;
            user.hunger -= sleepMinutes * KONFIG_LIFE.SLEEP_DECAY_LAPAR;

            // Proses setelah bangun otomatis
            user.hunger -= awakeMinutes * KONFIG_LIFE.DECAY_LAPAR;
            user.energy -= awakeMinutes * KONFIG_LIFE.DECAY_ENERGI;

            // Reset status tidur
            user.isSleeping  = false;
            user.sleepEndTime = 0;
        } else {
            // Masih dalam periode tidur
            user.energy += diffMinutes * KONFIG_LIFE.SLEEP_REGEN_ENERGI;
            user.hunger -= diffMinutes * KONFIG_LIFE.SLEEP_DECAY_LAPAR;
        }
    } else {
        // MODE BANGUN
        user.hunger -= diffMinutes * KONFIG_LIFE.DECAY_LAPAR;
        user.energy -= diffMinutes * KONFIG_LIFE.DECAY_ENERGI;
    }

    // Clamp nilai 0–100
    user.energy = Math.max(0, Math.min(100, user.energy));
    user.hunger = Math.max(0, Math.min(100, user.hunger));

    // HP berkurang hanya jika lapar = 0
    if (user.hunger === 0) {
        user.hp -= KONFIG_LIFE.DECAY_HP * diffMinutes;
    }

    // Cek kematian
    if (user.hp <= 0) {
        user.hp        = 0;
        user.isDead    = true;
        user.isSleeping = false;

        const denda    = Math.floor(user.balance * KONFIG_LIFE.DENDA_MATI);
        user.balance  -= denda;
        if (user.balance < 0) user.balance = 0;
    }

    user.lastLifeUpdate = now;
};

// =================================================================
// HELPER: PROGRESS BAR VISUAL
// =================================================================
const createBar = (current, max = 100) => {
    const total  = 10;
    const filled = Math.round(Math.max(0, Math.min(current, max)) / max * total);
    return '█'.repeat(filled) + '░'.repeat(total - filled);
};

// =================================================================
// MODULE EXPORT — LIFE COMMANDS
// =================================================================
module.exports = async (command, args, msg, user, db, sock) => {
    const now = Date.now();

    // Init Global Settings
    if (!db.settings) db.settings = { lifeSystem: true };

    // Jalankan update kehidupan
    updateLife(user, db, now);
    saveDB(db);

    // ---------------------------------------------------------------
    // Guard: Sedang Tidur
    // ---------------------------------------------------------------
    const sleepAllowed = ['bangun', 'wake', 'me', 'status', 'cekstatus', 'profile', 'revive', 'rs'];
    if (user.isSleeping && !sleepAllowed.includes(command)) {
        const sisaMenit = Math.ceil((user.sleepEndTime - now) / 60000);
        return msg.reply(
            `💤 *Ssstt... Kamu sedang tidur!*\n\n` +
            `Energi sedang diisi.\n` +
            `Bangun otomatis dalam: *${sisaMenit} menit*.\n` +
            `Ketik \`!bangun\` jika ingin bangun paksa.`
        );
    }

    // ---------------------------------------------------------------
    // Guard: Mati
    // ---------------------------------------------------------------
    const deadAllowed = ['me', 'status', 'profile', 'revive', 'rs', 'hidupstatus', 'matistatus'];
    if (user.isDead && !deadAllowed.includes(command)) {
        return msg.reply(
            `💀 *KAMU PINGSAN/MATI!*\n\n` +
            `Darahmu habis karena kelaparan.\n` +
            `Ketik \`!revive\` atau \`!rs\` untuk ke RS (Biaya 💰${KONFIG_LIFE.BIAYA_RS.toLocaleString()}).`
        );
    }

    // =================================================================
    // ADMIN: Matikan / Nyalakan Sistem Kehidupan
    // =================================================================
    if (command === 'matistatus') {
        db.settings.lifeSystem = false;
        saveDB(db);
        return msg.reply("🛑 *SISTEM KEHIDUPAN DIMATIKAN*\nStatus player dibekukan.");
    }

    if (command === 'hidupstatus' || command === 'nyalastatus') {
        db.settings.lifeSystem = true;
        Object.values(db.users).forEach(u => u.lastLifeUpdate = now);
        saveDB(db);
        return msg.reply("▶️ *SISTEM KEHIDUPAN DINYALAKAN*\nWaktu kembali berjalan. Waspada status kalian!");
    }

    // =================================================================
    // !me / !status / !profile — Cek Status
    // =================================================================
    if (['me', 'status', 'profile', 'cekstatus'].includes(command)) {
        const sleepInfo = user.isSleeping
            ? `\n💤 *Tidur* — bangun dalam ${Math.ceil((user.sleepEndTime - now) / 60000)} menit`
            : '';

        let statusTag = '';
        if      (user.isDead)        statusTag = `\n💀 *STATUS: PINGSAN* (Ketik !revive)`;
        else if (user.hunger  < 20)  statusTag = `\n⚠️ *STATUS: KELAPARAN* (Cepat !makan)`;
        else if (user.energy  < 20)  statusTag = `\n⚠️ *STATUS: LELAH* (Cepat !tidur)`;
        else                         statusTag = `\n✅ *STATUS: SEHAT*`;

        const txt =
            `👤 *PROFIL PENGGUNA*\n\n` +
            `Nama: ${msg.author ? `@${msg.author.split('@')[0]}` : 'Kamu'}\n` +
            `❤️ Darah : ${createBar(user.hp)} (${Math.floor(user.hp)}%)\n` +
            `🍗 Lapar  : ${createBar(user.hunger)} (${Math.floor(user.hunger)}%)\n` +
            `⚡ Energi : ${createBar(user.energy)} (${Math.floor(user.energy)}%)\n\n` +
            `💳 Dompet : 💰${Math.floor(user.balance).toLocaleString()}\n` +
            `🏦 Bank   : 💰${Math.floor(user.bank || 0).toLocaleString()}` +
            sleepInfo + statusTag;

        return msg.reply(txt, null, { mentions: [msg.author] });
    }

    // =================================================================
    // !makan / !eat — Makan
    // =================================================================
    if (command === 'makan' || command === 'eat') {
        if (user.balance < KONFIG_LIFE.BIAYA_MAKAN)
            return msg.reply(`❌ Uang kurang! Harga makanan: 💰${KONFIG_LIFE.BIAYA_MAKAN.toLocaleString()}`);
        if (user.hunger >= 100)
            return msg.reply(`❌ Kamu masih kenyang!`);

        user.balance -= KONFIG_LIFE.BIAYA_MAKAN;
        user.hunger   = 100;
        user.hp       = Math.min(100, user.hp + 10);
        saveDB(db);

        return msg.reply(
            `🍽️ *FINE DINING*\nKamu makan hidangan mewah.\n` +
            `🍗 Lapar: 100%\n❤️ Darah: +10%\n` +
            `💸 Bayar: 💰${KONFIG_LIFE.BIAYA_MAKAN.toLocaleString()}`
        );
    }

    // =================================================================
    // !tidur / !sleep — Tidur
    // =================================================================
    if (command === 'tidur' || command === 'sleep') {
        // Cek cooldown tidur (biar tidak spam tidur)
        const lastTidur = user.lastTidur || 0;
        if (now - lastTidur < KONFIG_LIFE.TIDUR_COOLDOWN) {
            const sisa = Math.ceil((KONFIG_LIFE.TIDUR_COOLDOWN - (now - lastTidur)) / 60000);
            return msg.reply(`⏳ Baru saja tidur. Tunggu *${sisa} menit* lagi.`);
        }

        let durasiJam = parseInt(args[0]);
        if (!args[0] || isNaN(durasiJam)) durasiJam = 1;

        if (durasiJam < 1 || durasiJam > 10)
            return msg.reply("❌ Durasi tidur minimal *1 jam*, maksimal *10 jam*.\nContoh: `!tidur 8`");

        if (user.energy >= 95)
            return msg.reply("❌ Matamu masih segar bugar (Energi Penuh)!");

        user.isSleeping   = true;
        user.sleepEndTime = now + (durasiJam * 60 * 60 * 1000);
        user.lastTidur    = now;
        // Penting: simpan waktu mulai tidur agar updateLife bisa hitung durasi
        user.lastLifeUpdate = now;
        saveDB(db);

        // Estimasi energi setelah bangun
        const regenEstimate = Math.min(100, user.energy + (durasiJam * 60 * KONFIG_LIFE.SLEEP_REGEN_ENERGI));

        return msg.reply(
            `💤 *ZZZ... SELAMAT TIDUR*\n` +
            `Tidur selama *${durasiJam} jam*.\n\n` +
            `⚡ Estimasi Energi: ${Math.floor(regenEstimate)}%\n` +
            `🍗 Lapar turun sangat lambat.\n` +
            `⚠️ Ketik \`!bangun\` jika ada darurat.`
        );
    }

    // =================================================================
    // !bangun / !wake — Bangun Paksa
    // =================================================================
    if (command === 'bangun' || command === 'wake') {
        if (!user.isSleeping) return msg.reply("❌ Kamu sedang tidak tidur.");

        user.isSleeping   = false;
        user.sleepEndTime = 0;
        saveDB(db);

        return msg.reply(
            `☀️ *SELAMAT BANGUN*\nKamu bangun paksa dari tidur.\n` +
            `Segera cek status (\`!me\`) dan cari makan jika perlu.`
        );
    }

    // =================================================================
    // !revive / !rs — Rumah Sakit
    // =================================================================
    if (command === 'revive' || command === 'rs') {
        if (!user.isDead && user.hp > 50)
            return msg.reply("❌ Kamu masih sehat!");

        const totalUang = (user.balance || 0) + (user.bank || 0);

        if (totalUang < KONFIG_LIFE.BIAYA_RS) {
            // Mode BPJS (tidak mampu bayar)
            user.isDead  = false;
            user.hp      = 20;
            user.hunger  = 20;
            user.energy  = 20;
            user.balance = 0;
            saveDB(db);
            return msg.reply(
                `🏥 *BPJS GRATIS*\nKarena kamu miskin, dokter hanya memberi obat generik.\n` +
                `❤️ Status kritis. Segera cari uang!`
            );
        }

        // Prioritas bayar dari dompet, kekurangan dari bank
        if (user.balance >= KONFIG_LIFE.BIAYA_RS) {
            user.balance -= KONFIG_LIFE.BIAYA_RS;
        } else {
            const sisaBayar = KONFIG_LIFE.BIAYA_RS - user.balance;
            user.balance    = 0;
            user.bank      -= sisaBayar;
        }

        user.isDead  = false;
        user.hp      = 100;
        user.hunger  = 100;
        user.energy  = 100;
        saveDB(db);

        return msg.reply(
            `🏥 *KELUAR DARI RS*\nKamu mendapatkan perawatan VVIP.\n` +
            `💸 Biaya: 💰${KONFIG_LIFE.BIAYA_RS.toLocaleString()}\n` +
            `❤️ Status kembali penuh 100%.`
        );
    }
};

// Export helper agar bisa dipakai economy module
module.exports.updateLife = updateLife;
module.exports.KONFIG_LIFE = KONFIG_LIFE;