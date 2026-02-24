require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI; 
const client = new MongoClient(uri, {
    connectTimeoutMS: 10000, // Turunkan ke 10 detik agar cepat fail-over
    socketTimeoutMS: 45000,
    maxPoolSize: 10,         // Batasi koneksi agar tidak spamming ke Atlas
    serverSelectionTimeoutMS: 5000,
});

let dbCollection = null;

// Struktur Data Default
let localData = { 
    users: {}, 
    groups: {}, 
    chatLogs: {},
    market: { commodities: {} }, 
    settings: {} 
};

// ============================================================
// 1. KONEKSI KE CLOUD
// ============================================================
async function connectToCloud() {
    try {
        if (dbCollection) return dbCollection; 

        console.log("☁️ Menghubungkan ke MongoDB Atlas...");
        await client.connect();
        
        const db = client.db('bot_data'); 
        dbCollection = db.collection('bot_data'); 
        
        console.log("✅ Terhubung ke MongoDB Cloud!");
        
        // Load data segera setelah konek
        await loadFromCloud();
        return dbCollection;
    } catch (err) {
        console.error("❌ Gagal Konek MongoDB:", err.message);
        // Jangan return null, biarkan error agar index.js tau kalau DB mati
        throw err; 
    }
}

// ============================================================
// 2. LOAD DATA
// ============================================================
async function loadFromCloud() {
    try {
        if (!dbCollection) await connectToCloud();

        const result = await dbCollection.findOne({ _id: 'main_data' }); 
        
        if (result && result.data) {
            // MERGE DATA: Agar jika ada properti baru di localData tidak hilang tertimpa
            localData = { ...localData, ...result.data };
            
            // FIX: Pastikan array/object penting tidak undefined
            if (!localData.users) localData.users = {};
            if (!localData.groups) localData.groups = {};
            if (!localData.chatLogs) localData.chatLogs = {};
            
            console.log(`📥 Data dimuat: ${Object.keys(localData.users).length} users.`);
        } else {
            console.log("ℹ️ Database Cloud kosong. Menggunakan data lokal baru.");
            await saveDB(localData);
        }
    } catch (err) {
        console.error("⚠️ Gagal Load Data:", err.message);
    }
    return localData;
}

// Wrapper
const loadDB = async () => {
    // Cek apakah data user kosong, jika iya paksa load dari cloud
    if (!localData.users || Object.keys(localData.users).length === 0) {
        return await loadFromCloud();
    }
    return localData;
};

// ============================================================
// 3. SAVE DATA (THROTTLING / ANTI-SPAM)
// ============================================================
// Kita buat variabel status agar tidak double save
let isSaving = false;

const saveDB = async (data) => {
    if (isSaving) return; // Jika sedang saving, skip request ini (mencegah lag)
    
    try {
        isSaving = true;
        if (data) localData = data; 

        if (!dbCollection) {
            await connectToCloud();
        }

        // HANYA UPDATE FIELD 'data'
        await dbCollection.updateOne(
            { _id: 'main_data' }, 
            { $set: { data: localData } }, 
            { upsert: true } 
        );
        
       // console.log("💾 Data saved to Cloud");

    } catch (err) {
        console.error("⚠️ Gagal Save ke MongoDB:", err.message);
    } finally {
        isSaving = false; // Buka kunci saving
    }
};

// ============================================================
// 4. HELPER QUEST
// ============================================================
const addQuestProgress = (user, questId) => {
    if (!user.quest || !user.quest.daily) return null;
    
    // Cari quest by reference
    const quest = user.quest.daily.find(q => q.id === questId);
    
    if (quest && !quest.claimed && quest.progress < quest.target) {
        quest.progress++;
       
        
        if (quest.progress >= quest.target) {
            return `🎉 Quest *${quest.name}* Selesai! Ketik !daily klaim.`;
        }
    }
    return null;
};

module.exports = { connectToCloud, loadDB, saveDB, addQuestProgress };

