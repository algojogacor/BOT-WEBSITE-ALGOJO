/**
 * REMINDER SYSTEM v1.0
 * !remind — Set pengingat
 * !remindlist — Lihat daftar reminder
 * !reminddel — Hapus reminder
 */
const { saveDB } = require('../helpers/database');

// Format: !remind 10m Minum obat
// Format: !remind 2h Meeting dengan klien
// Format: !remind 1d Bayar tagihan listrik
// Format: !remind 08:30 Sholat Subuh
// Format: !remind 25/12 Selamat Natal

function parseTime(input) {
    const now = Date.now();

    // Relative time: 5m, 2h, 1d, 30s
    const relMatch = input.match(/^(\d+)(s|m|h|d)$/i);
    if (relMatch) {
        const val = parseInt(relMatch[1]);
        const unit = relMatch[2].toLowerCase();
        const mult = { s:1000, m:60000, h:3600000, d:86400000 };
        return { time: now + val * mult[unit], label: `${val}${unit}` };
    }

    // Time of day: HH:MM
    const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
        const h = parseInt(timeMatch[1]), m = parseInt(timeMatch[2]);
        const d = new Date();
        d.setHours(h, m, 0, 0);
        if (d.getTime() <= now) d.setDate(d.getDate() + 1); // besok jika sudah lewat
        return { time: d.getTime(), label: `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}` };
    }

    // Date: DD/MM
    const dateMatch = input.match(/^(\d{1,2})\/(\d{1,2})$/);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]), month = parseInt(dateMatch[2]) - 1;
        const d = new Date();
        d.setMonth(month, day);
        d.setHours(8, 0, 0, 0); // Default 08:00
        if (d.getTime() <= now) d.setFullYear(d.getFullYear() + 1);
        return { time: d.getTime(), label: `${day}/${month+1}` };
    }

    return null;
}

module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['remind','reminder','pengingat','remindlist','reminddel','remindclear'];
    if (!valid.includes(command)) return;

    const jid = msg.key?.remoteJid || msg.from;
    const sender = msg.key?.participant || msg.key?.remoteJid;
    const now = Date.now();

    if (!db.reminders) db.reminders = {};

    // ── LIHAT DAFTAR ──────────────────────────────────────────
    if (command === 'remindlist') {
        const userReminders = Object.entries(db.reminders)
            .filter(([_, r]) => r.sender === sender)
            .sort(([_,a],[__,b]) => a.time - b.time);
        
        if (!userReminders.length) return msg.reply('📋 Kamu belum punya pengingat aktif.\n\nBuat dengan: `!remind 1h Minum obat`');
        
        const list = userReminders.map(([id, r], i) => {
            const timeLeft = r.time - now;
            const mins = Math.floor(timeLeft / 60000);
            const hours = Math.floor(mins / 60);
            const days = Math.floor(hours / 24);
            let eta = days > 0 ? `${days}h ${hours%24}j lagi` : hours > 0 ? `${hours}j ${mins%60}m lagi` : `${mins}m lagi`;
            return `${i+1}. ⏰ *${r.text}*\n   📅 ${new Date(r.time).toLocaleString('id-ID', {timeZone:'Asia/Jakarta'})} (${eta})\n   🆔 ID: ${id.slice(-6)}`;
        }).join('\n\n');
        
        return msg.reply(`📋 *DAFTAR PENGINGAT KAMU (${userReminders.length}):*\n\n${list}\n\n_!reminddel <ID> untuk hapus_`);
    }

    // ── HAPUS REMINDER ────────────────────────────────────────
    if (command === 'reminddel') {
        const partial = args[0];
        if (!partial) return msg.reply('❌ Format: `!reminddel <6 digit ID>`\nLihat ID dengan: `!remindlist`');
        const found = Object.keys(db.reminders).find(id => id.endsWith(partial) && db.reminders[id].sender === sender);
        if (!found) return msg.reply(`❌ Reminder ID "${partial}" tidak ditemukan atau bukan milikmu.`);
        const deletedText = db.reminders[found].text;
        delete db.reminders[found];
        saveDB(db);
        return msg.reply(`✅ Reminder *"${deletedText}"* berhasil dihapus!`);
    }

    if (command === 'remindclear') {
        const count = Object.keys(db.reminders).filter(id => db.reminders[id].sender === sender).length;
        Object.keys(db.reminders).filter(id => db.reminders[id].sender === sender).forEach(id => delete db.reminders[id]);
        saveDB(db);
        return msg.reply(`✅ ${count} reminder berhasil dihapus semua!`);
    }

    // ── SET REMINDER ──────────────────────────────────────────
    if (!args[0]) {
        return msg.reply(
            `⏰ *PENGINGAT / REMINDER*\n\n` +
            `*Format:*\n` +
            `\`!remind <waktu> <pesan>\`\n\n` +
            `*Format Waktu:*\n` +
            `• \`30s\` — 30 detik lagi\n` +
            `• \`10m\` — 10 menit lagi\n` +
            `• \`2h\` — 2 jam lagi\n` +
            `• \`1d\` — 1 hari lagi\n` +
            `• \`08:30\` — jam 08:30 hari ini/besok\n` +
            `• \`25/12\` — tanggal 25 Desember\n\n` +
            `*Contoh:*\n` +
            `\`!remind 2h Minum obat\`\n` +
            `\`!remind 08:00 Meeting klien\`\n` +
            `\`!remind 1d Bayar tagihan listrik\`\n\n` +
            `📋 \`!remindlist\` — Lihat semua reminder\n` +
            `🗑️ \`!reminddel <ID>\` — Hapus reminder`
        );
    }

    const parsed = parseTime(args[0]);
    if (!parsed) return msg.reply(`❌ Format waktu tidak dikenal: \`${args[0]}\`\n\nGunakan: 10m, 2h, 1d, 08:30, 25/12\nLihat bantuan: \`!remind\``);

    const reminderText = args.slice(1).join(' ');
    if (!reminderText) return msg.reply('❌ Masukkan pesan pengingat!\n\nContoh: `!remind 2h Minum obat dulu`');

    if (parsed.time - now < 5000) return msg.reply('❌ Waktu sudah lewat! Pilih waktu yang akan datang.');
    if (parsed.time - now > 30 * 24 * 3600000) return msg.reply('❌ Maksimal pengingat 30 hari ke depan.');

    // Cek max reminder per user
    const userReminderCount = Object.values(db.reminders).filter(r => r.sender === sender).length;
    if (userReminderCount >= 20) return msg.reply('❌ Kamu sudah punya 20 reminder! Hapus beberapa dulu dengan `!reminddel`');

    const reminderId = `${sender}_${now}_${Math.random().toString(36).slice(2,8)}`;
    db.reminders[reminderId] = {
        sender,
        jid,
        text: reminderText,
        time: parsed.time,
        created: now
    };
    saveDB(db);

    const timeStr = new Date(parsed.time).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', hour12: false });
    const timeLeft = parsed.time - now;
    const mins = Math.floor(timeLeft / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const etaStr = days > 0 ? `${days} hari ${hours%24} jam lagi` : hours > 0 ? `${hours} jam ${mins%60} menit lagi` : `${mins} menit lagi`;

    return msg.reply(
        `✅ *PENGINGAT DISET!*\n\n` +
        `📌 Pesan: *${reminderText}*\n` +
        `📅 Waktu: ${timeStr}\n` +
        `⏳ Durasi: ${etaStr}\n` +
        `🆔 ID: ${reminderId.slice(-6)}\n\n` +
        `_Aku akan mengingatkanmu tepat waktu! ⏰_`
    );
};
