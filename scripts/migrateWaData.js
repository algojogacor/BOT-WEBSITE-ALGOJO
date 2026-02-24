// ============================================================
//  scripts/migrateWaData.js
//  Jalankan sekali: node scripts/migrateWaData.js
//  Membantu memeriksa & menampilkan status data WA Bot
// ============================================================

require('dotenv').config();
const { connectDB, loadData, getData, getUsers } = require('../config/database');

async function main() {
    console.log('\n🔄 ALGOJO WEB — Cek Data Migrasi WA Bot\n');

    await connectDB();
    await loadData();

    const users = getUsers();
    const data  = getData();

    const userCount = Object.keys(users).length;
    console.log(`📊 Total user WA di database: ${userCount}`);

    if (userCount === 0) {
        console.log('⚠️  Tidak ada data user WA ditemukan.');
        console.log('   Pastikan MONGODB_URI di .env sama dengan yang dipakai WA Bot.\n');
        process.exit(0);
    }

    console.log('\n📋 Sample data user (5 teratas berdasarkan saldo):');
    const sorted = Object.entries(users)
        .sort(([,a], [,b]) => (b.balance || 0) - (a.balance || 0))
        .slice(0, 5);

    for (const [waId, u] of sorted) {
        console.log(`\n  WA ID : ${waId}`);
        console.log(`  Nama  : ${u.name || '—'}`);
        console.log(`  Saldo : Rp ${(u.balance || 0).toLocaleString('id-ID')}`);
        console.log(`  Bank  : Rp ${(u.bank    || 0).toLocaleString('id-ID')}`);
        console.log(`  Level : ${u.level || 1}`);
        console.log(`  Job   : ${u.job || '—'}`);
    }

    console.log('\n✅ Untuk link akun web ke data WA lama:');
    console.log('   1. Daftar akun web di halaman Register');
    console.log('   2. Isi field "ID WA Lama" dengan WA ID diatas (contoh: 628xxx@s.whatsapp.net)');
    console.log('   3. Data aset lama otomatis terbawa!\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
