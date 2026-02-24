// ============================================================
//  utils/constants.js — Semua Konstanta & Konfigurasi Game
//  Diambil dari commands/profile.js, jobs.js, economy.js, dll.
//  Edit di sini untuk mengubah harga/balance game.
// ============================================================

// ── Economy ──────────────────────────────────────────────────
const ECONOMY = {
    DAILY_REWARD:         500,
    DAILY_COOLDOWN_MS:    86400_000,   // 24 jam
    MAKAN_COST:           50_000_000,
    MAKAN_HP_RESTORE:     10,
    RS_COST:              500_000_000,
    REVIVE_FREE_BALANCE:  50_000_000,  // Gratis RS jika saldo < ini
    TRANSFER_DAILY_LIMIT: 10_000_000_000,
    CASINO_WIN_RATE:      0.35,        // 35% menang
    CASINO_EVENT_WIN_RATE:0.85,        // 85% saat event
    SLOT_MULTIPLIERS:     { '777': 10, 'bar': 5, 'lemon': 2 },
    GACHA_CHARM_PRICE:    100_000_000,
    ROB_SUCCESS_RATE:     0.40,        // 40% berhasil rampok
    ROB_STEAL_PERCENT:    0.10,        // Rampok 10% saldo
    ROB_FINE_PERCENT:     0.05,        // Denda 5% jika gagal
    ROB_COOLDOWN_MS:      3_600_000,   // Cooldown 1 jam
    DEATH_PENALTY:        0.20,        // Denda mati 20%
    BANK_INTEREST_RATE:   0.005,       // Bunga bank 0.5%/hari
    INTEREST_INTERVAL_MS: 86400_000,   // Per hari
};

// ── Life System ───────────────────────────────────────────────
const LIFE = {
    TICK_INTERVAL_MS:  60_000,     // Tick setiap 1 menit
    HUNGER_DECAY:      0.1,        // -0.1% lapar per menit
    ENERGY_DECAY:      0.09,       // -0.09% energi per menit
    HP_DECAY_ON_EMPTY: 0.1,        // -0.1% HP jika lapar = 0
    SLEEP_ENERGY_REGEN:0.6,        // +0.6% energi/menit saat tidur
    SLEEP_HUNGER_DECAY:0.02,       // -0.02% lapar/menit saat tidur (hemat)
    MAX_SLEEP_HOURS:   10,
    MIN_SLEEP_HOURS:   1,
};

// ── Jobs ─────────────────────────────────────────────────────
const JOBS = {
    petani: {
        role:     '🌾 Petani Modern',
        cost:     10_000_000,
        salary:   1_000_000,
        cooldown: 60,   // menit
        desc:     'Ahli bercocok tanam. Skill: Percepat panen tanaman!'
    },
    peternak: {
        role:     '🤠 Juragan Ternak',
        cost:     25_000_000,
        salary:   2_500_000,
        cooldown: 120,
        desc:     'Pawang hewan. Skill: Bikin hewan langsung lapar (cepat gemuk)!'
    },
    polisi: {
        role:     '👮 Polisi Siber',
        cost:     50_000_000,
        salary:   7_500_000,
        cooldown: 240,
        desc:     'Penegak hukum. Pasif: Kebal dari rob & Skill Razia.'
    },
};

// ── Properti / Bisnis ─────────────────────────────────────────
const PROPERTY_PRICES = {
    gerobak:    5_000_000,
    kios:       20_000_000,
    laundry:    50_000_000,
    warnet:     150_000_000,
    cafe:       400_000_000,
    minimarket: 850_000_000,
    pabrik:     2_500_000_000,
    spbu:       7_000_000_000,
    hotel:      15_000_000_000,
    mall:       50_000_000_000,
    maskapai:   200_000_000_000,
    satelit:    1_000_000_000_000,
};

const PROPERTY_INCOME = {
    gerobak:    500_000,
    kios:       2_000_000,
    laundry:    5_000_000,
    warnet:     15_000_000,
    cafe:       40_000_000,
    minimarket: 85_000_000,
    pabrik:     250_000_000,
    spbu:       700_000_000,
    hotel:      1_500_000_000,
    mall:       5_000_000_000,
    maskapai:   20_000_000_000,
    satelit:    100_000_000_000,
};

// ── Farming ──────────────────────────────────────────────────
const CROP_PRICES = {
    padi:    2_300_000,  jagung:    6_500_000,
    bawang:  14_000_000, kopi:      35_000_000,
    sawit:   80_000_000,
};
const PROCESSED_CROP_PRICES = {
    beras:        6_000_000,   popcorn:      18_000_000,
    bawang_goreng:40_000_000,  kopi_bubuk:   100_000_000,
    minyak:       250_000_000,
};
const CROP_GROW_TIME_MS = {
    padi:    4 * 3600_000,  jagung:  2 * 3600_000,
    bawang:  6 * 3600_000,  kopi:    12 * 3600_000,
    sawit:   24 * 3600_000,
};
const MACHINE_PRICES = {
    gilingan:     50_000_000,  popcorn_maker: 80_000_000,
    penggorengan: 150_000_000, roaster:       300_000_000,
    penyulingan:  1_000_000_000,
};

// ── Ternak ────────────────────────────────────────────────────
const ANIMAL_PRICES = {
    ayam:   50_000,    gurame:  200_000,
    kambing:3_000_000, sapi:    15_000_000,
    kuda:   40_000_000, unta:   80_000_000,
};
const ANIMAL_GROW_TIME_MS = {
    ayam:   2 * 3600_000, gurame: 4 * 3600_000,
    kambing:8 * 3600_000, sapi:   24 * 3600_000,
    kuda:   48 * 3600_000, unta:  72 * 3600_000,
};
const ANIMAL_SELL_PRICE = {
    ayam:   250_000,    gurame:  1_000_000,
    kambing:15_000_000, sapi:    75_000_000,
    kuda:   200_000_000, unta:  400_000_000,
};

// ── Mining ────────────────────────────────────────────────────
const MINING_RIGS = {
    rtx4070:    { price: 4_000_000_000,  hashrate: 60,  power: 200 },
    rtx4090:    { price: 9_500_000_000,  hashrate: 120, power: 450 },
    dual4090:   { price: 15_000_000_000, hashrate: 240, power: 900 },
    asic:       { price: 18_000_000_000, hashrate: 500, power: 1500 },
    usb_miner:  { price: 1_500_000_000,  hashrate: 5,   power: 10 },
    quantum_rig:{ price: 25_000_000_000, hashrate: 1200, power: 3000 },
};
const MINING_INCOME_PER_HASH_PER_HOUR = 150_000; // per 1 hashrate

// ── Roles ─────────────────────────────────────────────────────
const ROLES = {
    DEVELOPER: 'developer',  // Role tertinggi — bisa promote/demote semua
    ADMIN:     'admin',      // Bisa manage user, harga, ban
    USER:      'user',       // User biasa
};

// ── Chat Rooms ────────────────────────────────────────────────
const CHAT = {
    MAX_ROOMS:        10,
    MAX_MSG_PER_ROOM: 999999999999999,    // Simpan 100 pesan terakhir
    MAX_MSG_LENGTH:   1000,
};

// ── Roulette ─────────────────────────────────────────────────
const ROULETTE_NUMBERS = [
    { num: 0,  color: 'green' },
    ...[...Array(18)].map((_, i) => ({ num: i * 2 + 1, color: 'red' })),
    ...[...Array(18)].map((_, i) => ({ num: i * 2 + 2, color: 'black' })),
];

// ── Trivia Categories ─────────────────────────────────────────
const TRIVIA_REWARD = 1_000_000;
const TRIVIA_PENALTY = 500_000;

module.exports = {
    ECONOMY, LIFE, JOBS, ROLES, CHAT,
    PROPERTY_PRICES, PROPERTY_INCOME,
    CROP_PRICES, PROCESSED_CROP_PRICES, CROP_GROW_TIME_MS, MACHINE_PRICES,
    ANIMAL_PRICES, ANIMAL_GROW_TIME_MS, ANIMAL_SELL_PRICE,
    MINING_RIGS, MINING_INCOME_PER_HASH_PER_HOUR,
    ROULETTE_NUMBERS, TRIVIA_REWARD, TRIVIA_PENALTY,
};
