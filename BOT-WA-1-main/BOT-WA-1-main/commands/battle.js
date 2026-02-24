const { saveDB } = require('../helpers/database');

// Variabel Memory Global
const battles = {}; 

module.exports = async (command, args, msg, user, db) => {
    // 1. Helper ID yang Konsisten
    // Mengubah ID ribet (628123:15@c.us) jadi bersih (628123@c.us)
    const getCleanId = (id) => {
        if (!id) return null;
        if (typeof id !== 'string') id = id._serialized || id.user + '@c.us'; // Handle object id
        return id.replace(/:[0-9]+/, ''); // Hapus suffix device (:12)
    };
    
    // Ambil ID Pengirim & Chat
    const rawSender = msg.author; // Hanya gunakan msg.author untuk grup
    const sender = getCleanId(rawSender);
    const chatId = msg.from; // ID Grup tempat main
    const body = msg.body.trim().toLowerCase();

    // Debugging (Cek di Terminal)
    // console.log(`[BATTLE DEBUG] Cmd: ${command} | Sender: ${sender} | Chat: ${chatId}`);

    // --- LOGIKA 1: MENANTANG (!pvp / !battle) ---
    if (command === "pvp" || command === "battle") {
        if (battles[chatId]) {
            return msg.reply(`❌ Masih ada pertarungan aktif di sini!\nAntara: @${battles[chatId].p1.split('@')[0]} vs @${battles[chatId].p2.split('@')[0]}`, null, { mentions: [battles[chatId].p1, battles[chatId].p2] });
        }

        const targetMention = msg.mentionedIds[0];
        if (!targetMention) return msg.reply("❌ Tag lawanmu! Contoh: `!pvp @user`");
        
        const targetClean = getCleanId(targetMention);

        if (targetClean === sender) return msg.reply("❌ Gak bisa lawan diri sendiri.");

        // Setup Data Battle
        battles[chatId] = {
            p1: sender,
            p2: targetClean,
            p1_hp: 100 + (user.level * 10),
            p1_maxhp: 100 + (user.level * 10),
            p2_hp: 100 + ((db.users[targetClean]?.level || 1) * 10),
            p2_maxhp: 100 + ((db.users[targetClean]?.level || 1) * 10),
            turn: sender, // Penantang jalan duluan
            status: "waiting", // Menunggu diterima
            lastAction: Date.now(),
            log: "Pertarungan dimulai!"
        };

        console.log(`[BATTLE] Baru: ${sender} vs ${targetClean} di ${chatId}`);
        return msg.reply(`⚔️ *TANTANGAN DIBUAT!*\n\n🔴 @${sender.split('@')[0]}\n      VS\n🔵 @${targetClean.split('@')[0]}\n\nKetik *!terima* untuk memulai gelud!`, null, { mentions: [sender, targetClean] });
    }

    // --- LOGIKA 2: STOP (!stopbattle) ---
    if (command === "stopbattle" || command === "surrender" || command === "nyerah") {
        if (battles[chatId]) {
            // Hanya peserta battle atau admin (opsional) yang bisa stop
            if (battles[chatId].p1 !== sender && battles[chatId].p2 !== sender) {
                return msg.reply("❌ Kamu bukan peserta battle ini.");
            }
            delete battles[chatId];
            return msg.reply("🏳️ Pertarungan dihentikan.");
        }
    }

    // --- LOGIKA 3: TERIMA (!terima) ---
    // Cek command 'terima' ATAU jika body text persis '!terima'
    if (command === "terima" || body === "!terima") {
        // Pastikan di grup
        if (!chatId.includes('@g.us') && !chatId.includes('@lid')) {
            return msg.reply("❌ Terima tantangan di grup yang sama!");
        }

        const b = battles[chatId];
        
        // Debug
        console.log(`[BATTLE] Cek Terima. ChatId: ${chatId}. Ada Battle? ${!!b}. Status? ${b?.status}. P2? ${b?.p2}. Sender? ${sender}`);

        if (!b || b.status !== "waiting") {
            if (!b) {
                return msg.reply("❌ Tidak ada tantangan aktif di grup ini. Pastikan kamu menerima di grup yang sama dengan tantangan!");
            }
            return; // Jangan respon kalau status bukan waiting
        }

        // Mulai battle tanpa validasi ID spesifik - terbuka untuk semua
        b.status = "playing";
        b.lastAction = Date.now();
        console.log(`[BATTLE] Dimulai di ${chatId} oleh ${sender}`);
        return sendStatus(msg, b);
    }

    // --- LOGIKA 4: GAMEPLAY (Tanpa Prefix) ---
    const b = battles[chatId];
    if (b && b.status === "playing") {
        
        // 1. Cek Timeout (2 Menit)
        if (Date.now() - b.lastAction > 120000) {
            delete battles[chatId];
            return msg.reply("⏱️ Battle berakhir karena kelamaan mikir (AFK).");
        }

        // 2. Cek Giliran
        if (sender !== b.turn) {
            return; // Diam saja kalau bukan gilirannya
        }

        const input = body; // Input mentah (1, 2, serang, heal)
        let actionTaken = false;
        let dmg = 0, heal = 0;
        
        const isP1 = sender === b.p1;
        const target = isP1 ? "p2" : "p1"; 
        const self = isP1 ? "p1" : "p2";

        // AKSI SERANG
        if (["1", "serang", "attack", "hajar"].includes(input)) {
            actionTaken = true;
            const chance = Math.random();
            
            if (chance < 0.15) { // Miss
                b.log = `💨 Serangan @${sender.split('@')[0]} *MELESET!*`;
            } else if (chance > 0.85) { // Crit
                dmg = Math.floor((Math.random() * 25) + 30);
                b[`${target}_hp`] -= dmg;
                b.log = `🔥 *CRITICAL!* -${dmg} HP ke lawan!`;
            } else { // Normal
                dmg = Math.floor((Math.random() * 15) + 15);
                b[`${target}_hp`] -= dmg;
                b.log = `💥 Serangan masuk: -${dmg} HP`;
            }
        } 
        // AKSI HEAL
        else if (["2", "heal", "obat"].includes(input)) {
            actionTaken = true;
            const current = b[`${self}_hp`];
            const max = b[`${self}_maxhp`];
            
            if (current >= max) {
                b.log = `🤦‍♂️ HP penuh woy, buang-buang giliran aja!`;
            } else {
                heal = Math.floor(Math.random() * 20) + 10;
                b[`${self}_hp`] = Math.min(current + heal, max);
                b.log = `🧪 Minum potion: +${heal} HP`;
            }
        }

        if (!actionTaken) return; // Bukan input game, abaikan

        b.lastAction = Date.now();

        // 3. Cek Kematian
        if (b.p1_hp <= 0 || b.p2_hp <= 0) {
            const winnerId = b.p1_hp > 0 ? b.p1 : b.p2;
            const loserId = b.p1_hp > 0 ? b.p2 : b.p1;

            if (db.users[winnerId]) {
                db.users[winnerId].balance += 500;
                db.users[winnerId].xp += 150;
            }
            if (db.users[loserId]) {
                db.users[loserId].xp += 25;
            }
            saveDB(db);
            delete battles[chatId];
            
            return msg.reply(`🏆 *GAME OVER*\n\n👑 Menang: @${winnerId.split('@')[0]}\n💀 Kalah: @${loserId.split('@')[0]}\n\n💰 +500 Gold`, null, { mentions: [winnerId, loserId] });
        }

        // Ganti Giliran
        b.turn = isP1 ? b.p2 : b.p1;
        return sendStatus(msg, b);
    }
};

// Helper Kirim Status
async function sendStatus(msg, b) {
    const bar = (now, max) => {
        const percent = Math.max(0, Math.min(10, Math.floor((now / max) * 10)));
        return '🟩'.repeat(percent) + '⬜'.repeat(10 - percent);
    };

    const p1Name = b.p1.split('@')[0];
    const p2Name = b.p2.split('@')[0];
    const turnName = b.turn.split('@')[0];

    const txt = `⚔️ *BATTLE ARENA* ⚔️\n\n` +
                `📝 _${b.log}_\n` +
                `➖➖➖➖➖➖➖➖➖➖\n` +
                `🔴 *${p1Name}* ${b.turn === b.p1 ? '⬅️' : ''}\n` +
                `❤️ ${Math.floor(b.p1_hp)}/${b.p1_maxhp}\n${bar(b.p1_hp, b.p1_maxhp)}\n\n` +
                `🔵 *${p2Name}* ${b.turn === b.p2 ? '⬅️' : ''}\n` +
                `❤️ ${Math.floor(b.p2_hp)}/${b.p2_maxhp}\n${bar(b.p2_hp, b.p2_maxhp)}\n` +
                `➖➖➖➖➖➖➖➖➖➖\n` +
                `Giliran: *@${turnName}*\n` +
                `Ketik *1* (Serang) atau *2* (Heal)`;
    
    return msg.reply(txt, null, { mentions: [b.p1, b.p2, b.turn] });
}