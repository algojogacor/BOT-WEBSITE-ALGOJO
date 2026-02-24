/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              MOOD TRACKER — Fitur 6                         ║
 * ║  !mood <emoji/kata>  — Log mood harian                      ║
 * ║  !moodstat           — Lihat statistik & grafik mood        ║
 * ║  !moodhistory        — Riwayat mood 7 hari terakhir         ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { saveDB } = require('../helpers/database');

// ─── Mapping mood ke emoji & nilai numerik ───────────────────
const MOOD_MAP = {
    // Positif
    'sangat bahagia': { emoji: '🤩', value: 5, label: 'Sangat Bahagia', color: '🟢' },
    'bahagia': { emoji: '😄', value: 4, label: 'Bahagia', color: '🟢' },
    'senang': { emoji: '😊', value: 4, label: 'Senang', color: '🟢' },
    'semangat': { emoji: '💪', value: 4, label: 'Semangat', color: '🟢' },
    'excited': { emoji: '🎉', value: 5, label: 'Excited', color: '🟢' },
    // Netral
    'biasa': { emoji: '😐', value: 3, label: 'Biasa Aja', color: '🟡' },
    'oke': { emoji: '🙂', value: 3, label: 'Oke', color: '🟡' },
    'capek': { emoji: '😴', value: 2, label: 'Capek', color: '🟡' },
    'bingung': { emoji: '😕', value: 2, label: 'Bingung', color: '🟡' },
    // Negatif
    'sedih': { emoji: '😢', value: 1, label: 'Sedih', color: '🔴' },
    'stress': { emoji: '😤', value: 1, label: 'Stress', color: '🔴' },
    'marah': { emoji: '😡', value: 1, label: 'Marah', color: '🔴' },
    'galau': { emoji: '😩', value: 1, label: 'Galau', color: '🔴' },
    'anxious': { emoji: '😰', value: 1, label: 'Anxious', color: '🔴' },
    'takut': { emoji: '😨', value: 1, label: 'Takut', color: '🔴' },
    // Emoji langsung
    '🤩': { emoji: '🤩', value: 5, label: 'Sangat Bahagia', color: '🟢' },
    '😄': { emoji: '😄', value: 4, label: 'Bahagia', color: '🟢' },
    '😊': { emoji: '😊', value: 4, label: 'Senang', color: '🟢' },
    '😐': { emoji: '😐', value: 3, label: 'Biasa', color: '🟡' },
    '😴': { emoji: '😴', value: 2, label: 'Capek', color: '🟡' },
    '😢': { emoji: '😢', value: 1, label: 'Sedih', color: '🔴' },
    '😡': { emoji: '😡', value: 1, label: 'Marah', color: '🔴' },
};

// ─── Render grafik batang teks ─────────────────────────────────
function renderBarChart(data) {
    const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
    const bar = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    let chart = '';
    data.forEach((val, i) => {
        const idx = Math.min(Math.max(Math.round((val / 5) * 7), 0), 7);
        chart += `${labels[i]}: ${bar[idx]}${'▫'.repeat(7 - idx)} ${val > 0 ? val.toFixed(1) : '-'}\n`;
    });
    return chart;
}

// ─── Ambil nama hari ──────────────────────────────────────────
function getNamaHari(date) {
    const hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return hari[date.getDay()];
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['mood', 'moodstat', 'moodhistory', 'moodstats'];
    if (!validCommands.includes(command)) return;

    // Inisialisasi mood tracker di user
    if (!user.moodLogs) user.moodLogs = [];

    const now = new Date();
    const todayKey = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // ══════════════════════════════════════════════════════════
    // LOG MOOD: !mood <kata/emoji> [catatan opsional]
    // ══════════════════════════════════════════════════════════
    if (command === 'mood') {
        if (!args[0]) {
            const listMood = Object.entries(MOOD_MAP)
                .filter(([k]) => !k.startsWith('🙂') && k.length > 1)
                .slice(0, 14)
                .map(([k, v]) => `${v.emoji} \`${k}\``)
                .join('  ');

            return msg.reply(
                `😊 *MOOD TRACKER*\n` +
                `${'─'.repeat(30)}\n\n` +
                `Cara log mood kamu:\n` +
                `*!mood <kata/emoji>* [catatan]\n\n` +
                `Pilihan mood:\n${listMood}\n\n` +
                `Contoh:\n` +
                `• \`!mood bahagia Hari ini dapat nilai bagus!\`\n` +
                `• \`!mood 😴 Begadang semalam\`\n\n` +
                `📊 Lihat statistik: \`!moodstat\`\n` +
                `📋 Riwayat: \`!moodhistory\``
            );
        }

        const moodInput = args[0].toLowerCase().trim();
        const catatan = args.slice(1).join(' ');

        const moodData = MOOD_MAP[moodInput] || MOOD_MAP[args[0]];
        if (!moodData) {
            return msg.reply(
                `❌ Mood "${args[0]}" tidak dikenal.\n\n` +
                `Gunakan: bahagia, senang, biasa, capek, sedih, stress, marah, galau, excited, dll.\n` +
                `Atau emoji langsung: 😄 😊 😐 😴 😢 😡`
            );
        }

        // Cek apakah sudah log hari ini
        const logHariIni = user.moodLogs.find(l => l.date === todayKey);
        const isUpdate = !!logHariIni;

        if (isUpdate) {
            // Update log yang ada
            logHariIni.mood = moodData.label;
            logHariIni.emoji = moodData.emoji;
            logHariIni.value = moodData.value;
            logHariIni.color = moodData.color;
            logHariIni.catatan = catatan || logHariIni.catatan;
            logHariIni.updatedAt = now.toISOString();
        } else {
            // Tambah log baru
            user.moodLogs.push({
                date: todayKey,
                hari: getNamaHari(now),
                mood: moodData.label,
                emoji: moodData.emoji,
                value: moodData.value,
                color: moodData.color,
                catatan: catatan || '',
                createdAt: now.toISOString()
            });
        }

        // Batasi history 30 hari
        if (user.moodLogs.length > 30) {
            user.moodLogs = user.moodLogs.slice(-30);
        }

        saveDB(db);

        // Hitung streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            if (user.moodLogs.find(l => l.date === key)) streak++;
            else break;
        }

        const moodPesan = {
            5: ['Wah, hari yang luar biasa! 🎉', 'Keren banget! Semoga terus begini ya!', 'Vibes-nya bagus banget!'],
            4: ['Bagus! Jaga terus semangat itu!', 'Good mood is contagious, spread it!', 'Senang dengarnya!'],
            3: ['Hari yang biasa itu juga nikmat, kok.', 'Tetap jalani dengan penuh syukur ya!'],
            2: ['Semangat! Besok pasti lebih baik.', 'Istirahat yang cukup ya!'],
            1: ['Tidak apa-apa untuk tidak baik-baik saja. Kalau butuh cerita, saya di sini! 💙', 'Yakin ini juga akan berlalu. Stay strong!']
        };
        const randomPesan = moodPesan[moodData.value][Math.floor(Math.random() * moodPesan[moodData.value].length)];

        return msg.reply(
            `${moodData.emoji} *MOOD TERCATAT!*\n` +
            `${'─'.repeat(25)}\n\n` +
            `📅 Tanggal: ${getNamaHari(now)}, ${now.toLocaleDateString('id-ID')}\n` +
            `😊 Mood: *${moodData.label}* ${moodData.color}\n` +
            (catatan ? `📝 Catatan: ${catatan}\n` : '') +
            `🔥 Streak: ${streak} hari berturut-turut\n\n` +
            `💬 ${randomPesan}\n\n` +
            `${isUpdate ? '_✏️ Mood hari ini diperbarui_' : '_Log berhasil disimpan_'}\n` +
            `Ketik \`!moodstat\` untuk lihat grafik mood kamu.`
        );
    }

    // ══════════════════════════════════════════════════════════
    // STATISTIK: !moodstat
    // ══════════════════════════════════════════════════════════
    if (command === 'moodstat' || command === 'moodstats') {
        if (user.moodLogs.length === 0) {
            return msg.reply('📊 Belum ada data mood. Log mood kamu dulu dengan `!mood <kata>`');
        }

        // Data 7 hari terakhir
        const last7 = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            const log = user.moodLogs.find(l => l.date === key);
            last7.push(log ? log.value : 0);
        }

        const validLogs = user.moodLogs.filter(l => l.value > 0);
        const rataRata = validLogs.length > 0
            ? (validLogs.reduce((s, l) => s + l.value, 0) / validLogs.length).toFixed(1)
            : 0;

        const moodTerbanyak = validLogs.reduce((acc, l) => {
            acc[l.mood] = (acc[l.mood] || 0) + 1;
            return acc;
        }, {});
        const topMood = Object.entries(moodTerbanyak).sort((a, b) => b[1] - a[1])[0];

        const moodTerburuk = [...user.moodLogs].sort((a, b) => a.value - b.value)[0];
        const moodTerbaik = [...user.moodLogs].sort((a, b) => b.value - a.value)[0];

        // Streak
        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            if (user.moodLogs.find(l => l.date === key)) streak++;
            else break;
        }

        const ratingEmoji = rataRata >= 4 ? '🟢' : rataRata >= 2.5 ? '🟡' : '🔴';

        return msg.reply(
            `📊 *STATISTIK MOOD — ${user.name || msg.pushName}*\n` +
            `${'─'.repeat(30)}\n\n` +
            `📅 *7 Hari Terakhir:*\n` +
            `${renderBarChart(last7)}\n` +
            `${'─'.repeat(25)}\n\n` +
            `📈 *Ringkasan:*\n` +
            `• Rata-rata mood: ${ratingEmoji} *${rataRata}/5*\n` +
            `• Total log: *${validLogs.length} hari*\n` +
            `• 🔥 Streak sekarang: *${streak} hari*\n` +
            `• 😊 Mood paling sering: *${topMood ? topMood[0] : '-'}* (${topMood ? topMood[1] : 0}x)\n` +
            `• 🏆 Mood terbaik: *${moodTerbaik?.mood || '-'}* (${moodTerbaik?.date || '-'})\n\n` +
            `💡 _Rajin log mood = lebih paham diri sendiri!_`
        );
    }

    // ══════════════════════════════════════════════════════════
    // RIWAYAT: !moodhistory
    // ══════════════════════════════════════════════════════════
    if (command === 'moodhistory') {
        if (user.moodLogs.length === 0) {
            return msg.reply('📋 Belum ada riwayat mood. Mulai log dengan `!mood <kata>`');
        }

        const last10 = [...user.moodLogs]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        let riwayat = `📋 *RIWAYAT MOOD — 10 Hari Terakhir*\n${'─'.repeat(30)}\n\n`;
        last10.forEach(log => {
            const tgl = new Date(log.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
            riwayat += `${log.color} *${tgl}* — ${log.emoji} ${log.mood}`;
            if (log.catatan) riwayat += `\n   _📝 "${log.catatan}"_`;
            riwayat += '\n';
        });

        riwayat += `\n${'─'.repeat(25)}\n_Total data: ${user.moodLogs.length} hari_`;
        return msg.reply(riwayat);
    }
};
