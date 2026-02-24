require('dotenv').config();
const { MongoClient } = require('mongodb');

async function fix() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('bot_data');
        const collection = db.collection('bot_data');

        // 1. Cari data lama kamu (yang TIDAK punya _id 'main_data')
        const oldDoc = await collection.findOne({ _id: { $ne: 'main_data' } });

        if (oldDoc) {
            console.log("✅ Data lama ditemukan! Memindahkan ke struktur baru...");
            
            // 2. Ambil semua isinya kecuali _id lama
            const { _id, ...pureData } = oldDoc;

            // 3. Masukkan ke dokumen 'main_data' dengan folder 'data' sesuai kode helpers/database.js
            await collection.updateOne(
                { _id: 'main_data' },
                { $set: { data: pureData } },
                { upsert: true }
            );

            console.log("🚀 Migrasi Selesai! Sekarang jalankan bot kamu.");
            console.log("⚠️ Kamu bisa menghapus dokumen lama dengan ID acak di browser nanti.");
        } else {
            console.log("❌ Tidak ditemukan data lama dengan ID acak.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

fix();