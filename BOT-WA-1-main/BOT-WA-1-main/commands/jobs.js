const { saveDB } = require('../helpers/database');

// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// KONFIGURASI PROFESI (ADJUSTED FOR 20M ECONOMY)
const JOBS = {
    'petani': {
        role: "🌾 Petani Modern",
        cost: 10000000,      // Biaya: 10Juta
        salary: 1000000,    // Gaji: 1 Juta / Jam
        cooldown: 60,       // Kerja tiap 60 menit
        desc: "Ahli bercocok tanam. Skill: Percepat panen tanaman!"
    },
    'peternak': {
        role: "🤠 Juragan Ternak",
        cost: 25000000,      // Biaya: 25 Juta
        salary: 2500000,    // Gaji: 2.5 Juta / 2 Jam (1.25jt/jam)
        cooldown: 120,      // Kerja tiap 2 Jam
        desc: "Pawang hewan. Skill: Bikin hewan langsung lapar (Cepat gemuk)!"
    },
    'polisi': {
        role: "👮 Polisi Siber",
        cost: 50000000,     // Biaya: 50 Juta
        salary: 7500000,    // Gaji: 7.5 Juta / 4 Jam (1.875jt/jam)
        cooldown: 240,      // Kerja tiap 4 Jam
        desc: "Penegak hukum. Pasif: Kebal dari !rob (Maling) & Skill Razia."
    }
};

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['jobs', 'kerja', 'work', 'lamar', 'resign', 'skill'];
    if (!validCommands.includes(command)) return;

    // INIT DATA JOB USER
    if (!user.job) user.job = null;                 // Belum punya kerja
    if (!user.lastWork) user.lastWork = 0;          // Waktu kerja terakhir
    if (!user.lastSkill) user.lastSkill = 0;        // Waktu skill terakhir

    const now = Date.now();

    // ============================================================
    // 📋 MENU PEKERJAAN (!jobs)
    // ============================================================
    if (command === 'jobs') {
        let txt = `💼 *BURSA KERJA & PROFESI* 💼\n`;
        txt += `_Upgrade karirmu sesuai modal saat ini!_\n\n`;

        // Tampilkan Pekerjaan Saat Ini
        if (user.job) {
            const current = JOBS[user.job];
            txt += `🆔 *Profesi Kamu:* ${current.role}\n`;
            txt += `💰 Gaji: Rp ${fmt(current.salary)} / ${current.cooldown} menit\n`;
            txt += `🌟 Efek: ${current.desc}\n\n`;
            txt += `_Ketik !kerja untuk ambil gaji_\n`;
            txt += `_Ketik !skill untuk pakai kekuatan_\n`;
            txt += `_Ketik !resign untuk berhenti_\n`;
            txt += `--------------------------------\n`;
        } else {
            txt += `❌ Kamu masih *PENGANGGURAN*.\n--------------------------------\n`;
        }

        // List Lowongan
        for (let [code, job] of Object.entries(JOBS)) {
            txt += `🔹 *${job.role}* (Kode: ${code})\n`;
            txt += `   💸 Biaya Masuk: Rp ${fmt(job.cost)}\n`;
            txt += `   💵 Gaji: Rp ${fmt(job.salary)}\n`;
            txt += `   ℹ️ ${job.desc}\n\n`;
        }

        txt += `💡 Cara melamar: \`!lamar petani\``;
        return msg.reply(txt);
    }

    // ============================================================
    // ✍️ LAMAR KERJA (!lamar <kode>)
    // ============================================================
    if (command === 'lamar') {
        const targetJob = args[0]?.toLowerCase();

        if (user.job) return msg.reply(`❌ Kamu sudah jadi ${JOBS[user.job].role}.\nKetik \`!resign\` dulu kalau mau pindah kerja.`);
        if (!targetJob || !JOBS[targetJob]) return msg.reply("❌ Profesi tidak ditemukan. Cek `!jobs`.");

        const job = JOBS[targetJob];
        if (user.balance < job.cost) return msg.reply(`❌ Uang kurang! Butuh Rp ${fmt(job.cost)} untuk sertifikasi.`);

        user.balance -= job.cost;
        user.job = targetJob;
        user.lastWork = 0; // Reset waktu kerja
        user.lastSkill = 0; // Reset skill

        saveDB(db);
        return msg.reply(`🎉 *SELAMAT!*\nKamu resmi menjadi *${job.role}*.\nSekarang kamu bisa \`!kerja\` dan \`!skill\`!`);
    }

    // ============================================================
    // 🚪 RESIGN (!resign)
    // ============================================================
    if (command === 'resign') {
        if (!user.job) return msg.reply("❌ Kamu kan pengangguran?");
        
        const oldJob = JOBS[user.job].role;
        user.job = null;
        saveDB(db);
        return msg.reply(`👋 Kamu telah resign dari *${oldJob}*.\nSekarang kamu Pengangguran.`);
    }

    // ============================================================
    // 🔨 KERJA (!kerja) - Ambil Gaji
    // ============================================================
    if (command === 'kerja' || command === 'work') {
        if (!user.job) return msg.reply("❌ Kamu Pengangguran! `!lamar` dulu.");

        const job = JOBS[user.job];
        const cooldownMs = job.cooldown * 60 * 1000;
        const diff = now - user.lastWork;

        if (diff < cooldownMs) {
            const timeLeft = Math.ceil((cooldownMs - diff) / 60000);
            return msg.reply(`⏳ Kamu lelah! Bisa kerja lagi dalam *${timeLeft} menit*.`);
        }

        user.balance += job.salary;
        user.dailyIncome = (user.dailyIncome || 0) + job.salary;
        user.lastWork = now;
        user.xp += 50; 
        
        saveDB(db);
        return msg.reply(`⚒️ *KERJA KERAS BAGAI KUDA*\nKamu bekerja sebagai ${job.role}.\n💰 Gaji Diterima: *Rp ${fmt(job.salary)}*`);
    }

    // ============================================================
    // 🌟 SKILL SPESIAL (!skill)
    // ============================================================
    if (command === 'skill') {
        if (!user.job) return msg.reply("❌ Pengangguran gak punya skill.");
        
        // Cooldown Skill: 5 jam
        const SKILL_CD = 5 * 60 * 60 * 1000;
        const diff = now - user.lastSkill;

        if (diff < SKILL_CD) {
            const hoursLeft = Math.ceil((SKILL_CD - diff) / (60 * 60 * 1000));
            return msg.reply(`⏳ Skill sedang cooldown! Tunggu *${hoursLeft} Jam* lagi.`);
        }

        // --- EFEK SKILL BERDASARKAN JOB ---
        
        // 1. PETANI: Percepat semua tanaman 3 Jam
        if (user.job === 'petani') {
            if (!user.farm || user.farm.plants.length === 0) return msg.reply("❌ Ladang kosong. Tanam dulu!");
            
            user.farm.plants.forEach(p => p.readyAt -= (3 * 60 * 60 * 1000)); // Kurangi 3 jam
            user.lastSkill = now;
            saveDB(db);
            return msg.reply(`🌾 *SKILL PETANI AKTIF!*\nPupuk ajaib disebar. Waktu panen semua tanaman dipercepat 3 Jam!`);
        }

        // 2. PETERNAK: Bikin hewan lapar (Bisa makan lagi)
        if (user.job === 'peternak') {
            if (!user.ternak || user.ternak.length === 0) return msg.reply("❌ Kandang kosong.");
            
            user.ternak.forEach(a => a.lastFeed -= (6 * 60 * 60 * 1000)); // Mundurin waktu makan 6 jam
            user.lastSkill = now;
            saveDB(db);
            return msg.reply(`🤠 *SKILL PETERNAK AKTIF!*\nHewan diajak lari pagi. Sekarang mereka semua LAPAR (Bisa diberi makan lagi)!`);
        }

        // 3. POLISI: Raid Maling (Dapat Uang Sitaan)
        if (user.job === 'polisi') {
            const bonus = 5000000 + Math.floor(Math.random() * 5000000); // 5jt - 10jt
            user.balance += bonus;
            user.dailyIncome = (user.dailyIncome || 0) + bonus;
            user.lastSkill = now;
            saveDB(db);
            return msg.reply(`👮 *SKILL POLISI AKTIF!*\nKamu menggerebek markas maling!\n💰 Barang sitaan: Rp ${fmt(bonus)} masuk ke dompetmu.`);
        }
    }
};
