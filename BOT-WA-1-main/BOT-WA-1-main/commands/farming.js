const { saveDB } = require('../helpers/database');

// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// ==========================================
// 1. DATA TANAMAN (RAW MATERIAL)
// ==========================================
const CROPS = {
    'padi': { 
        modal: 2000000, duration: 20 * 60 * 1000, 
        minSell: 2200000, maxSell: 2500000 
    }, 
    'jagung': { 
        modal: 5000000, duration: 60 * 60 * 1000, 
        minSell: 6000000, maxSell: 7000000 
    },
    'bawang': { 
        modal: 10000000, duration: 2 * 60 * 60 * 1000, 
        minSell: 13000000, maxSell: 15000000 
    },
    'kopi': { 
        modal: 25000000, duration: 4 * 60 * 60 * 1000, 
        minSell: 32000000, maxSell: 38000000 
    },
    'sawit': { 
        modal: 50000000, duration: 8 * 60 * 60 * 1000, 
        minSell: 75000000, maxSell: 90000000 
    }
};

// ==========================================
// 2. DATA MESIN & RESEP
// ==========================================
const MACHINES = {
    // TIER 1: Padi -> Beras Premium (Margin 140%)
    'gilingan': {
        name: "🌾 Rice Mill",
        price: 50000000, 
        input: 'padi',   
        output: 'beras', 
        duration: 25 * 60 * 1000, // 25 Menit per item
        sellPrice: 6000000 // Jual 6 Juta (Bahan 2.5jt)
    },

    // TIER 2: Jagung -> Popcorn Caramel (Margin 157%)
    'popcorn_maker': {
        name: "🍿 Popcorn Maker",
        price: 80000000, 
        input: 'jagung',
        output: 'popcorn',
        duration: 30 * 60 * 1000, 
        sellPrice: 18000000 // Jual 18 Juta (Bahan 7jt)
    },

    // TIER 3: Bawang -> Bawang Goreng Soy (Margin 166%)
    'penggorengan': {
        name: "🥘 Fried Onion Machine",
        price: 150000000, 
        input: 'bawang',
        output: 'bawang_goreng',
        duration: 45 * 60 * 1000, // 1 Jam per item
        sellPrice: 40000000 // Jual 40 Juta (Bahan 15jt)
    },

    // TIER 4: Kopi -> Espresso Powder (Margin 163%)
    'roaster': {
        name: "☕ Coffee Roaster",
        price: 300000000, 
        input: 'kopi',
        output: 'kopi_bubuk',
        duration: 1 * 60 * 60 * 1000, // 1 Jam per item
        sellPrice: 100000000 // Jual 100 Juta (Bahan 38jt)
    },

    // TIER 5: Sawit -> Minyak Goreng Emas (Margin 200%++)
    'penyulingan': {
        name: "🛢️ CPO Refinery",
        price: 1000000000, 
        input: 'sawit',
        output: 'minyak',
        duration: 2 * 60 * 60 * 1000, // 2 Jam per item
        sellPrice: 250000000 // Jual 250 Juta (Bahan 90jt)
    }
};

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['tanam', 'ladang', 'panen', 'pasar', 'jual', 'toko', 'beli', 'olah', 'pabrik', 'produksi', 'farming', 'farmer', 'tani'];
    if (!validCommands.includes(command)) return;

    // INIT DATABASE
    if (!user.farm) user.farm = { plants: [], inventory: {}, machines: [], processing: [] };
    if (!db.market.commodities) db.market.commodities = {};

    // ============================================================
    // 📘 PANDUAN (!farmer)
    // ============================================================
    if (command === 'farming' || command === 'farmer' || command === 'tani') {
        let txt = `🌾 *PANDUAN FARMING & INDUSTRI 3.0* 🏭\n`;
        txt += `_Fitur Baru: Klaim Bertahap (Incremental Claim)_\n\n`;

        txt += `🏭 *LOGIKA PABRIK:*\n`;
        txt += `• Kamu bisa masukkan banyak bahan sekaligus (Antrian).\n`;
        txt += `• Setiap 1 item selesai diproses, bisa langsung diambil.\n`;
        txt += `• Ketik \`!pabrik\` untuk memindahkan barang jadi ke Gudang.\n\n`;

        txt += `💰 *CONTOH:*\n`;
        txt += `• Masukkan 5 Padi ke Gilingan.\n`;
        txt += `• Setelah 30 menit, 1 Beras selesai.\n`;
        txt += `• Ketik \`!pabrik\`, 1 Beras masuk gudang dan bisa dijual.\n`;
        txt += `• 4 Padi sisanya lanjut diproses otomatis.\n\n`;

        txt += `💡 Gunakan \`!jual <nama>\` untuk menjual hasil.`;
        return msg.reply(txt);
    }
    
    // UPDATE HARGA PASAR (Tiap 10 Menit)
    const now = Date.now();
    if (now - (db.market.lastCommUpdate || 0) > 10 * 60 * 1000) {
        for (let [name, data] of Object.entries(CROPS)) {
            const range = data.maxSell - data.minSell;
            db.market.commodities[name] = data.minSell + Math.floor(Math.random() * range);
        }
        db.market.lastCommUpdate = now;
        saveDB(db);
    }

    // ============================================================
    // 🏪 FITUR TOKO (BELI MESIN)
    // ============================================================
    if (command === 'toko' || command === 'beli') {
        if (!args[0]) {
            let txt = `🏭 *TOKO MESIN INDUSTRI*\n`;
            const ownedCounts = {};
            user.farm.machines.forEach(m => { ownedCounts[m] = (ownedCounts[m] || 0) + 1; });

            for (let [code, m] of Object.entries(MACHINES)) {
                const count = ownedCounts[code] || 0;
                txt += `🔧 *${m.name}* (${code})\n`;
                txt += `   Output: ${m.output.toUpperCase()}\n`;
                txt += `   💰 Harga: Rp ${fmt(m.price)}\n`;
                txt += `   ✅ Dimiliki: ${count} Unit\n\n`;
            }
            txt += `💡 Ketik \`!beli gilingan\` untuk beli.`;
            return msg.reply(txt);
        }

        const item = args[0].toLowerCase();
        if (!MACHINES[item]) return msg.reply("❌ Mesin tidak ditemukan.");

        // 🎉 EVENT: Borong Pasar — diskon harga beli
        const diskonPct = (db.settings?.borongPasar && Date.now() < db.settings.borongPasarUntil)
            ? db.settings.borongPasarDiskon / 100 : 0;
        const price = Math.floor(MACHINES[item].price * (1 - diskonPct));

        if (user.balance < price) return msg.reply(`❌ Uang kurang! Butuh Rp ${fmt(price)}`);

        user.balance -= price;
        user.farm.machines.push(item);
        saveDB(db);
        let beliMsg = `✅ *SUKSES MEMBELI MESIN*\n${MACHINES[item].name} siap digunakan!\nKetik \`!olah ${item}\` untuk mulai produksi.`;
        if (diskonPct > 0) beliMsg += `\n\n🛒 *EVENT BORONG PASAR! Diskon ${db.settings.borongPasarDiskon}%!*`;
        return msg.reply(beliMsg);
    }

    // ============================================================
    // 🏭 FITUR PABRIK (MASUKKAN KE ANTRIAN)
    // ============================================================
    if (command === 'olah' || command === 'produksi') {
        const machineCode = args[0]?.toLowerCase();
        let qty = parseInt(args[1]) || 1; 
        
        if (!machineCode || !MACHINES[machineCode]) return msg.reply("❌ Format: `!olah <nama_mesin> <jumlah>`");
        
        const totalMachines = user.farm.machines.filter(m => m === machineCode).length;
        if (totalMachines === 0) return msg.reply("❌ Kamu belum punya mesin ini.");

        // Cek mesin yang sibuk
        // Di sistem baru, satu entry di 'processing' dianggap satu mesin yang sedang bekerja pada satu batch
        const activeBatches = user.farm.processing.filter(p => p.machine === machineCode);
        
        if (activeBatches.length >= totalMachines) {
            return msg.reply(`⏳ Semua mesin ${MACHINES[machineCode].name} sedang bekerja! Tunggu antrian atau beli mesin baru.`);
        }

        const m = MACHINES[machineCode];
        const inputItem = m.input;

        if (!user.farm.inventory[inputItem] || user.farm.inventory[inputItem] < qty) {
            return msg.reply(`❌ Bahan baku kurang! Butuh ${qty} ${inputItem.toUpperCase()}.`);
        }

        user.farm.inventory[inputItem] -= qty; 
        
        // Push ke processing dengan timestamp MULAI
        user.farm.processing.push({
            machine: machineCode,
            product: m.output,
            qty: qty,               // Sisa antrian dalam batch ini
            durationPerItem: m.duration,
            startedAt: now          // Waktu mulai item PERTAMA (atau item saat ini)
        });

        saveDB(db);
        
        let txt = `⚙️ *MESIN BERJALAN...*\n`;
        txt += `📥 Input: ${qty} ${inputItem.toUpperCase()}\n`;
        txt += `⏱️ Per Item: ${(m.duration/60000).toFixed(0)} Menit\n`;
        txt += `_Sistem akan memproses satu per satu. Cek !pabrik untuk ambil hasil._`;
        
        return msg.reply(txt);
    }

    // ============================================================
    // 🏭 CEK PABRIK (!pabrik) - INCREMENTAL CLAIM SYSTEM 🔥
    // ============================================================
    if (command === 'pabrik') {
        let txt = `🏭 *STATUS PABRIK & ANTRIAN*\n\n`;
        
        if (user.farm.processing.length === 0) {
            txt += "_Semua mesin hening. Tidak ada produksi._\n";
        } else {
            let collectedItems = {}; // Untuk laporan apa aja yg diambil
            let remainingProcess = []; // Array baru untuk menyimpan sisa antrian

            user.farm.processing.forEach(p => {
                const m = MACHINES[p.machine];
                
                // Hitung berapa lama sudah berjalan sejak startedAt
                const elapsedTime = now - p.startedAt;
                
                // Hitung berapa item yang SUDAH SELESAI dalam durasi tersebut
                let finishedCount = Math.floor(elapsedTime / p.durationPerItem);

                // Jangan ambil lebih dari sisa antrian
                if (finishedCount > p.qty) finishedCount = p.qty;

                // --- LOGIKA KLAIM ---
                if (finishedCount > 0) {
                    // Tambah ke inventory
                    if (!user.farm.inventory[p.product]) user.farm.inventory[p.product] = 0;
                    user.farm.inventory[p.product] += finishedCount;

                    // Catat untuk laporan
                    if (!collectedItems[p.product]) collectedItems[p.product] = 0;
                    collectedItems[p.product] += finishedCount;

                    // Update Antrian
                    p.qty -= finishedCount;
                    // Majukan waktu start seolah-olah item berikutnya baru mulai sekarang 
                    // (atau tepatnya: waktu start + durasi item yg sudah jadi)
                    p.startedAt += (finishedCount * p.durationPerItem);
                }

                // Jika masih ada sisa antrian, simpan kembali ke array processing
                if (p.qty > 0) {
                    // Hitung waktu sisa untuk item yang SEDANG dikerjakan
                    const currentProgressMs = now - p.startedAt;
                    const timeLeftMs = p.durationPerItem - currentProgressMs;
                    const timeLeftMin = Math.ceil(timeLeftMs / 60000);

                    // Progress bar visual
                    const percent = Math.floor((currentProgressMs / p.durationPerItem) * 10);
                    const bar = "█".repeat(percent) + "░".repeat(10 - percent);

                    txt += `⚙️ *${m.name}* (Sisa: ${p.qty})\n`;
                    txt += `   🔄 Proses: [${bar}]\n`;
                    txt += `   ⏳ Item berikutnya: ${timeLeftMin} Menit lagi\n\n`;
                    
                    remainingProcess.push(p);
                }
            });

            // Simpan perubahan ke DB
            user.farm.processing = remainingProcess;
            saveDB(db);

            // Laporan Klaim
            if (Object.keys(collectedItems).length > 0) {
                txt += `✅ *HASIL DIAMBIL (Masuk Gudang):*\n`;
                for (let [item, qty] of Object.entries(collectedItems)) {
                    txt += `+ ${qty} ${item.toUpperCase()}\n`;
                }
                txt += `\n_Gunakan !jual <nama> untuk jadi uang._\n`;
            }
        }
        return msg.reply(txt);
    }

    // ============================================================
    // 🌱 FITUR LADANG (TANAM - SAMA)
    // ============================================================
    if (command === 'tanam') {
        const cropName = args[0]?.toLowerCase();
        if (!cropName || !CROPS[cropName]) {
            let txt = `🌱 *LIST TANAMAN*\n`;
            for (let [k, v] of Object.entries(CROPS)) {
                txt += `🔹 *${k.toUpperCase()}* (Modal: Rp ${fmt(v.modal)})\n`;
            }
            return msg.reply(txt);
        }
        if (user.farm.plants.length >= 10) return msg.reply("❌ Ladang penuh!");
        if (user.balance < CROPS[cropName].modal) return msg.reply("❌ Uang kurang.");

        user.balance -= CROPS[cropName].modal;
        user.farm.plants.push({ name: cropName, readyAt: now + CROPS[cropName].duration });
        saveDB(db);
        return msg.reply(`✅ Menanam ${cropName}.`);
    }

    if (command === 'ladang') {
        let txt = `🌾 *LADANG*\n`;
        user.farm.plants.forEach((p, i) => {
            const sisa = p.readyAt - now;
            txt += `${i+1}. ${p.name.toUpperCase()}: ${sisa <= 0 ? "✅ SIAP" : Math.ceil(sisa/60000) + " mnt"}\n`;
        });
        
        txt += `\n📦 *GUDANG & PRODUK JADI:*\n`;
        let hasItem = false;
        for (let [k, v] of Object.entries(user.farm.inventory)) {
            if (v > 0) {
                txt += `📦 ${k.toUpperCase()}: ${v} Unit\n`;
                hasItem = true;
            }
        }
        if(!hasItem) txt += "_Gudang Kosong_";
        
        return msg.reply(txt);
    }

    if (command === 'panen') {
        let panen = [];
        let sisa = [];
        for (let p of user.farm.plants) {
            if (now >= p.readyAt) {
                if (!user.farm.inventory[p.name]) user.farm.inventory[p.name] = 0;
                user.farm.inventory[p.name] += 1;
                panen.push(p.name);
            } else sisa.push(p);
        }
        if(!panen.length) return msg.reply("❌ Belum ada yang siap panen.");
        user.farm.plants = sisa;
        saveDB(db);
        return msg.reply(`✅ Panen: ${panen.join(', ')}`);
    }

    // ============================================================
    // 💰 JUAL (AUTO DETECT HARGA)
    // ============================================================
    if (command === 'jual') {
        const item = args[0]?.toLowerCase();
        let qty = args[1];

        if (!item || !user.farm.inventory[item] || user.farm.inventory[item] <= 0) {
            return msg.reply("❌ Barang kosong di gudang.\nCek `!ladang`.");
        }

        if (qty === 'all') qty = user.farm.inventory[item];
        else qty = parseInt(qty);

        if (isNaN(qty) || qty <= 0 || qty > user.farm.inventory[item]) return msg.reply("❌ Jumlah salah.");

        let hargaJual = 0;

        if (db.market.commodities[item]) {
            hargaJual = db.market.commodities[item];
        } else {
            for (let key in MACHINES) {
                if (MACHINES[key].output === item) {
                    hargaJual = MACHINES[key].sellPrice;
                    break;
                }
            }
        }

        if (hargaJual === 0) return msg.reply("❌ Barang tidak laku dijual.");

        // 🎉 EVENT: Musim Panen — hasil jual berlipat
        const panenMult = (db.settings?.musimPanen && Date.now() < db.settings.musimPanenUntil)
            ? db.settings.musimPanenMult : 1;

        const total = hargaJual * qty * panenMult;
        user.balance += total;
        user.dailyIncome = (user.dailyIncome || 0) + total;
        user.farm.inventory[item] -= qty;
        if (user.farm.inventory[item] === 0) delete user.farm.inventory[item];
        
        saveDB(db);

        let jualMsg = `💰 *TERJUAL*\nBarang: ${item.toUpperCase()} (${qty} Unit)\n💵 Total: Rp ${fmt(total)}`;
        if (panenMult > 1) jualMsg += `\n\n🌾 *EVENT MUSIM PANEN! Hasil x${panenMult}!*`;
        return msg.reply(jualMsg);
    }
    
    if (command === 'pasar') {
        let txt = `🏪 *PASAR KOMODITAS*\n\n`;
        for (let [k, v] of Object.entries(db.market.commodities)) {
            txt += `🔹 ${k.toUpperCase()}: Rp ${fmt(v)}\n`;
        }
        txt += `\n💡 Barang jadi pabrik harganya tetap/mahal.`;
        return msg.reply(txt);
    }
};
