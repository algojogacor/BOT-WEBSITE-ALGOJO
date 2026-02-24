const { saveDB } = require('../helpers/database');


// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');
const safeInt = (val) => isNaN(Number(val)) ? 0 : Number(val);

// ==================================================================
// 💰 DATA REFERENSI HARGA
// ==================================================================

// 1. PROPERTI / BISNIS
const PROPERTY_PRICES = {
    'gerobak': 5_000_000, 'kios': 20_000_000, 'laundry': 50_000_000,
    'warnet': 150_000_000, 'cafe': 400_000_000, 'minimarket': 850_000_000,
    'pabrik': 2_500_000_000, 'spbu': 7_000_000_000, 'hotel': 15_000_000_000,
    'mall': 50_000_000_000, 'maskapai': 200_000_000_000, 'satelit': 1_000_000_000_000
};

// 2. HARGA HEWAN (Ternak)
const ANIMAL_PRICES = {
    'ayam': 50000, 'gurame': 200000, 'kambing': 3000000,
    'sapi': 15000000, 'kuda': 40000000, 'unta': 80000000
};

// 3. HARGA MESIN PABRIK
const FACTORY_MACHINE_PRICES = {
    // TIER 1
    'ayam_1': 15_000_000, 'gurame_1': 25_000_000, 'kambing_1': 50_000_000,
    'sapi_1': 100_000_000, 'kuda_1': 250_000_000, 'unta_1': 500_000_000,
    // TIER 2
    'ayam_2': 30_000_000, 'gurame_2': 50_000_000, 'kambing_2': 100_000_000,
    'sapi_2': 200_000_000, 'kuda_2': 500_000_000, 'unta_2': 1_000_000_000,
    // TIER 3
    'ayam_3': 60_000_000, 'gurame_3': 100_000_000, 'kambing_3': 200_000_000,
    'sapi_3': 400_000_000, 'kuda_3': 1_000_000_000, 'unta_3': 2_500_000_000
};

// 4. HARGA PRODUK PABRIK (Base Price)
const FACTORY_PRODUCT_PRICES = {
    'nugget': 100000, 'fillet': 300000, 'giling_kambing': 200000, 'wagyu': 90000, 'sosis_kuda': 350000, 'susu_unta': 400000,
    'burger': 180000, 'fish_chips': 550000, 'kebab': 350000, 'steak': 180000, 'pizza_kuda': 500000, 'suplemen': 900000,
    'happy_meal': 350000, 'sushi_platter': 900000, 'kambing_guling': 600000, 'beef_wellington': 250000, 'lasagna': 800000, 'elixir': 1800000
};

// 5. HARGA MESIN TANI
const MACHINE_PRICES = {
    'gilingan': 50000000, 'popcorn_maker': 80000000,
    'penggorengan': 150000000, 'roaster': 300000000, 'penyulingan': 1000000000
};
const CROP_PRICES = {
    'padi': 2300000, 'jagung': 6500000, 'bawang': 14000000, 'kopi': 35000000, 'sawit': 80000000,
    'beras': 6000000, 'popcorn': 18000000, 'bawang_goreng': 40000000, 'kopi_bubuk': 100000000, 'minyak': 250000000
};

// 6. HARGA MINING
const MINING_PRICES = { 
    'rtx4070': 4000000000, 'rtx4090': 9500000000, 'dual4090': 15000000000, 'asic': 18000000000, 'usb_miner': 1500000000,
    'quantum_rig': 25000000000
};

const MINING_UPGRADE_PRICES = {
    'cooling': 5_000_000_000,
    'psu': 10_000_000_000,
    'firewall': 20_000_000_000
};

const JOB_TITLES = {
    'petani': "🌾 Petani", 'peternak': "🤠 Peternak", 'polisi': "👮 Polisi"
};

module.exports = async (command, args, msg, user, db, chat, sock) => {
    
   // RUMUS TOTAL KEKAYAAN (NET WORTH)
const calculateNetWorth = (userId, userData) => {
    let total = 0;

    // 1. Uang Tunai & Bank
    total += safeInt(userData.balance);
    total += safeInt(userData.bank);

    // 2. Aset Crypto (FIXED: Tidak ada double-count BTC)
    if (userData.crypto) {
        for (let [coin, amt] of Object.entries(userData.crypto)) {
            let price = db.market?.prices?.[coin]?.price || 0;
            
            // Samakan harga fallback BTC dengan yang ada di command !me
            if (price === 0 && coin === 'btc') {
                price = db.market?.forex?.usd ? (db.market.forex.usd * 63000) : 1_500_000_000;
            }
            
            total += safeInt(amt) * price;
        }
    }

    // 3. Aset Saham
    if (userData.portfolio) {
        for (let [code, stock] of Object.entries(userData.portfolio)) {
            let price = stock.avg;
            if (db.stockMarket?.prices?.[code]) price = db.stockMarket.prices[code].price;
            total += safeInt(stock.qty) * price;
        }
    }

    // 4. VALAS & EMAS
    if (userData.forex) {
         for (let [code, qty] of Object.entries(userData.forex)) {
             let price = db.market?.forex?.[code] || 0;
             if (price === 0) {
                if (code === 'usd') price = 16200;
                if (code === 'eur') price = 17500;
                if (code === 'jpy') price = 110;
                if (code === 'emas') price = 1350000;
             }
             total += safeInt(qty) * price;
         }
    }

    // 5. Ternak
    if (userData.ternak) userData.ternak.forEach(a => total += (ANIMAL_PRICES[a.type] || 0));
    
    // 6. Farming (Mesin & Hasil)
    if (userData.farm?.machines) userData.farm.machines.forEach(m => total += (MACHINE_PRICES[m] || 0));
    if (userData.farm?.inventory) {
        for (let [item, qty] of Object.entries(userData.farm.inventory)) {
            let price = db.market?.commodities?.[item] || CROP_PRICES[item] || 0;
            total += safeInt(qty) * price;
        }
    }

    // 7. Mining (Alat + Upgrade)
    if (userData.mining) {
        if (userData.mining.racks) {
            userData.mining.racks.forEach(m => {
                let marketPrice = db.market?.miningPrices?.[m]; 
                total += safeInt(marketPrice || MINING_PRICES[m] || 0);
            });
        }
        if (userData.mining.upgrades) {
            for (let [upg, active] of Object.entries(userData.mining.upgrades)) {
                if (active) total += safeInt(MINING_UPGRADE_PRICES[upg] || 0);
            }
        }
    }

    // 8. PABRIK / INDUSTRI
    if (db.factories?.[userId]) {
        const myFactory = db.factories[userId];
        // Hitung nilai mesin pabrik
        if (myFactory.machines) {
            myFactory.machines.forEach(m => total += (FACTORY_MACHINE_PRICES[m] || 0));
        }
        // Hitung hasil produksi di inventory pabrik
        if (myFactory.inventory) {
            for (let [item, qty] of Object.entries(myFactory.inventory)) {
                total += safeInt(qty) * (FACTORY_PRODUCT_PRICES[item] || 0);
            }
        }
    }

    // 9. Properti (Bisnis)
    if (userData.business?.owned) {
        for (let [bizId, qty] of Object.entries(userData.business.owned)) {
            total += safeInt(qty) * (PROPERTY_PRICES[bizId] || 0);
        }
    }

    // 10. Kurangi Hutang
    total -= safeInt(userData.debt);

    return total;
};

    const getTitle = (lvl) => {
        if (lvl >= 100) return "🐲 Dragon Slayer";
        if (lvl >= 50) return "👑 Sultan";
        if (lvl >= 30) return "🧛 Lord";
        if (lvl >= 20) return "⚔️ Commander";
        if (lvl >= 10) return "🛡️ Warrior";
        if (lvl >= 5) return "🗡️ Soldier";
        return "🥚 Warga Sipil";
    };

// ==================================================================
    // 1. PROFILE USER (!me) - UPDATED WITH ALL ASSETS
    // ==================================================================
    if (command === "me" || command === "profile" || command === "level") {
        const senderId = msg.author || msg.key.participant || msg.key.remoteJid;
        const netWorth = calculateNetWorth(senderId, user);
        const jobTitle = user.job ? JOB_TITLES[user.job] : "Pengangguran";
        const nextLevelXP = user.level * 1000;
        
        // 1. Hitung Aset Properti/Bisnis
        let propertyAsset = 0;
        if (user.business?.owned) {
            for (let [k, v] of Object.entries(user.business.owned)) propertyAsset += (PROPERTY_PRICES[k] || 0) * v;
        }

        // 2. Hitung Aset Valas & Emas
        let valasAsset = 0;
        if (user.forex) {
             for (let [code, qty] of Object.entries(user.forex)) {
                 let price = db.market?.forex?.[code] || 0;
                 if (price === 0 && code === 'usd') price = 16200;
                 if (price === 0 && code === 'eur') price = 17500;
                 if (price === 0 && code === 'jpy') price = 110;
                 if (price === 0 && code === 'emas') price = 1350000;
                 valasAsset += safeInt(qty) * price;
             }
        }

       // 3. Hitung Aset Mining (SINKRON DENGAN HARGA PASAR)
        let miningAsset = 0;
        if (user.mining?.racks) {
            user.mining.racks.forEach(m => {
                let marketPrice = db.market?.miningPrices?.[m]; 
                miningAsset += safeInt(marketPrice || MINING_PRICES[m] || 0);
            });
        }
        if (user.mining?.upgrades) {
            const UPG_PRICES = { 'cooling': 5000000000, 'psu': 10000000000, 'firewall': 20000000000 };
            for (let [u, a] of Object.entries(user.mining.upgrades)) {
                if (a) miningAsset += (UPG_PRICES[u] || 0);
            }
        }

        // 4. Hitung Aset Crypto (SINKRON DENGAN NET WORTH)
        let cryptoAsset = 0;
        if (user.crypto) {
            for (let [coin, amt] of Object.entries(user.crypto)) {
                let price = db.market?.prices?.[coin]?.price || 0;
                if (price === 0 && coin === 'btc') {
                    price = db.market?.forex?.usd ? (db.market.forex.usd * 63000) : 1_500_000_000;
                }
                cryptoAsset += safeInt(amt) * price;
            }
        }

        // 5. Hitung Aset Pabrik (Mesin & Inventori) - NEW!
        let factoryAsset = 0;
        if (db.factories?.[senderId]) {
            const myFactory = db.factories[senderId];
            if (myFactory.machines) {
                myFactory.machines.forEach(m => factoryAsset += (FACTORY_MACHINE_PRICES[m] || 0));
            }
            if (myFactory.inventory) {
                for (let [item, qty] of Object.entries(myFactory.inventory)) {
                    factoryAsset += safeInt(qty) * (FACTORY_PRODUCT_PRICES[item] || 0);
                }
            }
        }

        // 6. Hitung Aset Ternak & Tani - NEW!
        let farmAsset = 0;
        if (user.ternak) user.ternak.forEach(a => farmAsset += (ANIMAL_PRICES[a.type] || 0));
        if (user.farm?.machines) user.farm.machines.forEach(m => farmAsset += (MACHINE_PRICES[m] || 0));
        if (user.farm?.inventory) {
            for (let [item, qty] of Object.entries(user.farm.inventory)) {
                let price = db.market?.commodities?.[item] || CROP_PRICES[item] || 0;
                farmAsset += safeInt(qty) * price;
            }
        }

        // 7. Hitung Aset Saham - NEW!
        let sahamAsset = 0;
        if (user.portfolio) {
            for (let [code, stock] of Object.entries(user.portfolio)) {
                let price = stock.avg;
                if (db.stockMarket?.prices?.[code]) price = db.stockMarket.prices[code].price;
                sahamAsset += safeInt(stock.qty) * price;
            }
        }

        let txt = `👤 *KARTU IDENTITAS* 👤\n`;
        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        txt += `🏷️ Nama: *${user.name || msg.pushName}*\n`;
        txt += `💼 Profesi: *${jobTitle}*\n`;
        txt += `🎖️ Pangkat: ${getTitle(user.level)} (Lv.${user.level})\n`;
        txt += `✨ XP: ${Math.floor(user.xp)} / ${nextLevelXP}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        txt += `💰 *RINCIAN KEKAYAAN*\n`;
        txt += `💵 Tunai: Rp ${fmt(user.balance)}\n`;
        txt += `🏦 Bank: Rp ${fmt(user.bank)}\n`;
        txt += `💱 Valas/Emas: Rp ${fmt(valasAsset)}\n`;
        txt += `🏢 Properti: Rp ${fmt(propertyAsset)}\n`;
        txt += `⛏️ Perangkat Mining: Rp ${fmt(miningAsset)}\n`;
        txt += `🪙 Aset Crypto: Rp ${fmt(cryptoAsset)}\n`;
        txt += `📈 Saham: Rp ${fmt(sahamAsset)}\n`;               
        txt += `🏭 Industri: Rp ${fmt(factoryAsset)}\n`;            
        txt += `🚜 Ternak & Tani: Rp ${fmt(farmAsset)}\n`;          
        if (user.debt > 0) txt += `⚠️ Hutang: -Rp ${fmt(user.debt)}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        txt += `💎 *NET WORTH (BERSIH)*\n`;
        txt += `Rp ${fmt(netWorth)}\n`;
        txt += `━━━━━━━━━━━━━━━━━━━\n`;
        
        return msg.reply(txt);
    }
    
    // ==================================================================
    // 2. LEADERBOARD (!rank)
    // ==================================================================
    if (command === "rank" || command === "top" || command === "leaderboard") {
        let targetIds = [];
        let titleHeader = "";

        try {
            if (chat.isGroup) {
                if (!sock) return msg.reply("❌ Error Sistem: Socket.");
                const metadata = await sock.groupMetadata(chat.id._serialized);
                targetIds = metadata.participants.map(p => p.id);
                titleHeader = `🏆 *TOP SULTAN (GRUP)* 🏆\n_(Total Aset Lengkap - Hutang)_`;
            } else {
                targetIds = Object.keys(db.users);
                titleHeader = `🌍 *TOP SULTAN GLOBAL* 🏆`;
            }

            let allPlayers = targetIds
                .filter(id => db.users[id])
                .map(id => {
                    const data = db.users[id];
                    return {
                        id: id,
                        name: data.name || "Warga",
                        job: data.job ? (JOB_TITLES[data.job] || "-") : "-",
                        // Pass ID agar pabrik & semua aset terhitung
                        netWorth: calculateNetWorth(id, data) 
                    };
                });

            allPlayers.sort((a, b) => b.netWorth - a.netWorth);
            const top10 = allPlayers.slice(0, 10);
            
            let text = `${titleHeader}\n━━━━━━━━━━━━━━━━━\n`;
            
            if (top10.length === 0) text += "_Belum ada data._";
            else {
                top10.forEach((u, i) => {
                    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                    const mentionId = `@${u.id.split('@')[0]}`;
                    text += `${medal} ${mentionId}\n   └ 💼 ${u.job} | 💎 Rp ${fmt(u.netWorth)}\n`;
                });
            }

            const senderId = msg.author || msg.key.participant || msg.key.remoteJid;
            const myRank = allPlayers.findIndex(u => u.id === senderId);
            if (myRank !== -1) text += `━━━━━━━━━━━━━━━━━\n👤 Posisi Kamu: #${myRank + 1}`;

            if (chat.sendMessage) await chat.sendMessage({ text: text, mentions: top10.map(u => u.id) });
            else await sock.sendMessage(msg.key.remoteJid, { text: text, mentions: top10.map(u => u.id) }, { quoted: msg });

        } catch (err) {
            console.error("Error Rank:", err);
            msg.reply("⚠️ Gagal mengambil rank.");
        }
    }
    
    // ==================================================================
    // 3. INVENTORY LENGKAP (!inv)
    // ==================================================================
    if (command === "inv" || command === "inventory" || command === "tas") {
        let txt = `🎒 *INVENTORY PLAYER*\n━━━━━━━━━━━━━━━━━\n`;
        
        // 1. Item Dasar
        const counts = {};
        if (user.inv) user.inv.forEach(x => { counts[x] = (counts[x] || 0) + 1; });
        if (Object.keys(counts).length > 0) {
            txt += `📦 *BARANG UMUM:*\n`;
            for (let [k, v] of Object.entries(counts)) txt += `- ${k.toUpperCase()} (x${v})\n`;
            txt += `\n`;
        }

        // 2. Properti
        if (user.business && user.business.owned) {
            let hasProp = false;
            let subTxt = `🏢 *ASET PROPERTI:*\n`;
            for (let [k, v] of Object.entries(user.business.owned)) {
                if (v > 0) { subTxt += `- ${k.toUpperCase()} (${v} Unit)\n`; hasProp = true; }
            }
            if (hasProp) txt += subTxt + `\n`;
        }

        // 3. Valas & Emas (LENGKAP)
        if (user.forex) {
            let hasForex = false;
            let subTxt = `💱 *VALAS & EMAS:*\n`;
            if (user.forex.usd > 0) { subTxt += `- USD: $${fmt(user.forex.usd)}\n`; hasForex = true; }
            if (user.forex.eur > 0) { subTxt += `- EUR: €${fmt(user.forex.eur)}\n`; hasForex = true; }
            if (user.forex.jpy > 0) { subTxt += `- JPY: ¥${fmt(user.forex.jpy)}\n`; hasForex = true; }
            if (user.forex.emas > 0) { subTxt += `- EMAS: ${fmt(user.forex.emas)}g\n`; hasForex = true; }
            if (hasForex) txt += subTxt + `\n`;
        }

        // 4. Pertanian & Pabrik (Digabung biar ringkas)
        if (user.farm?.inventory || (db.factories?.[msg.author]?.inventory)) {
             txt += `🌾 *HASIL BUMI & INDUSTRI:*\n`;
             if (user.farm?.inventory) {
                 for (let [k, v] of Object.entries(user.farm.inventory)) if (v>0) txt += `- ${k.toUpperCase()} (${v})\n`;
             }
             const senderId = msg.author || msg.key.participant || msg.key.remoteJid;
             if (db.factories?.[senderId]?.inventory) {
                 for (let [k, v] of Object.entries(db.factories[senderId].inventory)) {
                     if (v>0) {
                         const n = FACTORY_PRODUCT_PRICES[k] ? k.toUpperCase() : k;
                         txt += `- ${n} (${v})\n`;
                     }
                 }
             }
        }

        return msg.reply(txt);
    }

    // ==================================================================
    // 4. QUEST (Tetap)
    // ==================================================================
    if (command === "quest" || command === "misi") {
        if (!user.quest) return msg.reply("❌ Data quest belum reset.");
        let text = `📜 *MISI HARIAN*\n\n`;
        user.quest.daily.forEach(q => {
            const percent = Math.min(100, Math.floor((q.progress / q.target) * 100));
            const status = q.claimed ? "✅" : (percent >= 100 ? "🎁" : "🔄");
            text += `${status} *${q.name}* (${q.progress}/${q.target})\n   Reward: Rp ${fmt(q.reward)}\n`;
        });
        text += `\n💡 Ketik *!claim* untuk ambil hadiah.`;
        return msg.reply(text);
    }

    if (command === "claim") {
        if (!user.quest) return;
        let totalGift = 0;
        let count = 0;
        user.quest.daily.forEach(q => {
            if (q.progress >= q.target && !q.claimed) {
                q.claimed = true; totalGift += q.reward; count++;
            }
        });
        if (count === 0) return msg.reply("❌ Belum ada misi selesai.");
        user.balance += totalGift;
        saveDB(db);
        return msg.reply(`🎉 *KLAIM SUKSES*\n💰 Dapat: Rp ${fmt(totalGift)}`);
    }

};
