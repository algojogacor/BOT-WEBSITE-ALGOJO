const { saveDB } = require('../helpers/database');

// KONFIGURASI PROPERTI (TIER UMKM s/d CRAZY RICH)
const PROPERTIES = {
    // TIER 1: UMKM (Jutaan)
    gerobak: { 
        name: "🍡 Gerobak Cilok", 
        price: 5_000_000, 
        income: 25_000, 
        cap: 500_000 
    },
    kios: { 
        name: "📱 Kios Pulsa", 
        price: 20_000_000, 
        income: 120_000, 
        cap: 2_500_000 
    },
    laundry: { 
        name: "🧺 Laundry Kiloan", 
        price: 50_000_000, 
        income: 350_000, 
        cap: 7_000_000 
    },
    
    // TIER 2: JURAGAN (Ratusan Juta)
    warnet: { 
        name: "💻 Warnet Gaming", 
        price: 150_000_000, 
        income: 1_200_000, 
        cap: 25_000_000 
    },
    cafe: { 
        name: "☕ Coffee Shop Hits", 
        price: 400_000_000, 
        income: 3_500_000, 
        cap: 80_000_000 
    },
    minimarket: { 
        name: "🏪 Minimarket 24 Jam", 
        price: 850_000_000, 
        income: 8_000_000, 
        cap: 200_000_000 
    },

    // TIER 3: BOSS BESAR (Miliaran)
    pabrik: { 
        name: "🏭 Pabrik Tekstil", 
        price: 2_500_000_000, 
        income: 25_000_000, 
        cap: 600_000_000 
    },
    spbu: { 
        name: "⛽ SPBU Pom Bensin", 
        price: 7_000_000_000, 
        income: 80_000_000, 
        cap: 2_000_000_000 
    },
    hotel: { 
        name: "🏨 Hotel Bintang 5", 
        price: 15_000_000_000, 
        income: 180_000_000, 
        cap: 5_000_000_000 
    },

    // TIER 4: KONGLEMERAT (Puluhan Miliar)
    mall: { 
        name: "🏙️ Mall Grand Indonesia", 
        price: 50_000_000_000, 
        income: 650_000_000, 
        cap: 15_000_000_000 
    },
    maskapai: { 
        name: "✈️ Maskapai Penerbangan", 
        price: 200_000_000_000, 
        income: 3_000_000_000, 
        cap: 80_000_000_000 
    },

    // TIER 5: END GAME (Triliunan)
    satelit: { 
        name: "🛰️ Stasiun Luar Angkasa", 
        price: 1_000_000_000_000,
        income: 15_000_000_000,   
        cap: 500_000_000_000_000  
    }
};

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['properti', 'property', 'beliusaha', 'buybusiness', 'collect', 'panen', 'tagih'];
    if (!validCommands.includes(command)) return;

    // 1. Inisialisasi Data Bisnis User
    if (!user.business) {
        user.business = {
            owned: {}, 
            lastCollect: Date.now()
        };
    }

    const now = Date.now();
    // Hitung selisih jam
    const hoursPassed = (now - user.business.lastCollect) / (1000 * 60 * 60);

    // 2. MENU UTAMA (!properti)
    if (command === 'properti' || command === 'property') {
        let txt = `🏢 *DUNIA BISNIS & INVESTASI* 🏢\n`;
        txt += `_Bangun kerajaan bisnismu dari nol sampai ke bulan!_\n\n`;
        
        // -- Bagian Toko --
        txt += `🛒 *KATALOG USAHA:*\n`;
        for (let [key, p] of Object.entries(PROPERTIES)) {
            const hrg = p.price.toLocaleString('id-ID');
            const inc = p.income.toLocaleString('id-ID');
            // Tampilkan ID
            txt += `▪️ *${p.name}* \n   └ ID: \`${key}\` | 💰 Rp ${hrg}\n   └ 💸 Income: Rp ${inc}/jam\n`;
        }

        // Bagian Aset Saya
        txt += `\n👤 *ASET SAYA:*\n`;
        let totalIncome = 0;
        let hasAsset = false;
        let pendingMoney = 0;

        for (let [key, qty] of Object.entries(user.business.owned)) {
            if (qty > 0) {
                const p = PROPERTIES[key];
                txt += `✅ ${p.name}: ${qty} Unit\n`;
                
                totalIncome += p.income * qty;
                hasAsset = true;

                // Hitung uang mengendap
                let revenue = Math.floor(p.income * qty * hoursPassed);
                let maxCap = p.cap * qty;
                pendingMoney += Math.min(revenue, maxCap);
            }
        }

        if (!hasAsset) txt += "_Kamu belum punya usaha. Masih pengangguran?_\n";

        txt += `\n📊 Total Income: 💰Rp ${totalIncome.toLocaleString('id-ID')}/jam`;
        txt += `\n💰 *Brankas Usaha: 💰Rp ${pendingMoney.toLocaleString('id-ID')}*`;
        txt += `\n_(Uang akan mentok jika tidak diambil!)_\n`;
        txt += `\n💡 Panen: \`!collect\``;
        txt += `\n💡 Beli: \`!beliusaha <id> <jumlah>\``;

        return msg.reply(txt);
    }

    // 3. BELI PROPERTI (!beliusaha)
    if (command === 'beliusaha' || command === 'buybusiness') {
        const type = args[0]?.toLowerCase();
        const qty = parseInt(args[1]) || 1;

        if (!PROPERTIES[type]) return msg.reply("❌ Usaha tidak ditemukan. Cek ID di `!properti`.");
        if (qty < 1) return msg.reply("❌ Minimal beli 1.");

        const cost = PROPERTIES[type].price * qty;

        if (user.balance < cost) {
            return msg.reply(`❌ Modal kurang bos! Harga: Rp ${cost.toLocaleString('id-ID')}.`);
        }

        // AUTO COLLECT SEBELUM BELI
        let collected = 0;
        for (let [k, q] of Object.entries(user.business.owned)) {
            if (q > 0) {
                const p = PROPERTIES[k];
                let revenue = Math.floor(p.income * q * hoursPassed);
                let maxCap = p.cap * q;
                collected += Math.min(revenue, maxCap);
            }
        }
        
        if (collected > 0) {
            user.balance += collected;
            user.dailyIncome = (user.dailyIncome || 0) + collected;
            msg.reply(`💰 Mengambil uang di brankas dulu: Rp ${collected.toLocaleString('id-ID')}`);
        }

        // Proses Transaksi
        user.balance -= cost;
        user.business.owned[type] = (user.business.owned[type] || 0) + qty;
        user.business.lastCollect = now; 
        
        saveDB(db);
        return msg.reply(`🤝 *AKUISISI BERHASIL!*\nKamu membeli ${qty} unit *${PROPERTIES[type].name}*.\n💸 Modal Keluar: Rp ${cost.toLocaleString('id-ID')}`);
    }

    // 4. PANEN DUIT (!collect)
    if (command === 'collect' || command === 'panen' || command === 'tagih') {
        if (hoursPassed < 0.05) return msg.reply("⏳ Karyawan lagi istirahat. Tunggu sebentar lagi.");

        let totalRevenue = 0;
        let details = "";

        for (let [key, qty] of Object.entries(user.business.owned)) {
            if (qty > 0) {
                const p = PROPERTIES[key];
                let revenue = Math.floor(p.income * qty * hoursPassed);
                let maxCap = p.cap * qty;
                
                let actual = Math.min(revenue, maxCap);
                totalRevenue += actual;

                if (revenue >= maxCap) {
                    details += `⚠️ ${p.name}: Penuh (Max Rp ${maxCap.toLocaleString('id-ID')})\n`;
                }
            }
        }

        if (totalRevenue <= 0) return msg.reply("❌ Kasir masih kosong.");

        user.balance += totalRevenue;
        user.dailyIncome = (user.dailyIncome || 0) + totalRevenue;
        user.business.lastCollect = now; 
        saveDB(db);

        let res = `💰 *LAPORAN KEUANGAN* 💰\n\n`;
        res += `💵 Profit Masuk: Rp ${totalRevenue.toLocaleString('id-ID')}\n`;
        res += `💳 Saldo Total: Rp ${user.balance.toLocaleString('id-ID')}\n\n`;
        
        if (details) {
            res += `📝 *Peringatan Manajer:*\n${details}_Jangan kelamaan ditinggal bos!_`;
        }

        return msg.reply(res);
    }
};
