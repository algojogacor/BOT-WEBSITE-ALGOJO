const { saveDB } = require('../helpers/database');

// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

// 👑 DAFTAR NOMOR HP DEVELOPER (WHITELIST)
const ALLOWED_DEVELOPERS = [
    "244203384742140@lid", // ID Kamu (Arya)
    // Tambahkan nomor lain jika perlu: "628xxx@s.whatsapp.net"
];

module.exports = async (command, args, msg, user, db, sock) => {
    // List Command Developer
    const devCommands = [
        'dev', 'godmode',          // Menu
        'resetall', 'resetuser',   // Reset
        'add', 'tambah', 'addmoney', // Uang
        'set', 'setuang', 'setmoney', // Uang
        'timeskip', 'time',        // Waktu
        'give', 'spawn',           // Item
        'setharga', 'marketcrash', // Pasar
        'godsay', 'bc'             // Broadcast
    ];

    if (!devCommands.includes(command)) return;

    // 1. CEK IDENTITAS (SISTEM WHITELIST)
    const sender = msg.key.participant || msg.key.remoteJid;
    if (!ALLOWED_DEVELOPERS.includes(sender)) return; 

    // --- HELPER PENCARI USER BERDASARKAN ID/TAG ---
    const findUserTarget = (input) => {
        // 1. Cek Tag (@user)
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            return msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // 2. Cek ID Angka (1, 2, 3...)
        for (let jid in db.users) {
            if (String(db.users[jid].id) === String(input)) return jid;
        }
        return null; // Gagal
    };

    // ============================================================
    // 📜 MENU DEVELOPER (!dev)
    // ============================================================
    if (command === 'dev' || command === 'godmode') {
        let txt = `🛠️ *GOD MODE CONTROL PANEL* 🛠️\n`;
        txt += `_Authority: Absolute_\n\n`;
        
        txt += `💰 *ECONOMY CHEAT*\n`;
        txt += `• \`!add <id> <jml>\` : Inject uang user.\n`;
        txt += `• \`!set <id> <jml>\` : Atur saldo user.\n`;
        txt += `• \`!setharga <item> <harga>\` : Manipulasi pasar.\n\n`;

        txt += `⏳ *TIME & WORLD*\n`;
        txt += `• \`!timeskip <jam>\` : Percepat waktu (Tani/Ternak).\n`;
        txt += `• \`!give <tipe> <nama> <jml>\` : Spawn item/mesin.\n`;
        txt += `• \`!godsay <pesan>\` : Broadcast pesan bot.\n\n`;

        txt += `💀 *DESTRUCTION*\n`;
        txt += `• \`!resetuser <id>\` : Hapus data 1 user.\n`;
        txt += `• \`!resetall confirm\` : Reset SEMUA user (Bahaya).\n`;

        return msg.reply(txt);
    }

    // ============================================================
    // ⏳ TIME STONE (!timeskip 5) - Maju 5 Jam
    // ============================================================
    if (command === 'timeskip' || command === 'time') {
        const hours = parseInt(args[0]);
        if (isNaN(hours)) return msg.reply("❌ Format: `!timeskip <jam>`");

        const msSkipped = hours * 60 * 60 * 1000;
        let count = 0;

        for (let userId in db.users) {
            const u = db.users[userId];
            
            // 1. Percepat Tanaman (Panen Lebih Cepat)
            if (u.farm && u.farm.plants) {
                u.farm.plants.forEach(p => p.readyAt -= msSkipped);
            }

            // 2. Percepat Mesin Pabrik (Selesai Lebih Cepat)
            if (u.farm && u.farm.processing) {
                u.farm.processing.forEach(p => p.finishAt -= msSkipped);
            }

            // 3. Percepat Lapar Hewan (Majuin waktu makan terakhir)
            if (u.ternak) {
                u.ternak.forEach(a => a.lastFeed -= msSkipped);
            }
            
            // 4. Percepat Bisnis/Properti (Collect lebih banyak)
            if (u.business) {
                // Mundurin lastCollect biar seolah-olah udah lama gak collect
                u.business.lastCollect -= msSkipped; 
            }

            count++;
        }

        saveDB(db);
        return msg.reply(`⏳ *TIME WARP SUKSES*\nWaktu dunia dimajukan *${hours} Jam*.\nEfek: Tanaman panen, Hewan lapar, Mesin kelar.\nTarget: ${count} User.`);
    }

    // ============================================================
    // 📦 ITEM SPAWNER (!give pakan premium 100)
    // ============================================================
    if (command === 'give' || command === 'spawn') {
        // Format: !give <kategori> <item> <jumlah> <target_opsional>
        const category = args[0]?.toLowerCase(); // pakan, mesin, inv
        const item = args[1]?.toLowerCase();
        const qty = parseInt(args[2]) || 1;
        
        // Target diri sendiri (kecuali ada tag)
        let targetJid = sender;
        if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]) {
            targetJid = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }

        const u = db.users[targetJid];
        if (!u) return msg.reply("User tidak ditemukan di DB.");

        if (category === 'pakan') {
            if (!u.ternak_inv) u.ternak_inv = {};
            if (!u.ternak_inv[item]) u.ternak_inv[item] = 0;
            u.ternak_inv[item] += qty;
            msg.reply(`✅ Spawned ${qty} ${item} ke inventory pakan.`);
        } 
        else if (category === 'mesin') {
            if (!u.farm.machines) u.farm.machines = [];
            for(let i=0; i<qty; i++) u.farm.machines.push(item);
            msg.reply(`✅ Spawned ${qty} mesin ${item}.`);
        }
        else if (category === 'inv') { // Buat spawn hasil tani/produk
            if (!u.farm.inventory) u.farm.inventory = {};
            if (!u.farm.inventory[item]) u.farm.inventory[item] = 0;
            u.farm.inventory[item] += qty;
            msg.reply(`✅ Spawned ${qty} ${item} ke gudang.`);
        }
        else {
            msg.reply("❌ Kategori: `pakan`, `mesin`, `inv`.\nContoh: `!give pakan premium 100`");
        }
        saveDB(db);
    }

    // ============================================================
    // 📉 MARKET MANIPULATION (!setharga sawit 50000)
    // ============================================================
    if (command === 'setharga') {
        const item = args[0]?.toLowerCase();
        const price = parseInt(args[1]);

        if (!item || isNaN(price)) return msg.reply("❌ Format: `!setharga <nama_barang> <harga_baru>`");

        if (!db.market.commodities) db.market.commodities = {};
        db.market.commodities[item] = price;
        
        saveDB(db);
        return msg.reply(`📉 *MARKET MANIPULATION*\nHarga *${item.toUpperCase()}* dipaksa jadi Rp ${fmt(price)}.`);
    }

    // ============================================================
    // 📢 GOD SAY (!godsay Halo)
    // ============================================================
    if (command === 'godsay' || command === 'bc') {
        const text = args.join(" ");
        if (!text) return;
        await sock.sendMessage(msg.from, { text: `📢 *PENGUMUMAN ADMIN*\n\n${text}` });
    }

    // ============================================================
    // 💰 ADD MONEY (!add <id> <nominal>)
    // ============================================================
    if (command === 'add' || command === 'tambah' || command === 'addmoney') {
        const targetInput = args[0]; 
        const amount = parseInt(args[1]);
        if (!targetInput || isNaN(amount)) return msg.reply("❌ Format: `!add <id/tag> <jumlah>`");

        const targetJid = findUserTarget(targetInput);
        if (!targetJid) return msg.reply(`❌ User "${targetInput}" tidak ditemukan.`);
        
        if (!db.users[targetJid]) db.users[targetJid] = { balance: 0 }; 
        db.users[targetJid].balance += amount;
        saveDB(db);

        const targetName = db.users[targetJid].name || "User";
        return msg.reply(`✅ *GOD MODE: ADD*\nTarget: ${targetName}\nNominal: +Rp ${fmt(amount)}\nSisa Saldo: Rp ${fmt(db.users[targetJid].balance)}`);
    }

    // ============================================================
    // 💰 SET MONEY (!set <id> <nominal>)
    // ============================================================
    if (command === 'set' || command === 'setuang' || command === 'setmoney') {
        const targetInput = args[0];
        const amount = parseInt(args[1]);
        if (!targetInput || isNaN(amount)) return msg.reply("❌ Format: `!set <id/tag> <jumlah>`");

        const targetJid = findUserTarget(targetInput);
        if (!targetJid) return msg.reply(`❌ User "${targetInput}" tidak ditemukan.`);

        db.users[targetJid].balance = amount;
        saveDB(db);

        const targetName = db.users[targetJid].name || "User";
        return msg.reply(`✅ *GOD MODE: SET*\nTarget: ${targetName}\nSaldo Baru: Rp ${fmt(amount)}`);
    }

    // ============================================================
    // 💀 RESET USER (!resetuser <id>)
    // ============================================================
    if (command === 'resetuser') {
        const targetInput = args[0];
        const targetJid = findUserTarget(targetInput);

        if (!targetJid) return msg.reply(`❌ User "${targetInput}" tidak ditemukan.`);
        
        // Hapus Data
        delete db.users[targetJid];
        saveDB(db);

        return msg.reply(`💀 *AZAB ILAHI TURUN*\nUser dengan ID/Tag tersebut telah dihapus dari database.`);
    }

    // ============================================================
    // 💀 RESET ALL (!resetall confirm)
    // ============================================================
    if (command === 'resetall') {
        if (args[0] !== 'confirm') return msg.reply("⚠️ BAHAYA! Ketik `!resetall confirm` untuk mereset SEMUA USER ke saldo awal.");
        
        let count = 0;
        Object.keys(db.users).forEach(userId => {
            // Reset ke kondisi awal (Starter Pack)
            db.users[userId] = {
                id: db.users[userId].id, // Keep ID
                name: db.users[userId].name, // Keep Name
                balance: 10000000, // Saldo Awal 10 Juta
                level: 1, xp: 0,
                inv: [], ternak: [], farm: { plants: [], inventory: {}, machines: [], processing: [] },
                business: { owned: {}, lastCollect: 0 },
                crypto: {}, portfolio: {}, debt: 0, bank: 0
            };
            count++;
        });

        saveDB(db);
        return msg.reply(`✅ *GLOBAL RESET*\n${count} user direset ke Starter Pack.`);
    }
};
