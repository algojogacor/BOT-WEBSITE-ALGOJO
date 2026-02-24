// ============================================================
//  utils/helpers.js — Fungsi Pembantu Global
// ============================================================

/**
 * Format angka ke format Rupiah Indonesia
 * Contoh: 1000000 → "1.000.000"
 */
const fmt = (num) => Math.floor(Number(num) || 0).toLocaleString('id-ID');

/**
 * Parse jumlah taruhan dari input string
 * Mendukung: angka biasa, 'all', '1k', '1m', '1b'
 */
function parseBet(input, balance) {
    if (!input) return null;
    const str = String(input).toLowerCase().trim();
    if (str === 'all' || str === 'semua') return Math.floor(balance || 0);

    const multipliers = { k: 1_000, jt: 1_000_000, m: 1_000_000, b: 1_000_000_000, t: 1_000_000_000_000 };
    for (const [suffix, mult] of Object.entries(multipliers)) {
        if (str.endsWith(suffix)) {
            const val = parseFloat(str.slice(0, -suffix.length));
            return isNaN(val) ? null : Math.floor(val * mult);
        }
    }

    const val = parseInt(str);
    return (isNaN(val) || val <= 0) ? null : val;
}

/**
 * Render progress bar teks (seperti di WA bot)
 * Contoh: bar(75) → "███████░░░"
 */
const bar = (val, len = 10) => {
    const v    = Math.min(Math.max(val || 0, 0), 100);
    const fill = Math.round((v / 100) * len);
    return '█'.repeat(fill) + '░'.repeat(len - fill);
};

/**
 * Format durasi ms ke string Indonesia
 * Contoh: 3661000 → "1 jam 1 menit"
 */
function fmtDuration(ms) {
    if (ms <= 0) return 'sekarang';
    const days  = Math.floor(ms / 86400_000);
    const hours = Math.floor((ms % 86400_000) / 3600_000);
    const mins  = Math.floor((ms % 3600_000) / 60_000);
    const parts = [];
    if (days)  parts.push(`${days} hari`);
    if (hours) parts.push(`${hours} jam`);
    if (mins)  parts.push(`${mins} menit`);
    return parts.join(' ') || 'kurang dari 1 menit';
}

/**
 * Generate random integer antara min dan max (inklusif)
 */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate ID unik sederhana
 */
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/**
 * Sanitasi string untuk mencegah XSS (basic — sudah pakai xss-clean juga)
 */
const sanitize = (str) => String(str || '').replace(/[<>&"']/g, c => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;'
}[c]));

/**
 * Cek apakah user sedang tidur
 */
function isSleeping(user) {
    return user?.sleeping && user?.sleepUntil && Date.now() < user.sleepUntil;
}

/**
 * Cek apakah user sedang mati
 */
function isDead(user) {
    return user?.hp !== undefined && user.hp <= 0;
}

/**
 * Inisialisasi data user baru (untuk user yang baru daftar via web)
 */
function createDefaultUserData(webUsername) {
    return {
        webUsername,
        name: webUsername,
        balance: 0,
        bank: 0,
        hp: 100,
        hunger: 100,
        energy: 100,
        level: 1,
        xp: 0,
        job: null,
        lastWork: 0,
        lastSkill: 0,
        lastDaily: 0,
        lastRob: 0,
        inv: [],
        buffs: {},
        sleeping: false,
        sleepUntil: null,
        dead: false,
        dailyTransferred: 0,
        lastTransferReset: 0,
        // Properti bisnis
        properties: [],
        // Farming
        crops: [],
        machines: [],
        // Ternak
        animals: [],
        // Mining
        rigs: [],
        // Investasi
        stocks: {},
        crypto: {},
        createdAt: Date.now(),
        lastActive: Date.now(),
    };
}

module.exports = { fmt, parseBet, bar, fmtDuration, randInt, genId, sanitize, isSleeping, isDead, createDefaultUserData };
