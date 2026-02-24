const { saveDB, addQuestProgress } = require('../helpers/database');

// DAFTAR ITEM DI TOKO
const shopItems = {
    "xp-boost": { 
        name: "⚡ XP Booster (1 Jam)", 
        price: 500, 
        type: "buff", 
        effect: "xp", 
        duration: 3600000 
    },
    "gacha-charm": { 
        name: "🍀 Gacha Charm (2 Jam)", 
        price: 100000000, 
        type: "buff", 
        effect: "gacha", 
        duration: 7200000 
    }
};

module.exports = async (command, args, msg, user, db) => {
    // Inisialisasi variabel user
    if (typeof user.balance === 'undefined') user.balance = 0;
    if (!user.buffs) user.buffs = {};
    if (!user.inv) user.inv = [];
    
    const now = Date.now();

    // Fungsi Helper untuk parsing jumlah taruhan
    const parseBet = (input) => {
        if (!input) return null;
        if (input.toLowerCase() === 'all') return user.balance;
        const val = parseInt(input);
        return (isNaN(val) || val <= 0) ? null : val;
    };

    // Fungsi Helper Quest
    const handleQuest = (u, type) => {
        try {
            if (typeof addQuestProgress === 'function') {
                return addQuestProgress(u, type);
            }
        } catch (e) {
            console.log("Quest Error:", e);
        }
        return null;
    };

    // 1. CEK SALDO
    if (command === "coin" || command === "balance" || command === "dompet") {
        return msg.reply(`💰 Saldo Utama: *💰${Math.floor(user.balance).toLocaleString('id-ID')}* Koin\n(Bisa dipakai untuk Trading Crypto & Casino)`);
    }

    // 2. KLAIM HARIAN
    if (command === "daily") {
        const COOLDOWN = 86400000; // 24 Jam
        if (user.lastDaily && now - user.lastDaily < COOLDOWN) {
            const sisaMs = COOLDOWN - (now - user.lastDaily);
            const sisaJam = Math.floor(sisaMs / 3600000);
            const sisaMenit = Math.floor((sisaMs % 3600000) / 60000);
            return msg.reply(`⏳ Sabar... Tunggu *${sisaJam} jam ${sisaMenit} menit* lagi.`);
        }
        user.balance += 500; 
        user.dailyIncome = (user.dailyIncome || 0) + 500;
        user.lastDaily = now;
        saveDB(db);
        return msg.reply("🎁 *DAILY CLAIM*\nKamu mendapatkan 💰500 koin! Gunakan untuk modal trading.");
    }

    // 3. GAME CASINO (HARD MODE - 35% Win Rate)
    if (command === "casino" || command === "judi") {
        const bet = parseBet(args[0]);
        if (!bet) return msg.reply("❌ Format: `!casino <jumlah>`\nContoh: `!casino 100`");
        if (user.balance < bet) return msg.reply("❌ Uang tidak cukup!");

        // Logika Menang/Kalah (DIPERSULIT)
        let winThreshold = 0.65; // 65% Kalah
        let bonusText = "";

        // 🎉 EVENT: Winrate Gila (Admin Abuse)
        const winrateGilaAktif = db.settings?.winrateGila && Date.now() < db.settings.winrateGilaUntil;
        if (winrateGilaAktif) {
            winThreshold = 0.15; // 85% Menang!
            bonusText = "\n🎉 *EVENT WINRATE GILA AKTIF!* (85% Menang)";
        }

        // Cek Buff Charm (hanya jika event tidak aktif)
        if (!winrateGilaAktif && user.buffs.gacha?.active && now < user.buffs.gacha.until) {
            winThreshold = 0.50; // Jadi 50%
            bonusText = "\n🍀 *Luck Charm Active!* (Chance Up)";
        }

        const roll = Math.random();
        const menang = roll > winThreshold;

        if (menang) {
            const profit = bet; 
            user.balance += profit;
            user.dailyIncome = (user.dailyIncome || 0) + profit;
            msg.reply(`🎉 *WIN!* Kartu bagus!\nProfit: +💰${profit.toLocaleString('id-ID')}${bonusText}\n💰 Saldo: 💰${Math.floor(user.balance).toLocaleString('id-ID')}`);
        } else {
            user.balance -= bet;
            msg.reply(`💸 *LOSE...* Bandar menang.\nHilang: -💰${bet.toLocaleString('id-ID')}\n💰 Saldo: 💰${Math.floor(user.balance).toLocaleString('id-ID')}`);
        }
        
        handleQuest(user, "game");
        saveDB(db);
    }

    // 4. GAME SLOT (EXTREME HARD MODE)
    if (command === "slot") {
        const bet = parseBet(args[0]);
        if (!bet) return msg.reply("❌ Format: `!slot <jumlah>`");
        if (user.balance < bet) return msg.reply("❌ Uang kurang.");

        // Pool "Sampah" diperbanyak agar SUSAH dapat kembar
        // Ratio: 5 Bagus vs 5 Sampah (Peluang pair turun drastis)
        const emojis = ["🍒", "🍋", "🍇", "💎", "7️⃣", "💩", "🦴", "🏴‍☠️", "🌑", "🥀"];
        
        const r = () => emojis[Math.floor(Math.random() * emojis.length)];
        let a = r(), b = r(), c = r();

        // Manipulasi Buff (Sedikit bantuan kalau punya charm)
        if (user.buffs.gacha?.active && now < user.buffs.gacha.until && Math.random() > 0.6) {
            b = a; 
        }

        // 🎉 EVENT: Winrate Gila — slot selalu jackpot 3 sama
        if (db.settings?.winrateGila && Date.now() < db.settings.winrateGilaUntil) {
            b = a; c = a; // Paksa 3 sama
        }

        let resMsg = `🎰 | ${a} | ${b} | ${c} |\n\n`;
        let winAmount = 0;

        // Jackpot (3 Sama) - Hadiah Gede karena susah banget
        if (a === b && b === c) {
            winAmount = bet * 15; 
            if (a === "7️⃣") winAmount = bet * 30; 
            if (a === "💎") winAmount = bet * 75; 
            
            user.balance += winAmount;
            user.dailyIncome = (user.dailyIncome || 0) + winAmount;
            resMsg += `🚨 *JACKPOT SULTAN!!!* 🚨\nAnda menang 💰${winAmount.toLocaleString('id-ID')}!`;
        } 
        // Pair (2 Sama) - Hadiah dikit (Balik modal sebagian)
        else if (a === b || b === c || a === c) {
            winAmount = Math.floor(bet * 0.5); 
            user.balance += winAmount;
            user.dailyIncome = (user.dailyIncome || 0) + winAmount;
            resMsg += `✨ *Pair!* (2 Gambar sama).\nHadiah: 💰${winAmount.toLocaleString('id-ID')}`;
        } 
        // Kalah
        else {
            user.balance -= bet;
            resMsg += `💀 *Rungkad.* Coba lagi! -💰${bet.toLocaleString('id-ID')}`;
        }

        handleQuest(user, "game");
        saveDB(db);
        return msg.reply(resMsg);
    }

    // 5. GAME TEBAK TEMBOK (!tembok) - Chance 33%
    if (command === "tembok" || command === "wall") {
        const bet = parseBet(args[0]);
        const choice = parseInt(args[1]);

        if (!bet || !choice || choice < 1 || choice > 3) {
            return msg.reply(`🧱 *TEBAK DIBALIK TEMBOK* 🧱\n\nAda 3 Tembok. Satu berisi Harta, dua berisi Hantu.\n\nCara main: \`!tembok <bet> <pilihan 1-3>\`\nContoh: \`!tembok 1000 2\``);
        }

        if (user.balance < bet) return msg.reply("❌ Uang tidak cukup.");

        // Logika Game
        // 1 = Menang, 2 & 3 = Kalah (Posisi diacak)
        const contents = ["💰", "👻", "👹"]; 
        
        // Acak posisi isi tembok
        for (let i = contents.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [contents[i], contents[j]] = [contents[j], contents[i]];
        }

        const userGet = contents[choice - 1];
        let resultMsg = `🧱 *MEMBUKA TEMBOK NO. ${choice}...* 🔨\n\n`;
        
        resultMsg += `[ 1 ] [ 2 ] [ 3 ]\n`;
        resultMsg += `[ ${contents[0]} ] [ ${contents[1]} ] [ ${contents[2]} ]\n\n`;

        if (userGet === "💰") {
            const profit = Math.floor(bet * 2.5); // Menang x2.5
            user.balance += profit;
            user.dailyIncome = (user.dailyIncome || 0) + profit;
            resultMsg += `🎉 *BERHASIL!* Kamu menemukan Harta Karun!\nProfit: +💰${profit.toLocaleString('id-ID')}`;
        } else {
            user.balance -= bet;
            resultMsg += `😱 *ZONK!* Ada hantu dibalik tembok!\nKamu kehilangan -💰${bet.toLocaleString('id-ID')}`;
        }

        handleQuest(user, "game");
        saveDB(db);
        return msg.reply(resultMsg);
    }

    // 6. GACHA
    if (command === "gacha") {
        const COST = 200; 
        if (user.balance < COST) return msg.reply(`❌ Butuh 💰${COST} untuk Gacha.`);

        user.balance -= COST;

        const roll = Math.floor(Math.random() * 100) + 1; 
        let reward = 0;
        let rarity = "Ampas";

        if (roll === 100) { 
            reward = 10000; 
            rarity = "🔥 MYTHICAL (0.1%)";
        } else if (roll > 95) { 
            reward = 2000;
            rarity = "💎 LEGENDARY";
        } else if (roll > 80) { 
            reward = 500;
            rarity = "✨ EPIC";
        } else if (roll > 50) { 
            reward = 100;
            rarity = "📦 COMMON";
        } else {
            reward = 0;
            rarity = "💩 ZONK";
        }

        user.balance += reward;
        user.dailyIncome = (user.dailyIncome || 0) + reward;
        const qMsg = handleQuest(user, "game");
        
        saveDB(db);

        let txt = `🎰 *GACHA MACHINE* 🎰\n\n`;
        txt += `Hasil: *${rarity}*\n`;
        txt += `Hadiah: 💰${reward.toLocaleString('id-ID')}\n`;
        txt += `Sisa Saldo: 💰${Math.floor(user.balance).toLocaleString('id-ID')}`;
        if (qMsg) txt += `\n\n${qMsg}`;
        
        return msg.reply(txt);
    }

    // 7. TRANSFER (GIVE)
    if (command === "give" || command === "transfer" || command === "tf") {
        const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        let targetId = mentions[0];

        if (!targetId && args[0]) {
            targetId = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        }

        let amount = parseInt(args[1]);
        if (isNaN(amount)) amount = parseInt(args[0]);

        if (!targetId || isNaN(amount) || amount <= 0) {
            return msg.reply("❌ Format Salah!\nContoh: `!tf @user 1000`");
        }

        if (!db.users[targetId]) {
            db.users[targetId] = { 
                balance: 0, xp: 0, level: 1, crypto: {}, debt: 0, inv: [], buffs: {} 
            };
        }

        const senderId = msg.key.remoteJid || msg.author;
        if (targetId === senderId) return msg.reply("❌ Gak bisa transfer ke diri sendiri.");
        if (user.balance < amount) return msg.reply("❌ Uang gak cukup.");

        user.balance -= amount;
        db.users[targetId].balance = (db.users[targetId].balance || 0) + amount;

        saveDB(db);

        const { getChat } = msg; 
        const chat = await msg.getChat();
        await chat.sendMessage(`✅ *TRANSFER SUKSES*\nDikirim: 💰${amount.toLocaleString('id-ID')}\nKe: @${targetId.split('@')[0]}`, { mentions: [targetId] });
    }

    // 8. SHOP & INVENTORY
    if (command === "shop") {
        let text = `🛒 *MARKETPLACE ITEM*\n\n`;
        for (const key in shopItems) {
            const item = shopItems[key];
            text += `📦 *${item.name}*\n└ ID: \`${key}\` | Harga: 💰${item.price.toLocaleString('id-ID')}\n\n`;
        }
        text += `💡 Beli: \`!buy <id>\` | Pakai: \`!use <id>\``;
        return msg.reply(text);
    }

    if (command === "inv" || command === "tas") {
        if (!user.inv || user.inv.length === 0) return msg.reply("🎒 Tas kamu kosong melompong.");
        
        const counts = {};
        user.inv.forEach(x => { counts[x] = (counts[x] || 0) + 1; });

        let text = `🎒 *ISI TAS KAMU*\n\n`;
        for (const kode in counts) {
            const item = shopItems[kode];
            text += `• ${item ? item.name : kode} (x${counts[kode]})\n`;
        }
        text += `\nGunakan item dengan \`!use <nama_id>\``;
        return msg.reply(text);
    }

    if (command === "buy") {
        const kode = args[0];
        if (!shopItems[kode]) return msg.reply("❌ Barang tidak ada di toko.");
        
        const item = shopItems[kode];
        if (user.balance < item.price) return msg.reply(`❌ Uang kurang! Butuh 💰${item.price.toLocaleString('id-ID')}`);

        user.balance -= item.price;
        user.inv.push(kode);
        saveDB(db);
        return msg.reply(`✅ Sukses membeli *${item.name}*!`);
    }

    if (command === "use") {
        const kode = args[0];
        const index = user.inv.indexOf(kode);
        if (index === -1) return msg.reply("❌ Kamu gak punya item ini.");
        
        const item = shopItems[kode];
        
        if (item.type === "buff") {
            if (user.buffs[item.effect]?.active && now < user.buffs[item.effect].until) {
                return msg.reply("❌ Buff ini masih aktif! Tunggu habis dulu.");
            }

            user.buffs[item.effect] = { active: true, until: now + item.duration };
            user.inv.splice(index, 1); 
            saveDB(db);
            return msg.reply(`🍹 *${item.name}* Diminum!\nEfek aktif selama 1 jam.`);
        }
    }
};

