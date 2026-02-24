// ============================================================
//  config/database.js — Koneksi MongoDB (Singleton Pattern)
//  Database sama persis dengan WA Bot — data lama otomatis terbaca
// ============================================================

const { MongoClient } = require('mongodb');

let client = null;
let _db    = null;

// Nama DB dan collection SAMA dengan WA Bot agar data terbawa
const DB_NAME         = 'bot_data';
const COLLECTION_NAME = 'bot_data';

// Cache data lokal (sama dengan pola WA bot)
let localData = {
    users:    {},
    groups:   {},
    chatLogs: {},
    market:   { commodities: {} },
    settings: {},
    // Data tambahan untuk web
    webUsers: {},   // username->password mapping
    chatRooms: {},  // room chat
    privateChats: {} // DM antar user
};

let isSaving = false;

/**
 * Inisialisasi koneksi MongoDB
 */
async function connectDB() {
    if (_db) return _db;

    client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 20,
        connectTimeoutMS: 10000,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
    });

    await client.connect();
    await client.db('admin').command({ ping: 1 });

    _db = client.db(DB_NAME);
    console.log(`✅ MongoDB terhubung → DB: ${DB_NAME}`);

    // Load data segera
    await loadData();
    if (!localData.webUsers) {
        localData.webUsers = {}; 
    }
    return _db;
}

/**
 * Ambil instance DB (harus dipanggil setelah connectDB())
 */
function getDB() {
    if (!_db) throw new Error('Database belum terhubung. Panggil connectDB() dulu.');
    return _db;
}

/**
 * Ambil collection utama
 */
function getCollection() {
    return getDB().collection(COLLECTION_NAME);
}

// ── Load Data ────────────────────────────────────────────────
async function loadData() {
    try {
        const col    = getCollection();
        const result = await col.findOne({ _id: 'main_data' });

        if (result?.data) {
            localData = { ...localData, ...result.data };
        }

        // Pastikan sub-dokumen penting selalu ada
        if (!localData.users)        localData.users        = {};
        if (!localData.settings)     localData.settings     = {};
        if (!localData.webUsers)     localData.webUsers     = {};
        if (!localData.chatRooms)    localData.chatRooms    = {};
        if (!localData.privateChats) localData.privateChats = {};

        console.log(`📥 Data dimuat: ${Object.keys(localData.users).length} WA users, ${Object.keys(localData.webUsers).length} web users`);
    } catch (err) {
        console.error('⚠️ Gagal load data:', err.message);
    }
    return localData;
}

// ── Save Data (Throttle: hanya 1 save bersamaan) ─────────────
async function saveData(data) {
    if (isSaving) {
        // Tunggu dulu, jangan skip
        await new Promise(resolve => setTimeout(resolve, 200));
        return saveData(data);
    }
    try {
        isSaving = true;
        if (data) localData = data;

        const col = getCollection();
        await col.updateOne(
            { _id: 'main_data' },
            { $set: { data: localData, updatedAt: new Date() } },
            { upsert: true }
        );
    } catch (err) {
        console.error('⚠️ Gagal save data:', err.message);
    } finally {
        isSaving = false;
    }
}

// ── Getters & Helpers ────────────────────────────────────────
function getData()              { return localData; }
function getUsers()             { return localData.users || {}; }
function getWebUsers()          { return localData.webUsers || {}; }
function getSettings()          { return localData.settings || {}; }
function getChatRooms()         { return localData.chatRooms || {}; }
function getPrivateChats()      { return localData.privateChats || {}; }

/**
 * Cari user WA berdasarkan username web
 * Jika user mendaftarkan nomor WA mereka, ambil datanya
 */
function getWaUserByWebUsername(username) {
    const webUser = localData.webUsers[username];
    if (!webUser?.waId) return null;
    return localData.users[webUser.waId] || null;
}

/**
 * Ambil atau buat web user profile
 */
function getOrCreateWebUser(username) {
    if (!localData.webUsers[username]) {
        localData.webUsers[username] = {
            username,
            createdAt: Date.now(),
            role: 'user',
            waId: null, // Diisi saat user link akun WA-nya
            banned: false,
            bannedUntil: null,
            bannedReason: null,
        };
    }
    return localData.webUsers[username];
}

module.exports = {
    connectDB,
    getDB,
    getCollection,
    loadData,
    saveData,
    getData,
    getUsers,
    getWebUsers,
    getSettings,
    getChatRooms,
    getPrivateChats,
    getWaUserByWebUsername,
    getOrCreateWebUser,
};
