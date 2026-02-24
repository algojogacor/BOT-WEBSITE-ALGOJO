const { MongoClient } = require('mongodb');

let client = null;
let db = null;

/**
 * Fungsi untuk mengelola koneksi MongoDB secara efisien (Singleton Pattern)
 */
async function connectToDB() {
    // 1. Jika db sudah ada, cek apakah koneksinya masih aktif
    if (db && client && client.topology && client.topology.isConnected()) {
        return db;
    }

    try {
        // 2. Jika client belum dibuat, inisialisasi dengan opsi yang lebih agresif
        if (!client) {
            client = new MongoClient(process.env.MONGODB_URI, {
                // Connection Pool: 15-20 cukup untuk bot WhatsApp/TikTok
                maxPoolSize: 20, 
                // Jika dalam 5 detik tidak bisa konek, batalkan (cegah bot hang lama)
                connectTimeoutMS: 5000, 
                // Batas waktu pemilihan server
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
                // Mengurangi beban overhead handshake
                compressors: ["zstd"],
            });
        }

        // 3. Lakukan koneksi
        await client.connect();
        db = client.db('bot_data');

        // 4. Ping database untuk memastikan koneksi benar-benar siap digunakan
        await db.command({ ping: 1 });

        console.log("✅ Terhubung ke MongoDB Atlas (Connection Verified)");
        return db;

    } catch (e) {
        console.error("❌ Gagal koneksi MongoDB:", e.message);
        
        // Reset state agar pemanggilan fungsi berikutnya mencoba dari awal
        client = null;
        db = null;
        
        throw new Error("Database connection failed");
    }
}

module.exports = { connectToDB };
