/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         ZODIAK & HOROSKOP — Fitur 27                        ║
 * ║  !zodiak <tanggal>      — Cek zodiak & horoskop harian      ║
 * ║  !zodiak <tanda>        — Horoskop berdasarkan tanda        ║
 * ║  !cocokan <tanda1> <tanda2> — Cek kompatibilitas            ║
 * ║  !shio <tahun>          — Shio berdasarkan tahun lahir      ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const OpenAI = require('openai');

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: { "HTTP-Referer": "https://wa-bot.com", "X-Title": "Arya Bot Zodiak" }
});

// ─── Data Zodiak ──────────────────────────────────────────────
const ZODIAK = [
    { nama: 'aries', emoji: '♈', mulai: [3, 21], selesai: [4, 19], elemen: '🔥 Api', planet: 'Mars', sifat: 'Berani, Energik, Impulsif' },
    { nama: 'taurus', emoji: '♉', mulai: [4, 20], selesai: [5, 20], elemen: '🌍 Bumi', planet: 'Venus', sifat: 'Tekun, Setia, Keras Kepala' },
    { nama: 'gemini', emoji: '♊', mulai: [5, 21], selesai: [6, 20], elemen: '💨 Udara', planet: 'Merkurius', sifat: 'Adaptif, Komunikatif, Tidak Konsisten' },
    { nama: 'cancer', emoji: '♋', mulai: [6, 21], selesai: [7, 22], elemen: '💧 Air', planet: 'Bulan', sifat: 'Intuitif, Empati, Sensitif' },
    { nama: 'leo', emoji: '♌', mulai: [7, 23], selesai: [8, 22], elemen: '🔥 Api', planet: 'Matahari', sifat: 'Karismatik, Percaya Diri, Dominan' },
    { nama: 'virgo', emoji: '♍', mulai: [8, 23], selesai: [9, 22], elemen: '🌍 Bumi', planet: 'Merkurius', sifat: 'Analitis, Perfeksionis, Kritis' },
    { nama: 'libra', emoji: '♎', mulai: [9, 23], selesai: [10, 22], elemen: '💨 Udara', planet: 'Venus', sifat: 'Diplomatis, Adil, Tidak Tegas' },
    { nama: 'scorpio', emoji: '♏', mulai: [10, 23], selesai: [11, 21], elemen: '💧 Air', planet: 'Pluto', sifat: 'Intens, Misterius, Pendendam' },
    { nama: 'sagittarius', emoji: '♐', mulai: [11, 22], selesai: [12, 21], elemen: '🔥 Api', planet: 'Jupiter', sifat: 'Petualang, Optimis, Tidak Sabar' },
    { nama: 'capricorn', emoji: '♑', mulai: [12, 22], selesai: [1, 19], elemen: '🌍 Bumi', planet: 'Saturnus', sifat: 'Ambisius, Disiplin, Materialistis' },
    { nama: 'aquarius', emoji: '♒', mulai: [1, 20], selesai: [2, 18], elemen: '💨 Udara', planet: 'Uranus', sifat: 'Inovatif, Humanis, Tidak Terduga' },
    { nama: 'pisces', emoji: '♓', mulai: [2, 19], selesai: [3, 20], elemen: '💧 Air', planet: 'Neptunus', sifat: 'Imajinatif, Peka, Mudah Terpengaruh' },
];

// ─── Kompatibilitas antar elemen ─────────────────────────────
const COMPAT_MATRIX = {
    'Api-Api': { score: 85, desc: 'Penuh gairah & energi, tapi bisa saling membakar!' },
    'Api-Udara': { score: 90, desc: 'Udara memfanning api — kombinasi yang sangat sinergi!' },
    'Api-Bumi': { score: 65, desc: 'Bumi bisa memadamkan api. Butuh banyak kompromi.' },
    'Api-Air': { score: 55, desc: 'Bertolak belakang. Bisa saling mengimbangi atau berseteru.' },
    'Udara-Udara': { score: 80, desc: 'Komunikasi luar biasa, tapi kurang kedalaman emosi.' },
    'Udara-Bumi': { score: 70, desc: 'Seimbang antara ide dan praktik. Saling melengkapi.' },
    'Udara-Air': { score: 75, desc: 'Intelektual bertemu emosi — butuh pengertian lebih.' },
    'Bumi-Bumi': { score: 88, desc: 'Stabil, setia, dan saling memahami. Sangat cocok!' },
    'Bumi-Air': { score: 82, desc: 'Bumi menopang air — hubungan yang stabil dan nurturing.' },
    'Air-Air': { score: 78, desc: 'Dalam secara emosi, tapi bisa terlalu sensitif.' },
};

function getCompatScore(e1, e2) {
    const key1 = `${e1}-${e2}`.replace(/🔥 |💨 |🌍 |💧 /g, '');
    const key2 = `${e2}-${e1}`.replace(/🔥 |💨 |🌍 |💧 /g, '');
    return COMPAT_MATRIX[key1] || COMPAT_MATRIX[key2] || { score: 72, desc: 'Kombinasi yang unik dan menarik!' };
}

// ─── Cari zodiak dari tanggal ─────────────────────────────────
function getZodiakFromDate(tanggal) {
    const parts = tanggal.split(/[\/\-\s]/);
    if (parts.length < 2) return null;

    let bulan, tanggalNum;
    // Format: DD/MM atau MM/DD atau DD-MM-YYYY
    if (parts[0].length <= 2 && parseInt(parts[0]) <= 31) {
        tanggalNum = parseInt(parts[0]);
        bulan = parseInt(parts[1]);
    } else {
        bulan = parseInt(parts[0]);
        tanggalNum = parseInt(parts[1]);
    }

    if (isNaN(bulan) || isNaN(tanggalNum)) return null;
    if (bulan > 12) [bulan, tanggalNum] = [tanggalNum, bulan]; // swap if needed

    for (const z of ZODIAK) {
        const [startM, startD] = z.mulai;
        const [endM, endD] = z.selesai;
        if (startM === endM) {
            if (bulan === startM && tanggalNum >= startD && tanggalNum <= endD) return z;
        } else {
            if ((bulan === startM && tanggalNum >= startD) || (bulan === endM && tanggalNum <= endD)) return z;
        }
    }
    return null;
}

// ─── Cari zodiak dari nama ────────────────────────────────────
function getZodiakFromName(nama) {
    return ZODIAK.find(z => z.nama === nama.toLowerCase().trim()) || null;
}

// ─── Generate horoskop dengan AI ─────────────────────────────
async function generateHoroskop(zodiakNama) {
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `Buat horoskop harian untuk ${zodiakNama} hari ini, ${today}.
Format:
💕 Cinta: (1-2 kalimat)
💼 Karir: (1-2 kalimat)
💰 Keuangan: (1-2 kalimat)
🏥 Kesehatan: (1-2 kalimat)
⭐ Angka Keberuntungan: (3 angka)
🎨 Warna Keberuntungan: (1 warna)
💡 Pesan Hari Ini: (1 kalimat motivasi)

Tulis dalam Bahasa Indonesia yang natural dan menarik. Variasikan isinya setiap hari.`;

    const response = await client.chat.completions.create({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
    });
    return response.choices[0]?.message?.content || 'Horoskop tidak tersedia hari ini.';
}

// ─── Data Shio ─────────────────────────────────────────────────
const SHIO = [
    { nama: 'Tikus', emoji: '🐭', tahunRef: 2020, sifat: 'Cerdas, Adaptif, Oportunis' },
    { nama: 'Kerbau', emoji: '🐂', tahunRef: 2021, sifat: 'Tekun, Setia, Keras Kepala' },
    { nama: 'Macan', emoji: '🐯', tahunRef: 2022, sifat: 'Berani, Karismatik, Impulsif' },
    { nama: 'Kelinci', emoji: '🐰', tahunRef: 2023, sifat: 'Lembut, Artistik, Sensitif' },
    { nama: 'Naga', emoji: '🐲', tahunRef: 2024, sifat: 'Ambisius, Percaya Diri, Dominan' },
    { nama: 'Ular', emoji: '🐍', tahunRef: 2025, sifat: 'Misterius, Bijak, Intuitif' },
    { nama: 'Kuda', emoji: '🐴', tahunRef: 2026, sifat: 'Energik, Bebas, Petualang' },
    { nama: 'Kambing', emoji: '🐑', tahunRef: 2015, sifat: 'Kreatif, Peka, Suka Damai' },
    { nama: 'Monyet', emoji: '🐒', tahunRef: 2016, sifat: 'Ceria, Cerdik, Tidak Bisa Diam' },
    { nama: 'Ayam', emoji: '🐔', tahunRef: 2017, sifat: 'Percaya Diri, Jujur, Perfeksionis' },
    { nama: 'Anjing', emoji: '🐕', tahunRef: 2018, sifat: 'Setia, Jujur, Suka Menolong' },
    { nama: 'Babi', emoji: '🐗', tahunRef: 2019, sifat: 'Dermawan, Optimis, Naif' },
];

function getShio(tahun) {
    const idx = ((tahun - 2020) % 12 + 12) % 12;
    return SHIO[idx];
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['zodiak', 'horoscope', 'horoskop', 'cocokan', 'cocok', 'shio'];
    if (!validCommands.includes(command)) return;

    // ══════════════════════════════════════════════════════════
    // !zodiak — Horoskop
    // ══════════════════════════════════════════════════════════
    if (['zodiak', 'horoscope', 'horoskop'].includes(command)) {
        const input = args.join(' ').trim();

        if (!input) {
            const list = ZODIAK.map(z => `${z.emoji} ${z.nama}`).join('  ');
            return msg.reply(
                `♈ *ZODIAK & HOROSKOP*\n\n` +
                `Cara pakai:\n` +
                `• \`!zodiak 25/03\` — Dari tanggal lahir\n` +
                `• \`!zodiak aries\` — Dari nama zodiak\n` +
                `• \`!cocokan aries scorpio\` — Cek kecocokan\n` +
                `• \`!shio 1995\` — Cek shio\n\n` +
                `Zodiak tersedia:\n${list}`
            );
        }

        // Deteksi apakah input adalah tanggal atau nama zodiak
        let zodiakData = null;
        if (/[\d\/\-]/.test(input)) {
            zodiakData = getZodiakFromDate(input);
        } else {
            zodiakData = getZodiakFromName(input);
        }

        if (!zodiakData) {
            return msg.reply(`❌ Tidak bisa mengenali "${input}".\n\nContoh: \`!zodiak 15/04\` atau \`!zodiak scorpio\``);
        }

        await msg.reply(`${zodiakData.emoji} _Memuat horoskop untuk ${zodiakData.nama}..._`);

        try {
            const horoskop = await generateHoroskop(zodiakData.nama);
            const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

            return msg.reply(
                `${zodiakData.emoji} *${zodiakData.nama.toUpperCase()}*\n` +
                `${'─'.repeat(30)}\n\n` +
                `🌍 Elemen: ${zodiakData.elemen}\n` +
                `🪐 Planet: ${zodiakData.planet}\n` +
                `💫 Sifat: ${zodiakData.sifat}\n\n` +
                `${'─'.repeat(25)}\n` +
                `📅 *HOROSKOP — ${today.toUpperCase()}*\n\n` +
                `${horoskop}\n\n` +
                `${'─'.repeat(20)}\n` +
                `_Cek kecocokan: \`!cocokan ${zodiakData.nama} <zodiak lain>\`_`
            );
        } catch (e) {
            console.error('Zodiak Error:', e.message);
            return msg.reply(`${zodiakData.emoji} *${zodiakData.nama.toUpperCase()}*\n\n🌍 Elemen: ${zodiakData.elemen}\n🪐 Planet: ${zodiakData.planet}\n💫 Sifat: ${zodiakData.sifat}\n\n_Horoskop sedang tidak tersedia. Coba lagi nanti._`);
        }
    }

    // ══════════════════════════════════════════════════════════
    // !cocokan <zodiak1> <zodiak2>
    // ══════════════════════════════════════════════════════════
    if (['cocokan', 'cocok'].includes(command)) {
        const z1Name = args[0]?.toLowerCase();
        const z2Name = args[1]?.toLowerCase();

        if (!z1Name || !z2Name) {
            return msg.reply('❌ Format: `!cocokan <zodiak1> <zodiak2>`\nContoh: `!cocokan aries scorpio`');
        }

        const z1 = getZodiakFromName(z1Name);
        const z2 = getZodiakFromName(z2Name);

        if (!z1) return msg.reply(`❌ Zodiak "${z1Name}" tidak dikenal.`);
        if (!z2) return msg.reply(`❌ Zodiak "${z2Name}" tidak dikenal.`);

        const elemen1 = z1.elemen.replace(/[🔥💨🌍💧] /, '');
        const elemen2 = z2.elemen.replace(/[🔥💨🌍💧] /, '');
        const compat = getCompatScore(elemen1, elemen2);

        const stars = '⭐'.repeat(Math.round(compat.score / 20));
        const bar = '🟩'.repeat(Math.round(compat.score / 10)) + '⬜'.repeat(10 - Math.round(compat.score / 10));

        return msg.reply(
            `💑 *KECOCOKAN ZODIAK*\n` +
            `${'─'.repeat(30)}\n\n` +
            `${z1.emoji} *${z1.nama.toUpperCase()}* × ${z2.emoji} *${z2.nama.toUpperCase()}*\n\n` +
            `${bar}\n` +
            `❤️ Skor Kecocokan: *${compat.score}%*\n` +
            `${stars}\n\n` +
            `💫 Elemen: ${z1.elemen} × ${z2.elemen}\n\n` +
            `📖 Analisis:\n_"${compat.desc}"_\n\n` +
            `${'─'.repeat(25)}\n` +
            `💡 Ingat: Zodiak hanyalah hiburan!\n` +
            `Yang terpenting adalah komunikasi & usaha bersama. 💙`
        );
    }

    // ══════════════════════════════════════════════════════════
    // !shio <tahun>
    // ══════════════════════════════════════════════════════════
    if (command === 'shio') {
        const tahun = parseInt(args[0]);

        if (!tahun || isNaN(tahun) || tahun < 1900 || tahun > 2100) {
            return msg.reply(
                `🐉 *SHIO TIONGHOA*\n\n` +
                `Format: \`!shio <tahun_lahir>\`\n` +
                `Contoh: \`!shio 1995\`\n\n` +
                `Shio mengikuti siklus 12 hewan berdasarkan kalender lunar Tionghoa.`
            );
        }

        const shio = getShio(tahun);

        return msg.reply(
            `🐉 *SHIO TIONGHOA*\n` +
            `${'─'.repeat(25)}\n\n` +
            `${shio.emoji} Shio kamu: *${shio.nama.toUpperCase()}*\n\n` +
            `📅 Tahun: ${tahun}\n` +
            `💫 Sifat: ${shio.sifat}\n\n` +
            `${'─'.repeat(20)}\n` +
            `Orang terkenal shio ${shio.nama}: Banyak tokoh besar! 🌟`
        );
    }
};
