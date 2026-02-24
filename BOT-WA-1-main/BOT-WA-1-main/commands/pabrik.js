const { saveDB } = require('../helpers/database');

// ==========================================
// ⚙️ KONFIGURASI GLOBAL
// ==========================================
const GLOBAL = {
    oprCost: 1_000_000,    // Biaya Listrik per craft
    taxRate: 0.05,         // Pajak Jual
    breakdownChance: 0.02, // Risiko Meledak
    repairCost: 5_000_000, // Biaya Service
    staminaCost: 10,       // Stamina per aksi
    maxStamina: 100,       // Max Stamina
    weekendBonus: 1.10     // Bonus Yield Weekend
};

// ==========================================
// 🏗️ DATA MESIN
// ==========================================
const MACHINES = {
    // AYAM
    'ayam_1': { name: '🐔 Pemotong Unggas (T1)', cost: 15_000_000, cooldown: 15 * 60 * 1000 },
    'ayam_2': { name: '🍗 Dapur Nugget (T2)', cost: 30_000_000, cooldown: 20 * 60 * 1000 },
    'ayam_3': { name: '🍔 Franchise Packaging (T3)', cost: 60_000_000, cooldown: 30 * 60 * 1000 },
    // GURAME
    'gurame_1': { name: '🐟 Fillet Station (T1)', cost: 25_000_000, cooldown: 30 * 60 * 1000 },
    'gurame_2': { name: '🍳 Penggorengan Ikan (T2)', cost: 50_000_000, cooldown: 40 * 60 * 1000 },
    'gurame_3': { name: '🍱 Sushi Conveyor (T3)', cost: 100_000_000, cooldown: 60 * 60 * 1000 },
    // KAMBING
    'kambing_1': { name: '🐐 Penggiling Daging (T1)', cost: 50_000_000, cooldown: 60 * 60 * 1000 },
    'kambing_2': { name: '🌯 Kebab Rotisserie (T2)', cost: 100_000_000, cooldown: 90 * 60 * 1000 },
    'kambing_3': { name: '🔥 Grill Kambing Guling (T3)', cost: 200_000_000, cooldown: 120 * 60 * 1000 },
    // SAPI
    'sapi_1': { name: '🐄 RPH Modern (T1)', cost: 100_000_000, cooldown: 2 * 60 * 60 * 1000 },
    'sapi_2': { name: '🥩 Steak House Kitchen (T2)', cost: 200_000_000, cooldown: 3 * 60 * 60 * 1000 },
    'sapi_3': { name: '🥂 Fine Dining Unit (T3)', cost: 400_000_000, cooldown: 4 * 60 * 60 * 1000 },
    // KUDA
    'kuda_1': { name: '🐎 Pengolahan Kuda (T1)', cost: 250_000_000, cooldown: 4 * 60 * 60 * 1000 },
    'kuda_2': { name: '🍕 Pizza Oven (T2)', cost: 500_000_000, cooldown: 5 * 60 * 60 * 1000 },
    'kuda_3': { name: '🍝 Pasta Factory (T3)', cost: 1_000_000_000, cooldown: 6 * 60 * 60 * 1000 },
    // UNTA
    'unta_1': { name: '🐫 Ekstraktor Susu (T1)', cost: 500_000_000, cooldown: 6 * 60 * 60 * 1000 },
    'unta_2': { name: '💊 Lab Farmasi (T2)', cost: 1_000_000_000, cooldown: 8 * 60 * 60 * 1000 },
    'unta_3': { name: '🧪 Alchemy Lab (T3)', cost: 2_500_000_000, cooldown: 12 * 60 * 60 * 1000 },
};

// ==========================================
// 📚 DATA RESEP
// ==========================================
const RECIPES = {
    // TIER 1
    'ayam':    { tier: 1, machine: 'ayam_1', outputCode: 'nugget', outputName: '🍗 Chicken Nugget', yield: 0.7, price: 100000 },
    'gurame':  { tier: 1, machine: 'gurame_1', outputCode: 'fillet', outputName: '🍣 Fillet Ikan', yield: 0.6, price: 300000 },
    'kambing': { tier: 1, machine: 'kambing_1', outputCode: 'giling_kambing', outputName: '🥩 Daging Giling', yield: 0.65, price: 200000 },
    'sapi':    { tier: 1, machine: 'sapi_1', outputCode: 'wagyu', outputName: '🥩 Wagyu A5 Cut', yield: 0.7, price: 90000 }, 
    'kuda':    { tier: 1, machine: 'kuda_1', outputCode: 'sosis_kuda', outputName: '🌭 Sosis Kuda', yield: 0.7, price: 350000 },
    'unta':    { tier: 1, machine: 'unta_1', outputCode: 'susu_unta', outputName: '🥛 Susu Unta Bubuk', yield: 0.5, price: 400000 },

    // TIER 2
    'nugget':         { tier: 2, machine: 'ayam_2', outputCode: 'burger', outputName: '🍔 Burger Ayam', batchSize: 5, yield: 1.2, price: 180000 },
    'fillet':         { tier: 2, machine: 'gurame_2', outputCode: 'fish_chips', outputName: '🍱 Fish & Chips', batchSize: 5, yield: 1.1, price: 550000 },
    'giling_kambing': { tier: 2, machine: 'kambing_2', outputCode: 'kebab', outputName: '🌯 Kebab Turki', batchSize: 10, yield: 1.0, price: 350000 },
    'wagyu':          { tier: 2, machine: 'sapi_2', outputCode: 'steak', outputName: '🍲 Steak House', batchSize: 10, yield: 0.9, price: 180000 },
    'sosis_kuda':     { tier: 2, machine: 'kuda_2', outputCode: 'pizza_kuda', outputName: '🍕 Pizza Salami', batchSize: 5, yield: 1.5, price: 500000 },
    'susu_unta':      { tier: 2, machine: 'unta_2', outputCode: 'suplemen', outputName: '💊 Suplemen Vitalitas', batchSize: 2, yield: 0.8, price: 900000 },

    // TIER 3
    'burger':     { tier: 3, machine: 'ayam_3', outputCode: 'happy_meal', outputName: '🍟 Paket Franchise', batchSize: 5, yield: 1.0, price: 350000 },
    'fish_chips': { tier: 3, machine: 'gurame_3', outputCode: 'sushi_platter', outputName: '🍱 Sushi Platter', batchSize: 5, yield: 1.0, price: 900000 },
    'kebab':      { tier: 3, machine: 'kambing_3', outputCode: 'kambing_guling', outputName: '🍖 Kambing Guling', batchSize: 5, yield: 1.0, price: 600000 },
    'steak':      { tier: 3, machine: 'sapi_3', outputCode: 'beef_wellington', outputName: '🥂 Beef Wellington', batchSize: 5, yield: 1.0, price: 250000 },
    'pizza_kuda': { tier: 3, machine: 'kuda_3', outputCode: 'lasagna', outputName: '🍝 Lasagna Premium', batchSize: 5, yield: 1.0, price: 800000 },
    'suplemen':   { tier: 3, machine: 'unta_3', outputCode: 'elixir', outputName: '🧪 Elixir Keabadian', batchSize: 2, yield: 1.0, price: 1800000 }
};

// HELPER
const getDynamicPrice = (basePrice) => {
    const hour = new Date().getHours();
    const factor = Math.cos(hour * 1.5) * (basePrice * 0.15); 
    return Math.floor(basePrice + factor);
};
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// ==========================================
// 🚀 MAIN MODULE
// ==========================================
module.exports = async (command, args, msg, user, db, sock) => {
    const validCommands = [
        'pabrik', 'bangunpabrik', 
        'hire', 'fire', 'resign', 
        'craft', 'gudang', 'jualproduk', 
        'service', 'ngopi', 'pabrikhelp'
    ];
    if (!validCommands.includes(command)) return;

    // DATABASE INITIALIZATION
    if (!db.factories) db.factories = {};
    if (!db.workers) db.workers = {};
    if (!db.locks) db.locks = {}; 

    // ✅ FIX: GUNAKAN msg.author UNTUK ID PENGIRIM
    const senderId = msg.author || msg.key.participant || msg.key.remoteJid;
    const now = Date.now();

    // ============================================================
    // 📖 1. HELP / PANDUAN
    // ============================================================
  if (command === 'pabrikhelp' || command === 'panduanpabrik' || (command === 'pabrik' && args[0] === 'help')) {
        const formatTime = (ms) => {
            const min = ms / 60000;
            return min >= 60 ? `${min/60} Jam` : `${min} Mnt`;
        };

        let txt = `🏭 *GRAND PANDUAN PABRIK V6* 🏭\n`;
        txt += `_Sistem Hilirisasi Tier 1 - Tier 3_\n\n`;

        // --- BAGIAN 1: HARGA MESIN ---
        txt += `🏗️ *DAFTAR HARGA MESIN*\n`;
        txt += `_Format Beli: \`!bangunpabrik <hewan> <tier>\`_\n`;
        txt += `_(Contoh: !bangunpabrik sapi 1)_\n\n`;

        const types = ['ayam', 'gurame', 'kambing', 'sapi', 'kuda', 'unta'];
        types.forEach(t => {
            // Ambil data dari konstanta MACHINES
            const m1 = MACHINES[`${t}_1`];
            const m2 = MACHINES[`${t}_2`];
            const m3 = MACHINES[`${t}_3`];
            
            txt += `*${t.toUpperCase()}*\n`;
            txt += `├ T1: Rp ${fmt(m1.cost)} (⏳ ${formatTime(m1.cooldown)})\n`;
            txt += `├ T2: Rp ${fmt(m2.cost)} (⏳ ${formatTime(m2.cooldown)})\n`;
            txt += `└ T3: Rp ${fmt(m3.cost)} (⏳ ${formatTime(m3.cooldown)})\n`;
        });

        // --- BAGIAN 2: POHON RESEP ---
        txt += `\n📜 *POHON RESEP (HILIRISASI)*\n`;
        txt += `_Tier 1 (Bahan) ➡️ Tier 2 (Masakan) ➡️ Tier 3 (Luxury)_\n`;
        txt += `_Gunakan kode di sebelah kiri untuk command !craft_\n\n`;

        txt += `🐔 *AYAM*\n├ \`ayam\` ➡️ Nugget (T1)\n├ \`nugget\` ➡️ Burger (T2)\n└ \`burger\` ➡️ Paket Franchise (T3)\n\n`;
        txt += `🐟 *GURAME*\n├ \`gurame\` ➡️ Fillet (T1)\n├ \`fillet\` ➡️ Fish & Chips (T2)\n└ \`fish_chips\` ➡️ Sushi Platter (T3)\n\n`;
        txt += `🐐 *KAMBING*\n├ \`kambing\` ➡️ Daging Giling (T1)\n├ \`giling_kambing\` ➡️ Kebab (T2)\n└ \`kebab\` ➡️ Kambing Guling (T3)\n\n`;
        txt += `🐄 *SAPI*\n├ \`sapi\` ➡️ Wagyu (T1)\n├ \`wagyu\` ➡️ Steak (T2)\n└ \`steak\` ➡️ Beef Wellington (T3)\n\n`;
        txt += `🐎 *KUDA*\n├ \`kuda\` ➡️ Sosis (T1)\n├ \`sosis_kuda\` ➡️ Pizza (T2)\n└ \`pizza_kuda\` ➡️ Lasagna (T3)\n\n`;
        txt += `🐫 *UNTA*\n├ \`unta\` ➡️ Susu Bubuk (T1)\n├ \`susu_unta\` ➡️ Suplemen (T2)\n└ \`suplemen\` ➡️ Elixir (T3)\n\n`;

        // --- BAGIAN 3: PEMBAGIAN TUGAS ---
        txt += `👮 *PEMBAGIAN TUGAS*\n`;
        txt += `👑 *BOS (OWNER)*\n`;
        txt += `├ \`!bangunpabrik <jenis> <tier>\` : Beli mesin.\n`;
        txt += `├ \`!hire @tag\` : Rekrut karyawan.\n`;
        txt += `├ \`!fire @tag\` : Pecat karyawan.\n`;
        txt += `├ \`!gudang\` : Cek stok barang jadi.\n`;
        txt += `├ \`!jualproduk <kode>\` : Cairkan stok jadi uang.\n`;
        txt += `└ \`!service\` : Perbaiki mesin meledak.\n\n`;

        txt += `👷 *KARYAWAN (WORKER)*\n`;
        txt += `├ \`!pabrik\` : Cek stamina & antrian mesin.\n`;
        txt += `├ \`!craft <kode> <jumlah>\` : Kerja (Max 3).\n`;
        txt += `├ \`!ngopi\` : Isi 50 stamina (Bayar 1Jt).\n`;
        txt += `└ \`!resign\` : Keluar dari pabrik.\n\n`;
        
        return msg.reply(txt);
    }

    // ============================================================
    // 🏗️ BANGUN PABRIK
    // ============================================================
    if (command === 'bangunpabrik') {
        const type = args[0]?.toLowerCase();
        const tier = parseInt(args[1]);

        if (!type || !tier || isNaN(tier)) return msg.reply("❌ Format: `!bangunpabrik <hewan> <tier>`\nContoh: `!bangunpabrik sapi 1`");

        const machineCode = `${type}_${tier}`;
        const machineData = MACHINES[machineCode];

        if (!machineData) return msg.reply("❌ Mesin tidak ditemukan/salah tier.");

        if (!db.factories[senderId]) {
            db.factories[senderId] = { level: 1, employees: [], inventory: {}, activeLines: [] };
        }
        const factory = db.factories[senderId];

        if (factory.activeLines.includes(machineCode)) return msg.reply("❌ Sudah punya mesin ini.");
        if (user.balance < machineData.cost) return msg.reply(`❌ Uang kurang Rp ${fmt(machineData.cost)}.`);

        user.balance -= machineData.cost;
        factory.activeLines.push(machineCode);
        saveDB(db);
        return msg.reply(`✅ Sukses bangun **${machineData.name}**!`);
    }

    // ============================================================
    // 🤝 HIRE (REKRUT)
    // ============================================================
    if (command === 'hire') {
        const factory = db.factories[senderId];
        if (!factory) return msg.reply("❌ Kamu belum punya pabrik. Bangun dulu!");

        // Ambil ID dari mention atau nomor
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        let targetId = mentioned;
        
        if (!targetId && args[0]) {
            let raw = args[0].replace(/[^0-9]/g, '');
            if(raw.startsWith('08')) raw = '62' + raw.slice(1);
            targetId = raw + '@s.whatsapp.net';
        }

        if (!targetId) return msg.reply("❌ Tag orangnya: `!hire @member`");

        if (db.workers[targetId]) {
            return msg.reply(`❌ Dia sudah bekerja di tempat lain.`);
        }

        factory.employees.push(targetId);
        db.workers[targetId] = { employer: senderId, stamina: 100 };
        saveDB(db);
        return msg.reply(`✅ Berhasil merekrut karyawan!`, { mentions: [targetId] });
    }

    // ============================================================
    // ⚙️ CRAFT (KERJA)
    // ============================================================
    if (command === 'craft') {
        if (db.locks[senderId]) return msg.reply("⏳ Sabar...");
        db.locks[senderId] = true;

        try {
            const workerData = db.workers[senderId];
            if (!workerData || !workerData.employer) throw "Kamu belum punya Bos. Minta `!hire` dulu.";

            const ownerId = workerData.employer;
            const ownerUser = db.users[ownerId];
            const factory = db.factories[ownerId];

            if (!factory) throw "Pabrik bosmu sudah tutup.";

            const inputKey = args[0]?.toLowerCase();
            const qty = parseInt(args[1]) || 1;
            const recipe = RECIPES[inputKey];

            if (!recipe) throw "❌ Resep salah. Cek `!pabrikhelp`.";
            if (qty > 3) throw "❌ Max 3 item sekali kerja.";

            if (!factory.activeLines.includes(recipe.machine)) {
                throw `❌ Bosmu belum beli mesin untuk ini!`;
            }

            if (workerData.stamina < 10 * qty) throw "😴 Stamina habis. Ketik `!ngopi`.";
            if (ownerUser.balance < GLOBAL.oprCost * qty) throw "❌ Uang bos habis (Gagal Bayar Listrik).";

            const machineData = MACHINES[recipe.machine];
            const duration = machineData.cooldown * qty;

            // PENGURANGAN BAHAN
            if (recipe.tier === 1) {
                // Tier 1: Ambil dari Ternak Bos
                if (!ownerUser.ternak) ownerUser.ternak = [];
                const idx = ownerUser.ternak.findIndex(a => a.type === inputKey && !a.isSick);
                if (idx === -1) throw `❌ Bos tidak punya ternak **${inputKey}** sehat.`;
                ownerUser.ternak.splice(idx, 1);
            } else {
                // Tier 2/3: Ambil dari Gudang Pabrik
                if (!factory.inventory[inputKey] || factory.inventory[inputKey] < recipe.batchSize * qty) {
                    throw `❌ Stok bahan **${inputKey}** di gudang bos kurang.`;
                }
                factory.inventory[inputKey] -= recipe.batchSize * qty;
            }

            ownerUser.balance -= GLOBAL.oprCost * qty;
            workerData.stamina -= 10 * qty;
            
            // SIMPAN QUEUE DI DATA USER (WORKER) TAPI ADA INFO EMPLOYER ID
            if (!user.pabrik) user.pabrik = {}; 
            if (!user.pabrik.queue) user.pabrik.queue = [];
            
            user.pabrik.queue.push({
                product: recipe.outputCode,
                qty: qty,
                durationPerItem: machineData.cooldown,
                startedAt: now,
                employerId: ownerId // ✅ PENTING: Supaya tau hasil kerja lari ke mana
            });

            saveDB(db);
            msg.reply(`⚙️ *PRODUKSI BERJALAN*\n⏳ Selesai dalam ${(duration/60000).toFixed(1)} menit.\n⚡ Stamina: -${10*qty}`);

        } catch (e) {
            msg.reply(e);
        } finally {
            delete db.locks[senderId];
        }
        return;
    }

    // ============================================================
    // 🧱 DASHBOARD & CLAIM (Auto Masuk Gudang Bos)
    // ============================================================
    if (command === 'pabrik') {
        const workerData = db.workers[senderId];
        
        // Cek Queue Karyawan
        if (!user.pabrik) user.pabrik = {};
        let queue = user.pabrik.queue || [];
        let newQueue = [];
        let claimedInfo = [];

        for (let p of queue) {
            const passed = now - p.startedAt;
            const done = Math.floor(passed / p.durationPerItem);
            const take = Math.min(done, p.qty);

            if (take > 0) {
                // ✅ LOGIKA CLAIM: HASIL MASUK KE PABRIK BOS, BUKAN WORKER
                const targetFactoryId = p.employerId || senderId; // Kalau ga ada employer, masuk ke diri sendiri
                const targetFactory = db.factories[targetFactoryId];

                if (targetFactory) {
                    if (!targetFactory.inventory[p.product]) targetFactory.inventory[p.product] = 0;
                    targetFactory.inventory[p.product] += take;
                    
                    p.qty -= take;
                    p.startedAt += (take * p.durationPerItem);
                    claimedInfo.push(`${take}x ${p.product}`);
                }
            }
            if (p.qty > 0) newQueue.push(p);
        }

        user.pabrik.queue = newQueue;
        saveDB(db);

        // TAMPILAN
        let txt = "";
        
        if (workerData) {
            txt += `👷 *PROFIL KARYAWAN*\n`;
            txt += `⚡ Stamina: ${workerData.stamina}/100\n`;
            txt += `💼 Bos: @${workerData.employer.split('@')[0]}\n\n`;
        }

        if (claimedInfo.length > 0) txt += `✅ *SELESAI (Masuk Gudang Bos):*\n${claimedInfo.join(', ')}\n\n`;
        
        if (newQueue.length > 0) {
            txt += `🔄 *SEDANG DIPROSES:*\n`;
            newQueue.forEach(q => {
                 txt += `- ${q.product} (${q.qty} lagi)\n`;
            });
        } else {
            txt += `💤 Tidak ada pekerjaan aktif.\n`;
        }

        return msg.reply(txt, { mentions: workerData ? [workerData.employer] : [] });
    }

    // ============================================================
    // ☕ NGOPI (Isi Stamina)
    // ============================================================
    if (command === 'ngopi') {
        const worker = db.workers[senderId];
        if (!worker) return msg.reply("❌ Kamu bukan karyawan.");
        
        if (user.balance < 1000000) return msg.reply("❌ Uang kurang (1 Juta).");
        user.balance -= 1000000;
        worker.stamina = 100;
        saveDB(db);
        return msg.reply("☕ Stamina Full! (Saldo -1jt)");
    }

    // ============================================================
    // 📦 GUDANG (Menu Bos)
    // ============================================================
    if (command === 'gudang') {
        const f = db.factories[senderId];
        if (!f) return msg.reply("❌ Belum punya pabrik.");
        
        let txt = `📦 *GUDANG PABRIK*\n`;
        let isEmpty = true;
        for (let k in f.inventory) {
            if (f.inventory[k] > 0) {
                txt += `- ${k}: ${f.inventory[k]}\n`;
                isEmpty = false;
            }
        }
        if (isEmpty) txt += `(Kosong)`;
        msg.reply(txt);
    }

    // ============================================================
    // 💰 JUAL PRODUK (Menu Bos)
    // ============================================================
    if (command === 'jualproduk') {
         const factory = db.factories[senderId];
         if (!factory) return msg.reply("❌ Belum punya pabrik.");

         const code = args[0]?.toLowerCase();
         const qty = factory.inventory?.[code] || 0;
         
         if(qty <= 0) return msg.reply("❌ Stok barang kosong.");
         
         // Cari harga di Recipe
         let itemKey = Object.keys(RECIPES).find(k => RECIPES[k].outputCode === code);
         if(!itemKey) return msg.reply("❌ Barang tidak terdaftar.");

         const item = RECIPES[itemKey];
         const price = getDynamicPrice(item.price);
         const total = Math.floor(qty * price * (1 - GLOBAL.taxRate));

         user.balance += total;
        user.dailyIncome = (user.dailyIncome || 0) + total;
         factory.inventory[code] = 0;
         saveDB(db);

         return msg.reply(`💰 Terjual ${qty}x ${item.outputName}!\n💵 Total: Rp ${fmt(total)} (Tax 5%)`);
    }

    // ============================================================
    // 👢 PECAT & RESIGN
    // ============================================================
    if (command === 'fire') {
        const f = db.factories[senderId];
        if (!f) return msg.reply("❌ Kamu bukan bos.");
        
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!mentioned) return msg.reply("❌ Tag karyawan yang mau dipecat.");

        f.employees = f.employees.filter(id => id !== mentioned);
        delete db.workers[mentioned];
        saveDB(db);
        msg.reply("👢 Karyawan dipecat.");
    }

    if (command === 'resign') {
        if (!db.workers[senderId]) return msg.reply("❌ Kamu pengangguran.");
        
        // Hapus dari daftar karyawan bos
        const bosId = db.workers[senderId].employer;
        if (db.factories[bosId]) {
            db.factories[bosId].employees = db.factories[bosId].employees.filter(id => id !== senderId);
        }

        delete db.workers[senderId];
        saveDB(db);
        msg.reply("👋 Berhasil resign.");
    }
};
