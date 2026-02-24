const { saveDB } = require('../helpers/database');

// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// ==========================================
// 1. KONFIGURASI HEWAN (RE-BALANCED)
// ==========================================
// Konsep: Growth Rate dinaikkan drastis agar tidak butuh ratusan kali makan.
const ANIMALS = {
    'ayam': { 
        name: "🐔 Ayam Kampung", 
        price: 50000,       // Modal Murah
        maxWeight: 3.0,     // Max 3 KG
        sellPrice: 60000,   // Jual 180rb
        growthRate: 0.5,    // Base Growth 0.5kg
        hungryTime: 60      // Lapar 1 Jam
        // Hitungan:
        // Target naik: 2.7kg.
        // Pakan Dedak (Eff 0.3) -> 0.15kg/makan -> Butuh 18x makan (Rp 36rb).
        // Modal 50k + Pakan 36k = 86k. Jual 180k. PROFIT = 94k.
    },
    'gurame': { 
        name: "🐟 Ikan Gurame", 
        price: 200000,      // Modal 200rb
        maxWeight: 5.0,     // Max 5 KG
        sellPrice: 150000,  // Jual 750rb
        growthRate: 0.8,    // Base Growth 0.8kg
        hungryTime: 90      // Lapar 1.5 Jam
        // Hitungan:
        // Target naik: 4.5kg.
        // Pakan Pelet (Eff 0.6) -> 0.48kg/makan -> Butuh ~10x makan (Rp 100rb).
        // Modal 200k + Pakan 100k = 300k. Jual 750k. PROFIT = 450k.
    },
    'kambing': { 
        name: "🐐 Kambing Etawa", 
        price: 3000000,     // Modal 3 Juta
        maxWeight: 60,      // Max 60 KG
        sellPrice: 100000,  // Jual 6 Juta
        growthRate: 5,      // Base Growth 5kg
        hungryTime: 180     // Lapar 3 Jam
    },
    'sapi': { 
        name: "🐄 Sapi Brahma", 
        price: 15000000,    // Modal 15 Juta
        maxWeight: 700,     // Max 700 KG
        sellPrice: 50000,   // Jual 35 Juta
        growthRate: 50,     // Base Growth 50kg (Cepat Besar)
        hungryTime: 360     // Lapar 6 Jam
        // Hitungan:
        // Target naik: 630kg.
        // Pakan Premium (Eff 1.2) -> 60kg/makan -> Butuh 11x makan (Rp 440rb).
        // Modal 15jt + Pakan 440rb. Jual 35jt. PROFIT ~19 Juta.
    },
    'kuda': { 
        name: "🐎 Kuda Pacu", 
        price: 40000000,    // Modal 40 Juta
        maxWeight: 500,     // Max 500 KG
        sellPrice: 200000,  // Jual 100 Juta
        growthRate: 40,     
        hungryTime: 300     // Lapar 5 Jam
    },
    'unta': { 
        name: "🐫 Unta Arab", 
        price: 80000000,    // Modal 80 Juta
        maxWeight: 1000,    // Max 1 Ton
        sellPrice: 150000,  // Jual 150 Juta
        growthRate: 80,     
        hungryTime: 480     // Lapar 8 Jam
    }
};

// ==========================================
// 2. ITEM (PAKAN & OBAT) - HARGA DISESUAIKAN
// ==========================================
const ITEMS = {
    // Dedak: Murah meriah, pertumbuhan lambat (30%)
    'dedak':   { name: "🌾 Dedak (Low)", price: 2000, effect: 0.3 },   
    
    // Pelet: Standar, pertumbuhan lumayan (60%)
    'pelet':   { name: "💊 Pelet (Mid)", price: 10000, effect: 0.6 },  
    
    // Premium: Mahal, pertumbuhan BOOSTER (120%)
    'premium': { name: "🥩 Premium (High)", price: 40000, effect: 1.2 }, 
    
    // Obat: Wajib punya
    'obat':    { name: "💉 Antibiotik", price: 50000, type: 'med' }     
};

const DEATH_LIMIT = 24 * 60; // MATI SETELAH 24 JAM (1440 Menit)

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['ternak', 'kandang', 'belihewan', 'tokopakan', 'belipakan', 'pakan', 'feed', 'jualhewan', 'obati'];
    if (!validCommands.includes(command)) return;

    // INIT DATABASE
    if (!user.ternak) user.ternak = [];
    if (!user.ternak_inv) user.ternak_inv = { dedak: 0, pelet: 0, premium: 0, obat: 0 };
    
    const now = Date.now();

    // ============================================================
    // 1. TUTORIAL (!ternak)
    // ============================================================
    if (command === 'ternak') {
        let txt = `🤠 *PANDUAN PETERNAKAN PRO* 🤠\n`;
        txt += `_Bisnis Hewan: High Risk, High Reward!_\n\n`;

        txt += `🛒 *LANGKAH 1: PERSIAPAN*\n`;
        txt += `• Beli Hewan: \`!belihewan <jenis>\`\n`;
        txt += `• Beli Pakan/Obat: \`!tokopakan\`\n\n`;

        txt += `🍽️ *LANGKAH 2: PERAWATAN (PAKAN)*\n`;
        txt += `Gunakan \`!pakan <no_hewan> <jenis_pakan>\`\n`;
        txt += `• Dedak (2rb): Pertumbuhan 30% (Hemat)\n`;
        txt += `• Pelet (10rb): Pertumbuhan 60% (Standar)\n`;
        txt += `• Premium (40rb): Pertumbuhan 120% (Ngebut!)\n\n`;

        txt += `🚑 *KESEHATAN & KEMATIAN*\n`;
        txt += `• Hewan bisa SAKIT (Gak bisa makan). Sembuhkan dgn \`!obati <no>\`\n`;
        txt += `• ☠️ *DEADLINE 24 JAM:* Jika hewan tidak makan selama 24 jam, dia akan MATI & HILANG.\n\n`;

        txt += `💰 *LANGKAH 3: PANEN*\n`;
        txt += `Jual saat berat maksimal: \`!jualhewan <no>\``;

        return msg.reply(txt);
    }

    // ============================================================
    // 2. TOKO PAKAN & OBAT (!tokopakan)
    // ============================================================
    if (command === 'tokopakan') {
        let txt = `🏪 *PASAR PAKAN & OBAT*\n`;
        txt += `_Stok gudangmu dulu sebelum memberi makan!_\n\n`;

        for (let [code, item] of Object.entries(ITEMS)) {
            let desc = item.type === 'med' ? "Menyembuhkan Sakit" : `Efektifitas: ${(item.effect * 100).toFixed(0)}% Growth`;
            txt += `📦 *${item.name}* (Kode: ${code})\n`;
            txt += `   💰 Harga: Rp ${fmt(item.price)}\n`;
            txt += `   ℹ️ ${desc}\n\n`;
        }

        txt += `🎒 *ISI TAS KAMU:*\n`;
        txt += `🌾 Dedak: ${user.ternak_inv.dedak} | 💊 Pelet: ${user.ternak_inv.pelet}\n`;
        txt += `🥩 Premium: ${user.ternak_inv.premium} | 💉 Obat: ${user.ternak_inv.obat}\n\n`;
        
        txt += `💡 Cara beli: \`!belipakan pelet 10\``;
        return msg.reply(txt);
    }

    // ============================================================
    // 3. BELI ITEM (!belipakan <jenis> <jumlah>)
    // ============================================================
    if (command === 'belipakan') {
        const itemCode = args[0]?.toLowerCase();
        const qty = parseInt(args[1]) || 1;

        if (!itemCode || !ITEMS[itemCode]) return msg.reply("❌ Barang tidak ada. Cek `!tokopakan`");
        if (qty < 1) return msg.reply("❌ Minimal beli 1.");

        const totalCost = ITEMS[itemCode].price * qty;
        if (user.balance < totalCost) return msg.reply(`❌ Uang kurang! Butuh Rp ${fmt(totalCost)}`);

        user.balance -= totalCost;
        if (!user.ternak_inv[itemCode]) user.ternak_inv[itemCode] = 0;
        user.ternak_inv[itemCode] += qty;

        saveDB(db);
        return msg.reply(`✅ *PEMBELIAN SUKSES*\n+ ${qty} ${ITEMS[itemCode].name}\n💰 Total Bayar: Rp ${fmt(totalCost)}`);
    }

    // ============================================================
    // 4. KANDANG & STATUS (!kandang)
    // ============================================================
    if (command === 'kandang') {
        let txt = `🛖 *KANDANG TERNAK* 🛖\n\n`;

        if (user.ternak.length === 0) return msg.reply("Kandang kosong. Mulai dengan `!belihewan`");

        user.ternak.forEach((a, i) => {
            const conf = ANIMALS[a.type];
            const diffMinutes = (now - a.lastFeed) / 60000;
            const timeLeft = Math.max(0, DEATH_LIMIT - diffMinutes);
            const hoursLeft = Math.floor(timeLeft / 60);

            // LOGIKA STATUS
            let status = "🟢 Sehat";
            if (a.isSick) status = "🤢 SAKIT (Butuh Obat)";
            else if (diffMinutes > DEATH_LIMIT) status = "☠️ MATI (Bangkai)";
            else if (diffMinutes > conf.hungryTime) status = "🔴 LAPAR";

            // LOGIKA DEADLINE
            let deadline = diffMinutes > DEATH_LIMIT 
                ? "SUDAH MATI" 
                : `☠️ Mati dalam: ${hoursLeft} Jam`;

            const progress = ((a.weight / conf.maxWeight) * 100).toFixed(0);
            const hargaJual = Math.floor(a.weight * conf.sellPrice);

            txt += `${i+1}. *${conf.name}* [${status}]\n`;
            // PAKAI toFixed(2) AGAR KENAIKAN KECIL TERLIHAT
            txt += `   ⚖️ Berat: ${a.weight.toFixed(2)} / ${conf.maxWeight} kg (${progress}%)\n`; 
            txt += `   ⏳ ${deadline}\n`;
            txt += `   💰 Nilai Jual: Rp ${fmt(hargaJual)}\n\n`;
        });

        txt += `💡 Beri makan: \`!pakan <nomor> <jenis>\`\n`;
        txt += `💡 Contoh: \`!pakan 1 dedak\``;
        return msg.reply(txt);
    }

    // ============================================================
    // 5. BELI HEWAN (!belihewan)
    // ============================================================
    if (command === 'belihewan') {
        const type = args[0]?.toLowerCase();
        if (!type || !ANIMALS[type]) {
            let txt = `🛒 *PASAR HEWAN*\n`;
            for (let [k, v] of Object.entries(ANIMALS)) {
                txt += `🐾 *${v.name}* (${k})\n   💰 Modal: Rp ${fmt(v.price)}\n   📈 Max Jual: Rp ${fmt(v.maxWeight * v.sellPrice)}\n\n`;
            }
            return msg.reply(txt);
        }

        if (user.ternak.length >= 8) return msg.reply("❌ Kandang penuh (Max 8 ekor).");

        // 🎉 EVENT: Borong Pasar — diskon harga beli hewan
        const diskonPct = (db.settings?.borongPasar && Date.now() < db.settings.borongPasarUntil)
            ? db.settings.borongPasarDiskon / 100 : 0;
        const hargaBeli = Math.floor(ANIMALS[type].price * (1 - diskonPct));

        if (user.balance < hargaBeli) return msg.reply("❌ Uang kurang.");

        // Start weight 10%
        const startWeight = ANIMALS[type].maxWeight * 0.1;

        user.balance -= hargaBeli;
        user.ternak.push({ 
            type, 
            weight: startWeight, 
            lastFeed: now, 
            isSick: false 
        });
        
        saveDB(db);
        let beliMsg = `✅ Berhasil membeli ${ANIMALS[type].name}.`;
        if (diskonPct > 0) beliMsg += `\n🛒 *EVENT BORONG PASAR! Diskon ${db.settings.borongPasarDiskon}%!*`;
        return msg.reply(beliMsg);
    }

    // ============================================================
    // 6. BERI MAKAN (!pakan <nomor> <jenis>)
    // ============================================================
    if (command === 'pakan' || command === 'feed') {
        const index = parseInt(args[0]) - 1;
        const feedType = args[1]?.toLowerCase();

        if (isNaN(index) || !user.ternak[index]) return msg.reply("❌ Salah nomor hewan. Cek `!kandang`");
        if (!feedType || !ITEMS[feedType] || ITEMS[feedType].type === 'med') {
            return msg.reply("❌ Jenis pakan salah. Pilih: `dedak`, `pelet`, atau `premium`.");
        }

        const animal = user.ternak[index];
        const conf = ANIMALS[animal.type];
        const item = ITEMS[feedType];

        // VALIDASI MATI & SAKIT
        const diff = (now - animal.lastFeed) / 60000;
        if (diff > DEATH_LIMIT) return msg.reply("❌ Hewan sudah mati. Tidak bisa makan.");
        if (animal.isSick) return msg.reply("❌ Hewan sedang SAKIT! Sembuhkan dulu pakai `!obati <nomor>`.");
        if (diff < 10) return msg.reply("❌ Masih terlalu kenyang.");

        // VALIDASI STOK
        if (!user.ternak_inv[feedType] || user.ternak_inv[feedType] < 1) {
            return msg.reply(`❌ Stok ${item.name} habis! Beli di \`!tokopakan\`.`);
        }

        // PROSES MAKAN
        user.ternak_inv[feedType] -= 1;
        animal.lastFeed = now;

        // Random SAKIT (Chance 5% tiap makan)
        if (Math.random() < 0.05) {
            animal.isSick = true;
            saveDB(db);
            return msg.reply(`🤢 Waduh! Setelah makan, ${conf.name} malah jatuh SAKIT.\nSegera beli obat dan gunakan \`!obati ${index+1}\`!`);
        }

        // Pertumbuhan berdasarkan kualitas pakan
        if (animal.weight < conf.maxWeight) {
            const growth = conf.growthRate * item.effect; // Base Growth x Effect Pakan
            animal.weight += growth;
            if (animal.weight > conf.maxWeight) animal.weight = conf.maxWeight;
            
            saveDB(db);
            return msg.reply(`🍔 Nyam! Makan ${item.name}.\n⚖️ Berat naik +${growth.toFixed(2)}kg menjadi ${animal.weight.toFixed(2)}kg.`);
        }

        saveDB(db);
        return msg.reply(`🍔 Makan ${item.name}, tapi berat sudah maksimal.`);
    }

    // ============================================================
    // 7. OBATI HEWAN (!obati <nomor>)
    // ============================================================
    if (command === 'obati') {
        const index = parseInt(args[0]) - 1;
        if (isNaN(index) || !user.ternak[index]) return msg.reply("❌ Salah nomor hewan.");

        const animal = user.ternak[index];
        if (!animal.isSick) return msg.reply("❌ Hewan ini sehat walafiat.");

        if (!user.ternak_inv.obat || user.ternak_inv.obat < 1) {
            return msg.reply("❌ Kamu tidak punya Antibiotik. Beli di `!tokopakan`.");
        }

        user.ternak_inv.obat -= 1;
        animal.isSick = false;
        saveDB(db);
        
        return msg.reply(`💉 *SEMBUH!* Hewanmu sudah sehat kembali dan siap makan.`);
    }

    // ============================================================
    // 8. JUAL HEWAN (!jualhewan <nomor>)
    // ============================================================
    if (command === 'jualhewan') {
        const index = parseInt(args[0]) - 1;
        if (isNaN(index) || !user.ternak[index]) return msg.reply("❌ Salah nomor hewan.");

        const animal = user.ternak[index];
        const conf = ANIMALS[animal.type];
        const diff = (now - animal.lastFeed) / 60000;

        // Jual Bangkai
        if (diff > DEATH_LIMIT) {
            const scrap = 10000;
            user.balance += scrap;
            user.dailyIncome = (user.dailyIncome || 0) + scrap;
            user.ternak.splice(index, 1);
            saveDB(db);
            return msg.reply(`☠️ Bangkai ${conf.name} dijual ke tukang rongsok seharga Rp ${fmt(scrap)}.`);
        }

        // Jual Normal
        const baseTotal = Math.floor(animal.weight * conf.sellPrice);
        
        // Bonus jika sehat & berat max
        let bonus = 0;
        if (animal.weight >= conf.maxWeight && !animal.isSick) {
            bonus = baseTotal * 0.1; // Bonus 10%
        }

        // 🎉 EVENT: Musim Panen — hasil jual berlipat
        const panenMult = (db.settings?.musimPanen && Date.now() < db.settings.musimPanenUntil)
            ? db.settings.musimPanenMult : 1;

        const total      = baseTotal * panenMult;
        const finalPrice = total + bonus;
        user.balance += finalPrice;
        user.dailyIncome = (user.dailyIncome || 0) + finalPrice;
        user.ternak.splice(index, 1);
        saveDB(db);

        let msgBonus = bonus > 0 ? `\n🌟 *Bonus Kualitas Terbaik: +Rp ${fmt(bonus)}*` : "";
        let panenInfo = panenMult > 1 ? `\n🌾 *EVENT MUSIM PANEN! Hasil x${panenMult}!*` : "";
        return msg.reply(`💰 *TERJUAL*\n${conf.name} (Berat ${animal.weight.toFixed(2)}kg)\n💵 Harga Dasar: Rp ${fmt(total)}${msgBonus}\n🤑 *Total Diterima: Rp ${fmt(finalPrice)}*${panenInfo}`);
    }
};
