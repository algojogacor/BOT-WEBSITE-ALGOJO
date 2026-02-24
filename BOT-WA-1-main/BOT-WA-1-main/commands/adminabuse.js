// ============================================================
//  🎉 ADMIN ABUSE EVENT SYSTEM  v2.2
//  - Otomatis aktif di SEMUA grup whitelist sekaligus
//  - Hanya admin grup ATAU owner bot yang bisa trigger
//  - Trigger: !adminabuseon / !adminabuseoff
//  - Duration: 30 menit, ganti event tiap 1 menit otomatis
//  - 10 Event Random: Ekonomi, Mining, Farming, Game, Kompetisi
//  - Hadiah disesuaikan ekonomi 3 Miliar
//  - Meteor / Tebak / Balapan: auto-restart setelah ada pemenang
// ============================================================

const { saveDB } = require('../helpers/database');
const fmt = (num) => Math.floor(Number(num) || 0).toLocaleString('id-ID');

// ============================================================
//  KONFIGURASI
// ============================================================

const ALL_GROUPS = [
    '120363310599817766@g.us',
    '120363328759898377@g.us',
];

const OWNER_ID = '244203384742140@lid';

const EVENT_DURATION = 30 * 60 * 1000;  // 30 menit total
const INTERVAL       =  1 * 60 * 1000;  // rotasi tiap 1 menit

// ============================================================
//  POOL HADIAH — Disesuaikan ekonomi 3 Miliar
// ============================================================

// Hujan Uang: per user
const HUJAN_MIN = 5_000_000;
const HUJAN_MAX = 30_000_000;

// Jackpot Bersama: kontribusi per user
const JACKPOT_KONTRIBUSI = 500_000;

// Meteor Langka: pool reward bervariasi dengan weighted rarity
const METEOR_REWARDS = [
    { nama: '🪨 Batu Biasa',        nilai: 10_000_000,    rarity: 'Common',    emoji: '⬜' },
    { nama: '🥈 Silver Ore',        nilai: 30_000_000,    rarity: 'Common',    emoji: '⬜' },
    { nama: '🏅 Gold Ore',          nilai: 75_000_000,    rarity: 'Uncommon',  emoji: '🟩' },
    { nama: '💎 Diamond',           nilai: 150_000_000,   rarity: 'Rare',      emoji: '🟦' },
    { nama: '⚡ Energy Crystal',    nilai: 250_000_000,   rarity: 'Rare',      emoji: '🟦' },
    { nama: '🔮 Magic Shard',       nilai: 400_000_000,   rarity: 'Epic',      emoji: '🟪' },
    { nama: '🌑 Dark Matter',       nilai: 600_000_000,   rarity: 'Epic',      emoji: '🟪' },
    { nama: '☀️ Solar Core',        nilai: 900_000_000,   rarity: 'Legendary', emoji: '🟧' },
    { nama: '🌌 Void Crystal',      nilai: 1_500_000_000, rarity: 'Mythic',    emoji: '🔴' },
];
// Makin langka = makin kecil weight (total 100)
const METEOR_WEIGHTS = [20, 18, 15, 12, 10, 8, 7, 6, 4];

function pickMeteor() {
    const total = METEOR_WEIGHTS.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < METEOR_REWARDS.length; i++) {
        r -= METEOR_WEIGHTS[i];
        if (r <= 0) return METEOR_REWARDS[i];
    }
    return METEOR_REWARDS[0];
}

// Tebak Berhadiah: range hadiah per tingkat
const TEBAK_HADIAH = {
    easy:   [20_000_000,  50_000_000],
    medium: [75_000_000,  200_000_000],
    hard:   [250_000_000, 600_000_000],
};

// Balapan Klik: range hadiah (kata panjang = multiplier lebih besar)
const BALAPAN_HADIAH_MIN = 50_000_000;
const BALAPAN_HADIAH_MAX = 300_000_000;

// Lomba Aktif: hadiah pemenang
const LOMBA_HADIAH_MIN = 100_000_000;
const LOMBA_HADIAH_MAX = 500_000_000;

// Duel Bonus: bonus per menang duel
const DUEL_BONUS = 50_000_000;

// ============================================================
//  HELPER: Acak antara min dan max
// ============================================================
function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================================
//  STATE GLOBAL
// ============================================================
if (!global.abuseState) {
    global.abuseState = {
        active:       false,
        currentEvent: null,
        eventData:    {},
        mainTimer:    null,
        intervalRef:  null,
        sock:         null,
        db:           null,
        eventQueue:   [],
        eventIndex:   0,
        startTime:    null,
    };
}

// ============================================================
//  HELPER: Broadcast ke semua grup
// ============================================================
async function broadcast(text, mentions = []) {
    const sock = global.abuseState.sock;
    if (!sock) return;
    for (const gid of ALL_GROUPS) {
        try {
            await sock.sendMessage(gid, { text, mentions });
        } catch (e) {
            console.error(`[AdminAbuse] Gagal kirim ke ${gid}:`, e.message);
        }
    }
}

// ============================================================
//  HELPER: Kirim ke 1 grup spesifik
// ============================================================
async function sendToGroup(groupId, text, mentions = []) {
    try {
        await global.abuseState.sock?.sendMessage(groupId, { text, mentions });
    } catch(e) {}
}

// ============================================================
//  HELPER: Cek admin grup
// ============================================================
async function isGroupAdmin(sock, groupId, senderJid) {
    if (senderJid === OWNER_ID) return true;
    try {
        const meta = await sock.groupMetadata(groupId);
        const admins = meta.participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);
        return admins.includes(senderJid);
    } catch (e) {
        console.error('[AdminAbuse] Gagal cek admin:', e.message);
        return false;
    }
}

// ============================================================
//  HELPER: Acak urutan 10 event
// ============================================================
const EVENT_LIST = [
    'hujan_uang', 'jackpot_bersama', 'borong_pasar', 'meteor_langka',
    'musim_panen', 'rush_tambang', 'duel_berhadiah',
    'tebak_berhadiah', 'balapan_klik', 'lomba_aktif',
];

function shuffleEvents() {
    const arr = [...EVENT_LIST];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ============================================================
//  GENERATOR SOAL TEBAK
// ============================================================
const SOAL_POOL = {
    easy: [
        { soal: 'Ibukota Indonesia?',                        jawaban: 'jakarta',     alt: [] },
        { soal: 'Berapa 25 x 4?',                           jawaban: '100',          alt: [] },
        { soal: 'Berapa sisi pada segitiga?',                jawaban: '3',            alt: ['tiga'] },
        { soal: 'Warna campuran merah + biru?',              jawaban: 'ungu',         alt: ['purple', 'violet'] },
        { soal: 'Jumlah pemain bola dalam 1 tim?',           jawaban: '11',           alt: ['sebelas'] },
        { soal: 'Apa nama bulan ke-8?',                      jawaban: 'agustus',      alt: ['august'] },
        { soal: 'Berapa 100 dibagi 4?',                      jawaban: '25',           alt: ['dua puluh lima'] },
        { soal: 'Berapa 15 x 15?',                           jawaban: '225',          alt: [] },
        { soal: 'Berapa 7 x 8?',                             jawaban: '56',           alt: ['lima puluh enam'] },
        { soal: 'Ibu kota Jawa Barat?',                      jawaban: 'bandung',      alt: [] },
        { soal: 'Nama presiden RI ke-1?',                    jawaban: 'soekarno',     alt: ['sukarno'] },
        { soal: 'Berapa 50 + 75?',                           jawaban: '125',          alt: [] },
        { soal: 'Planet ke-3 dari matahari?',                jawaban: 'bumi',         alt: ['earth'] },
        { soal: 'Warna bendera Indonesia bagian atas?',      jawaban: 'merah',        alt: ['red'] },
        { soal: 'Berapa 12 x 12?',                           jawaban: '144',          alt: [] },
        { soal: 'Berapa 200 - 88?',                          jawaban: '112',          alt: [] },
        { soal: 'Hewan yang bisa terbang selain burung?',    jawaban: 'kelelawar',    alt: ['bat'] },
        { soal: 'Apa warna daun pada umumnya?',              jawaban: 'hijau',        alt: ['green'] },
    ],
    medium: [
        { soal: 'Hewan darat terbesar di dunia?',            jawaban: 'gajah',        alt: ['elephant'] },
        { soal: 'Simbol kimia untuk emas?',                  jawaban: 'au',           alt: ['gold'] },
        { soal: 'Berapa 2 pangkat 10?',                      jawaban: '1024',         alt: [] },
        { soal: 'Siapa penemu lampu bohlam?',                jawaban: 'edison',       alt: ['thomas edison'] },
        { soal: 'Bahasa resmi Brazil?',                      jawaban: 'portugis',     alt: ['portuguese', 'portugues'] },
        { soal: 'Mata uang negara Jepang?',                  jawaban: 'yen',          alt: ['jen'] },
        { soal: 'Bahasa pemrograman buatan Guido van Rossum?', jawaban: 'python',     alt: [] },
        { soal: 'Ibu kota Australia?',                       jawaban: 'canberra',     alt: [] },
        { soal: 'Berapa jumlah huruf alfabet?',              jawaban: '26',           alt: ['dua puluh enam'] },
        { soal: 'Apa rumus kimia air?',                      jawaban: 'h2o',          alt: ['h₂o'] },
        { soal: 'Negara terkecil di dunia?',                 jawaban: 'vatikan',      alt: ['vatican'] },
        { soal: 'Simbol kimia untuk besi?',                  jawaban: 'fe',           alt: ['iron'] },
        { soal: 'Gunung tertinggi di Indonesia?',            jawaban: 'puncak jaya',  alt: ['carstensz', 'jayawijaya'] },
        { soal: 'Berapa derajat dalam 1 lingkaran penuh?',   jawaban: '360',          alt: [] },
        { soal: 'Nama sungai terpanjang di dunia?',          jawaban: 'nil',          alt: ['nile'] },
        { soal: 'Siapa pendiri Facebook?',                   jawaban: 'mark zuckerberg', alt: ['zuckerberg'] },
        { soal: 'Berapa 999 + 1?',                           jawaban: '1000',         alt: ['seribu', 'one thousand'] },
        { soal: 'Tahun berapa Piala Dunia pertama?',         jawaban: '1930',         alt: [] },
    ],
    hard: [
        { soal: 'Planet terdekat dengan Matahari?',          jawaban: 'merkurius',    alt: ['merkuri', 'mercury'] },
        { soal: 'Siapa pencipta teori relativitas?',         jawaban: 'einstein',     alt: ['albert einstein'] },
        { soal: 'Unsur kimia dengan nomor atom 79?',         jawaban: 'emas',         alt: ['gold', 'au'] },
        { soal: 'Berapa kecepatan cahaya? (km/s)',           jawaban: '300000',       alt: ['300.000', '299792'] },
        { soal: 'Siapa pendiri Microsoft?',                  jawaban: 'bill gates',   alt: ['william gates'] },
        { soal: 'DNA singkatan dari?',                       jawaban: 'deoxyribonucleic acid', alt: ['asam deoksiribonukleat'] },
        { soal: 'Berapa jumlah kromosom manusia?',           jawaban: '46',           alt: ['empat puluh enam'] },
        { soal: 'Siapa yang menulis novel "1984"?',          jawaban: 'george orwell',alt: ['orwell'] },
        { soal: 'Berapa 2 pangkat 16?',                      jawaban: '65536',        alt: [] },
        { soal: 'Siapa penemu penicillin?',                  jawaban: 'fleming',      alt: ['alexander fleming'] },
        { soal: 'Mata uang negara Korea Selatan?',           jawaban: 'won',          alt: ['korean won'] },
        { soal: 'Berapa 17 x 17?',                           jawaban: '289',          alt: [] },
        { soal: 'Negara mana yang pertama mendarat di bulan?', jawaban: 'amerika',    alt: ['usa', 'as', 'united states', 'amerika serikat'] },
        { soal: 'Siapa yang melukis Mona Lisa?',             jawaban: 'da vinci',     alt: ['leonardo da vinci', 'leonardo'] },
        { soal: 'Berapa unsur dalam tabel periodik modern?', jawaban: '118',          alt: [] },
        { soal: 'Apa nama tulang terkecil dalam tubuh manusia?', jawaban: 'sanggurdi', alt: ['stapes'] },
        { soal: 'Berapa jumlah negara anggota PBB saat ini?', jawaban: '193',        alt: [] },
    ],
};

function generateSoal() {
    const roll = Math.random();
    let tingkat;
    if (roll < 0.4)      tingkat = 'easy';
    else if (roll < 0.75) tingkat = 'medium';
    else                  tingkat = 'hard';

    const pool  = SOAL_POOL[tingkat];
    const pilih = pool[Math.floor(Math.random() * pool.length)];
    const range = TEBAK_HADIAH[tingkat];
    const hadiah = randBetween(range[0], range[1]);
    return { soal: pilih.soal, jawaban: pilih.jawaban, alt: pilih.alt || [], hadiah, tingkat };
}

// ============================================================
//  GENERATOR KATA BALAPAN
// ============================================================
const KATA_POOL = [
    // Pendek 4-5 huruf → multiplier 1x
    { kata: 'SULTAN', len: 'short' }, { kata: 'CUAN', len: 'short' },
    { kata: 'BOSS', len: 'short' },   { kata: 'FOMO', len: 'short' },
    { kata: 'WIBU', len: 'short' },   { kata: 'GACOR', len: 'short' },
    // Sedang 6-8 huruf → multiplier 1.5x
    { kata: 'GASKEUN', len: 'mid' },  { kata: 'JACKPOT', len: 'mid' },
    { kata: 'MANTAP', len: 'mid' },   { kata: 'MAXWIN', len: 'mid' },
    { kata: 'LEGEND', len: 'mid' },   { kata: 'CRYPTO', len: 'mid' },
    { kata: 'DIAMOND', len: 'mid' },  { kata: 'TRENDING', len: 'mid' },
    // Panjang 9+ huruf → multiplier 2.5x
    { kata: 'INDONESIA', len: 'long' },    { kata: 'MERDEKA', len: 'long' },
    { kata: 'SEMANGAT', len: 'long' },     { kata: 'KEMENANGAN', len: 'long' },
    { kata: 'SPEKTAKULER', len: 'long' },  { kata: 'MILIARDER', len: 'long' },
    { kata: 'FANTASTIS', len: 'long' },    { kata: 'GEMILANG', len: 'long' },
];

const MULT_MAP = { short: 1, mid: 1.5, long: 2.5 };

function generateKataBalapan() {
    const pick = KATA_POOL[Math.floor(Math.random() * KATA_POOL.length)];
    const base  = randBetween(BALAPAN_HADIAH_MIN, BALAPAN_HADIAH_MAX);
    const hadiah = Math.floor(base * MULT_MAP[pick.len]);
    return { kata: pick.kata, hadiah };
}

// ============================================================
//  AUTO-RESTART HELPERS
// ============================================================

function spawnMeteorBaru(groupId) {
    const state = global.abuseState;
    const delay = randBetween(5000, 12000); // 5–12 detik
    setTimeout(async () => {
        if (!state.active || state.currentEvent !== 'meteor_langka') return;
        const pilihan = pickMeteor();
        if (!state.eventData.meteorPerGrup) state.eventData.meteorPerGrup = {};
        state.eventData.meteorPerGrup[groupId] = { reward: pilihan, claimed: false };
        await sendToGroup(groupId,
            `☄️ *METEOR BARU JATUH!*\n\n` +
            `${pilihan.emoji} Rarity: *${pilihan.rarity}*\n` +
            `💰 ${pilihan.nama} → *${fmt(pilihan.nilai)} koin*\n\n` +
            `⚡ Ketik *KLAIM* sekarang!`
        );
    }, delay);
}

function spawnTebakBaru(groupId) {
    const state = global.abuseState;
    const delay = randBetween(20000, 30000); // 3–7 detik
    setTimeout(async () => {
        if (!state.active || state.currentEvent !== 'tebak_berhadiah') return;
        const { soal, jawaban, alt, hadiah, tingkat } = generateSoal();
        if (!state.eventData.tebakPerGrup) state.eventData.tebakPerGrup = {};
        state.eventData.tebakPerGrup[groupId] = { jawaban, alt, hadiah, answered: false };
        const lvlEmoji = tingkat === 'hard' ? '🔴 HARD' : tingkat === 'medium' ? '🟡 MEDIUM' : '🟢 EASY';
        await sendToGroup(groupId,
            `🧠 *SOAL BARU!* ${lvlEmoji}\n\n` +
            `❓ *${soal}*\n\n` +
            `💰 Hadiah: *${fmt(hadiah)} koin!*\n` +
            `💡 Ketik jawabanmu langsung!`
        );
    }, delay);
}

function spawnBalapanBaru(groupId) {
    const state = global.abuseState;
    const delay = randBetween(3000, 8000); // 3–8 detik
    setTimeout(async () => {
        if (!state.active || state.currentEvent !== 'balapan_klik') return;
        const { kata, hadiah } = generateKataBalapan();
        if (!state.eventData.balapanPerGrup) state.eventData.balapanPerGrup = {};
        state.eventData.balapanPerGrup[groupId] = { kata, hadiah, claimed: false };
        await sendToGroup(groupId,
            `⚡ *RONDE BARU!*\n\n` +
            `⌨️ Ketik kata ini SEKARANG:\n` +
            `╔══════════════╗\n` +
            `║   *${kata}*   ║\n` +
            `╚══════════════╝\n\n` +
            `💰 Hadiah: *${fmt(hadiah)} koin!*\n` +
            `🔥 Harus PERSIS & KAPITAL!`
        );
    }, delay);
}

// ============================================================
//  MULAI EVENT BERIKUTNYA
// ============================================================
async function startNextEvent() {
    const state = global.abuseState;
    if (!state.active) return;

    const db        = state.db;
    const eventName = state.eventQueue[state.eventIndex % state.eventQueue.length];
    state.eventIndex++;
    state.currentEvent = eventName;
    state.eventData    = {};

    const sisaMenit = Math.ceil((EVENT_DURATION - (Date.now() - state.startTime)) / 60000);
    console.log(`[AdminAbuse] 🎲 Event: ${eventName}`);

    switch (eventName) {

        // ── 1. HUJAN UANG ────────────────────────────────────
        case 'hujan_uang': {
            let bonus = 0, topList = [];
            for (const jid in db.users) {
                const reward = randBetween(HUJAN_MIN, HUJAN_MAX);
                db.users[jid].balance = (db.users[jid].balance || 0) + reward;
                bonus += reward;
                topList.push({ jid, reward });
            }
            saveDB(db);
            const tampil = topList
                .sort((a, b) => b.reward - a.reward)
                .slice(0, 8)
                .map(x => `• @${x.jid.split('@')[0]}: +💰${fmt(x.reward)}`)
                .join('\n');
            await broadcast(
                `🌧️ *EVENT: HUJAN UANG!* 🌧️\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Koin berjatuhan dari langit!\n\n` +
                `${tampil}${topList.length > 8 ? `\n...dan ${topList.length - 8} lainnya` : ''}\n\n` +
                `💰 Total hujan: *${fmt(bonus)} koin!*\n` +
                `⏱️ Sisa event: *${sisaMenit} menit*`,
                topList.slice(0, 8).map(x => x.jid)
            );
            break;
        }

        // ── 2. JACKPOT BERSAMA ───────────────────────────────
        case 'jackpot_bersama': {
            let pot = 0, peserta = [];
            for (const jid in db.users) {
                if ((db.users[jid].balance || 0) >= JACKPOT_KONTRIBUSI) {
                    db.users[jid].balance -= JACKPOT_KONTRIBUSI;
                    pot += JACKPOT_KONTRIBUSI;
                    peserta.push(jid);
                }
            }
            if (peserta.length === 0) {
                await broadcast(`🎰 *JACKPOT BERSAMA* — Tidak ada yang cukup saldo. Event dilewati!`);
                break;
            }
            const winnerJid = peserta[Math.floor(Math.random() * peserta.length)];
            db.users[winnerJid].balance += pot;
            saveDB(db);
            await broadcast(
                `🎰 *EVENT: JACKPOT BERSAMA!* 🎰\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Semua member taruh 💰${fmt(JACKPOT_KONTRIBUSI)} ke dalam pot!\n\n` +
                `👥 Peserta: *${peserta.length} orang*\n` +
                `💰 Total Pot: *${fmt(pot)} koin*\n\n` +
                `🎊 *PEMENANG: @${winnerJid.split('@')[0]}*\n` +
                `🏆 Menang: *${fmt(pot)} koin!*\n\n` +
                `⏱️ Sisa event: *${sisaMenit} menit*`,
                [winnerJid]
            );
            break;
        }

        // ── 3. BORONG PASAR ──────────────────────────────────
        case 'borong_pasar': {
            if (!db.settings) db.settings = {};
            db.settings.borongPasar       = true;
            db.settings.borongPasarUntil  = Date.now() + INTERVAL;
            db.settings.borongPasarDiskon = 20;
            saveDB(db);
            state.eventData.borongPasar = true;
            await broadcast(
                `🛒 *EVENT: BORONG PASAR!* 🛒\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `DISKON BESAR-BESARAN SELAMA 1 MENIT!\n\n` +
                `💥 Semua item toko: *DISKON 20%*\n` +
                `🌾 Bibit pertanian: *DISKON 20%*\n` +
                `🐄 Hewan ternak: *DISKON 20%*\n` +
                `⛏️ Hardware mining: *DISKON 20%*\n\n` +
                `⚠️ Belanja sekarang! Berakhir dalam 1 menit!`
            );
            break;
        }

        // ── 4. METEOR LANGKA ─────────────────────────────────
        case 'meteor_langka': {
            state.eventData.meteorPerGrup = {};
            // Spawn meteor awal berbeda untuk tiap grup
            for (const gid of ALL_GROUPS) {
                const pilihan = pickMeteor();
                state.eventData.meteorPerGrup[gid] = { reward: pilihan, claimed: false };
            }
            // Broadcast info umum
            await broadcast(
                `☄️ *EVENT: METEOR LANGKA JATUH!* ☄️\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Meteor jatuh di setiap grup!\n` +
                `Rarity berbeda di tiap grup!\n\n` +
                `📋 *Tabel Rarity:*\n` +
                `⬜ Common    → 10–30 Juta\n` +
                `🟩 Uncommon  → 75 Juta\n` +
                `🟦 Rare      → 150–250 Juta\n` +
                `🟪 Epic      → 400–600 Juta\n` +
                `🟧 Legendary → 900 Juta\n` +
                `🔴 Mythic    → 1.5 Miliar!\n\n` +
                `⚡ Ketik *KLAIM* sekarang!\n` +
                `♻️ Meteor baru muncul otomatis setelah diklaim!`
            );
            // Kirim detail meteor per grup
            for (const gid of ALL_GROUPS) {
                const m = state.eventData.meteorPerGrup[gid].reward;
                await sendToGroup(gid,
                    `☄️ *METEOR DI GRUP INI:*\n` +
                    `${m.emoji} Rarity: *${m.rarity}*\n` +
                    `💎 ${m.nama}\n` +
                    `💰 Nilai: *${fmt(m.nilai)} koin*\n\n` +
                    `⚡ Ketik *KLAIM* sekarang!`
                );
            }
            break;
        }

        // ── 5. MUSIM PANEN ───────────────────────────────────
        case 'musim_panen': {
            if (!db.settings) db.settings = {};
            db.settings.musimPanen      = true;
            db.settings.musimPanenUntil = Date.now() + INTERVAL;
            db.settings.musimPanenMult  = 3;
            saveDB(db);
            state.eventData.musimPanen = true;
            await broadcast(
                `🌾 *EVENT: MUSIM PANEN RAYA!* 🌾\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Alam sedang berbaik hati!\n\n` +
                `🐔 Hasil ternak: *3x LIPAT*\n` +
                `🌱 Hasil farming: *3x LIPAT*\n` +
                `🐟 Jual ikan: *3x LIPAT*\n\n` +
                `🏃 Segera panen sekarang!\n` +
                `Ketik *!panen* atau *!jualternak*\n\n` +
                `⏱️ Berlaku selama 1 menit!`
            );
            break;
        }

        // ── 6. RUSH TAMBANG ──────────────────────────────────
        case 'rush_tambang': {
            if (!db.settings) db.settings = {};
            db.settings.rushTambang      = true;
            db.settings.rushTambangUntil = Date.now() + INTERVAL;
            saveDB(db);
            state.eventData.rushTambang = true;
            await broadcast(
                `⛏️ *EVENT: RUSH TAMBANG!* ⛏️\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Urat mineral langka terdeteksi!\n\n` +
                `🔥 *COOLDOWN MINING = 0!*\n` +
                `🔥 *HASIL MINING = 5x LIPAT!*\n` +
                `🔥 *Listrik GRATIS!*\n\n` +
                `Ketik *!claimmining* terus-terusan!\n\n` +
                `⏱️ Berlaku selama 1 menit!`
            );
            break;
        }

        // ── 7. DUEL BERHADIAH ────────────────────────────────
        case 'duel_berhadiah': {
            if (!db.settings) db.settings = {};
            db.settings.duelBonus      = DUEL_BONUS;
            db.settings.duelBonusUntil = Date.now() + INTERVAL;
            saveDB(db);
            state.eventData.duelBonus = DUEL_BONUS;
            await broadcast(
                `⚔️ *EVENT: DUEL BERHADIAH!* ⚔️\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Arena duel dibuka spesial!\n\n` +
                `🏆 Setiap menang duel:\n` +
                `💰 *+${fmt(DUEL_BONUS)} KOIN BONUS*\n` +
                `(Di luar hadiah duel normal)\n\n` +
                `🤺 Ketik *!duel @user <taruhan>*\n\n` +
                `⏱️ Berlaku selama 1 menit!`
            );
            break;
        }

        // ── 8. TEBAK BERHADIAH ───────────────────────────────
        case 'tebak_berhadiah': {
            state.eventData.tebakPerGrup = {};
            // Generate soal berbeda per grup
            for (const gid of ALL_GROUPS) {
                const { soal, jawaban, alt, hadiah, tingkat } = generateSoal();
                state.eventData.tebakPerGrup[gid] = { soal, jawaban, alt, hadiah, tingkat, answered: false };
            }
            // Broadcast info umum
            await broadcast(
                `🧠 *EVENT: TEBAK BERHADIAH!* 🧠\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Soal berbeda di setiap grup!\n\n` +
                `🟢 Easy   → ${fmt(TEBAK_HADIAH.easy[0])} – ${fmt(TEBAK_HADIAH.easy[1])}\n` +
                `🟡 Medium → ${fmt(TEBAK_HADIAH.medium[0])} – ${fmt(TEBAK_HADIAH.medium[1])}\n` +
                `🔴 Hard   → ${fmt(TEBAK_HADIAH.hard[0])} – ${fmt(TEBAK_HADIAH.hard[1])}\n\n` +
                `♻️ Soal baru otomatis muncul setelah dijawab!`
            );
            // Kirim soal per grup
            for (const gid of ALL_GROUPS) {
                const d = state.eventData.tebakPerGrup[gid];
                const lvlEmoji = d.tingkat === 'hard' ? '🔴 HARD' : d.tingkat === 'medium' ? '🟡 MEDIUM' : '🟢 EASY';
                await sendToGroup(gid,
                    `🧠 *SOAL UNTUK GRUP INI:* ${lvlEmoji}\n\n` +
                    `❓ *${d.soal}*\n\n` +
                    `💰 Hadiah: *${fmt(d.hadiah)} koin!*\n` +
                    `💡 Ketik jawabanmu langsung!`
                );
            }
            break;
        }

        // ── 9. BALAPAN KLIK ──────────────────────────────────
        case 'balapan_klik': {
            state.eventData.balapanPerGrup = {};
            // Kata berbeda per grup
            for (const gid of ALL_GROUPS) {
                const { kata, hadiah } = generateKataBalapan();
                state.eventData.balapanPerGrup[gid] = { kata, hadiah, claimed: false };
            }
            // Broadcast info umum
            await broadcast(
                `⚡ *EVENT: BALAPAN KLIK!* ⚡\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Kata berbeda di setiap grup!\n` +
                `Makin panjang kata → Makin besar hadiah!\n\n` +
                `📏 Pendek (4-5 hruf):  ${fmt(BALAPAN_HADIAH_MIN)} – ${fmt(Math.floor(BALAPAN_HADIAH_MAX * 1))}\n` +
                `📏 Sedang (6-8 huruf): s/d ${fmt(Math.floor(BALAPAN_HADIAH_MAX * 1.5))}\n` +
                `📏 Panjang (9+ huruf): s/d ${fmt(Math.floor(BALAPAN_HADIAH_MAX * 2.5))}\n\n` +
                `♻️ Kata baru otomatis muncul setelah diklaim!`
            );
            // Kirim kata per grup
            for (const gid of ALL_GROUPS) {
                const d = state.eventData.balapanPerGrup[gid];
                await sendToGroup(gid,
                    `⚡ *KATA UNTUK GRUP INI:*\n` +
                    `╔══════════════╗\n` +
                    `║   *${d.kata}*   ║\n` +
                    `╚══════════════╝\n\n` +
                    `💰 Hadiah: *${fmt(d.hadiah)} koin!*\n` +
                    `🔥 Ketik PERSIS & KAPITAL sekarang!`
                );
            }
            break;
        }

        // ── 10. LOMBA AKTIF ──────────────────────────────────
        case 'lomba_aktif': {
            const hadiah = randBetween(LOMBA_HADIAH_MIN, LOMBA_HADIAH_MAX);
            state.eventData.lombaActive = true;
            state.eventData.lombaSkor   = {};
            state.eventData.lombaHadiah = hadiah;
            await broadcast(
                `📊 *EVENT: LOMBA AKTIF!* 📊\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Siapa yang paling banyak ngobrol menang!\n\n` +
                `💬 Kirim pesan sebanyak-banyaknya!\n` +
                `⏱️ Durasi: *1 menit*\n\n` +
                `🏆 Hadiah pemenang per grup:\n` +
                `💰 *${fmt(hadiah)} koin!*\n\n` +
                `🏃 MULAI SEKARANG!`
            );
            break;
        }
    }
}

// ============================================================
//  RESOLVE LOMBA AKTIF
// ============================================================
async function resolveLombaAktif() {
    const state = global.abuseState;
    const db    = state.db;
    const skor  = state.eventData.lombaSkor || {};
    const keys  = Object.keys(skor);
    if (keys.length === 0) {
        await broadcast(`🏁 *LOMBA AKTIF — SELESAI!*\n\nTidak ada yang kirim pesan. Tidak ada pemenang.`);
        return;
    }
    const winJid = keys.reduce((a, b) => skor[a] > skor[b] ? a : b);
    const hadiah = state.eventData.lombaHadiah;
    if (db.users[winJid]) db.users[winJid].balance = (db.users[winJid].balance || 0) + hadiah;
    saveDB(db);
    await broadcast(
        `🏁 *LOMBA AKTIF — SELESAI!*\n\n` +
        `🏆 Pemenang: @${winJid.split('@')[0]}\n` +
        `💬 Total chat: *${skor[winJid]} pesan*\n` +
        `💰 Hadiah: *${fmt(hadiah)} koin!*`,
        [winJid]
    );
}

// ============================================================
//  STOP SEMUA EVENT (cleanup)
// ============================================================
async function stopEvent(reason = 'auto') {
    const state = global.abuseState;
    if (!state.active) return;

    const db = state.db;

    if (state.currentEvent === 'lomba_aktif' && state.eventData.lombaActive) {
        await resolveLombaAktif();
    }

    if (db && db.settings) {
        const flags = [
            'borongPasar','borongPasarUntil','borongPasarDiskon',
            'musimPanen','musimPanenUntil','musimPanenMult',
            'rushTambang','rushTambangUntil',
            'duelBonus','duelBonusUntil',
        ];
        flags.forEach(f => delete db.settings[f]);
        saveDB(db);
    }

    state.active       = false;
    state.currentEvent = null;
    state.eventData    = {};
    state.eventIndex   = 0;
    state.eventQueue   = [];
    state.startTime    = null;
    state.sock         = null;
    state.db           = null;

    const alasan = reason === 'manual' ? 'Dihentikan oleh admin.' : 'Waktu 30 menit telah habis.';
    await broadcast(
        `🔴 *ADMIN ABUSE EVENT — SELESAI!* 🔴\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `${alasan}\n\n` +
        `Semua event telah berakhir.\n` +
        `Terima kasih sudah berpartisipasi! 🎉`
    );
}

// ============================================================
//  HANDLER PESAN INTERAKTIF
// ============================================================
const handleInteractive = async (body, sender, groupId, db) => {
    if (!ALL_GROUPS.includes(groupId)) return;
    const state = global.abuseState;
    if (!state.active || !state.currentEvent) return;

    const txtLower = (body || '').toLowerCase().trim();
    const data     = state.eventData;

    // ── METEOR LANGKA ─────────────────────────────────────
    if (state.currentEvent === 'meteor_langka') {
        if (!data.meteorPerGrup) return;
        const meteorGrup = data.meteorPerGrup[groupId];
        if (!meteorGrup || meteorGrup.claimed) return;

        if (txtLower === 'klaim') {
            meteorGrup.claimed = true;
            const nilai = meteorGrup.reward.nilai;
            if (db.users[sender]) db.users[sender].balance = (db.users[sender].balance || 0) + nilai;
            saveDB(db);
            await sendToGroup(groupId,
                `☄️ *METEOR DIKLAIM!*\n\n` +
                `@${sender.split('@')[0]} berhasil klaim!\n` +
                `${meteorGrup.reward.emoji} *${meteorGrup.reward.rarity}* — ${meteorGrup.reward.nama}\n` +
                `💰 *+${fmt(nilai)} koin*\n\n` +
                `♻️ Meteor baru muncul dalam beberapa detik...`,
                [sender]
            );
            spawnMeteorBaru(groupId);
        }
        return;
    }

    // ── TEBAK BERHADIAH ───────────────────────────────────
    if (state.currentEvent === 'tebak_berhadiah') {
        if (!data.tebakPerGrup) return;
        const tebakGrup = data.tebakPerGrup[groupId];
        if (!tebakGrup || tebakGrup.answered) return;

        const corrects = [tebakGrup.jawaban, ...(tebakGrup.alt || [])];
        if (corrects.includes(txtLower)) {
            tebakGrup.answered = true;
            const hadiah = tebakGrup.hadiah;
            if (db.users[sender]) db.users[sender].balance = (db.users[sender].balance || 0) + hadiah;
            saveDB(db);
            await sendToGroup(groupId,
                `🧠 *JAWABAN BENAR!*\n\n` +
                `🏆 @${sender.split('@')[0]} menjawab benar!\n` +
                `✅ Jawaban: *${tebakGrup.jawaban}*\n` +
                `💰 Menang: *+${fmt(hadiah)} koin!*\n\n` +
                `♻️ Soal baru muncul dalam beberapa detik...`,
                [sender]
            );
            spawnTebakBaru(groupId);
        }
        return;
    }

    // ── BALAPAN KLIK ─────────────────────────────────────
    if (state.currentEvent === 'balapan_klik') {
        if (!data.balapanPerGrup) return;
        const balapanGrup = data.balapanPerGrup[groupId];
        if (!balapanGrup || balapanGrup.claimed) return;

        if ((body || '').trim() === balapanGrup.kata) {
            balapanGrup.claimed = true;
            const hadiah = balapanGrup.hadiah;
            if (db.users[sender]) db.users[sender].balance = (db.users[sender].balance || 0) + hadiah;
            saveDB(db);
            await sendToGroup(groupId,
                `⚡ *PALING CEPAT!*\n\n` +
                `⚡ @${sender.split('@')[0]} paling cepat!\n` +
                `🔤 Kata: *${balapanGrup.kata}*\n` +
                `💰 Menang: *+${fmt(hadiah)} koin!*\n\n` +
                `♻️ Kata baru muncul dalam beberapa detik...`,
                [sender]
            );
            spawnBalapanBaru(groupId);
        }
        return;
    }

    // ── LOMBA AKTIF: hitung chat ──────────────────────────
    if (state.currentEvent === 'lomba_aktif' && data.lombaActive) {
        if (!data.lombaSkor[sender]) data.lombaSkor[sender] = 0;
        data.lombaSkor[sender]++;
        return;
    }
};

// ============================================================
//  COMMAND HANDLER UTAMA
// ============================================================
const adminAbuseCmd = async (command, args, msg, user, db, sock) => {
    const validCommands = ['adminabuseon', 'adminabuseoff', 'abuseinfo'];
    if (!validCommands.includes(command)) return;

    const groupId = msg.from;
    const sender  = msg.author || msg.key?.participant || msg.key?.remoteJid;

    const boleh = await isGroupAdmin(sock, groupId, sender);
    if (!boleh) {
        return msg.reply(
            `❌ *Akses Ditolak!*\n\n` +
            `Hanya *admin grup* yang bisa menggunakan command ini.`
        );
    }

    if (command === 'adminabuseon') {
        if (global.abuseState.active) {
            const sisaMs  = EVENT_DURATION - (Date.now() - global.abuseState.startTime);
            const sisaMnt = Math.ceil(sisaMs / 60000);
            return msg.reply(`⚠️ Event sudah aktif! Sisa waktu: *${sisaMnt} menit*`);
        }

        global.abuseState.active     = true;
        global.abuseState.sock       = sock;
        global.abuseState.db         = db;
        global.abuseState.eventQueue = shuffleEvents();
        global.abuseState.eventIndex = 0;
        global.abuseState.startTime  = Date.now();

        await broadcast(
            `🎉 *ADMIN ABUSE EVENT DIMULAI!* 🎉\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `Event spesial berlangsung selama *30 menit*!\n\n` +
            `⏱️ Setiap *1 menit* event berganti otomatis\n` +
            `🎲 Total *10 event* berbeda akan muncul!\n\n` +
            `💰 Ekonomi  ⛏️ Mining  🌾 Farming\n` +
            `⚔️ Duel  🧠 Tebak  ⚡ Balapan  📊 Lomba\n\n` +
            `♻️ Meteor/Tebak/Balapan: auto-restart tiap ada pemenang!\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🚀 *EVENT PERTAMA DIMULAI DALAM 3 DETIK...*`
        );

        setTimeout(() => startNextEvent(), 3000);

        global.abuseState.intervalRef = setInterval(async () => {
            if (!global.abuseState.active) return;
            const cur = global.abuseState.currentEvent;
            if (cur === 'lomba_aktif' && global.abuseState.eventData.lombaActive) {
                await resolveLombaAktif();
            }
            await broadcast(`⏩ *Event berganti! Event berikutnya dimulai...*`);
            await startNextEvent();
        }, INTERVAL);

        global.abuseState.mainTimer = setTimeout(async () => {
            clearInterval(global.abuseState.intervalRef);
            await stopEvent('auto');
        }, EVENT_DURATION);
        return;
    }

    if (command === 'adminabuseoff') {
        if (!global.abuseState.active) return msg.reply(`❌ Tidak ada event yang sedang berjalan.`);
        clearTimeout(global.abuseState.mainTimer);
        clearInterval(global.abuseState.intervalRef);
        await stopEvent('manual');
        return;
    }

    if (command === 'abuseinfo') {
        if (!global.abuseState.active) return msg.reply(`ℹ️ Status: 🔴 Tidak Aktif`);
        const sisaMs  = EVENT_DURATION - (Date.now() - global.abuseState.startTime);
        const sisaMnt = Math.ceil(sisaMs / 60000);
        const cur     = (global.abuseState.currentEvent || '-').replace(/_/g, ' ').toUpperCase();
        return msg.reply(`ℹ️ Status: 🟢 Aktif\nEvent: *${cur}*\nSisa: *${sisaMnt} menit*`);
    }
};

// --- EKSPOR ---
adminAbuseCmd.handleInteractive = handleInteractive;
module.exports = adminAbuseCmd;
