/**
 * GROUP MANAGEMENT v2.0
 * !tagall — Tag semua anggota grup
 * !hidetag — Tag semua tanpa mention terlihat
 * !kick — Keluarkan anggota
 * !add — Tambahkan anggota
 * !promote — Jadikan admin
 * !demote — Turunkan dari admin
 * !groupinfo — Info grup detail
 * !antilink — Toggle anti-link
 * !antispam — Toggle anti-spam
 * !welcome — Set pesan selamat datang
 * !goodbye — Set pesan perpisahan
 * !mute — Bisukan grup (hanya admin bisa chat)
 * !unmute — Buka kembali chat grup
 * !setrules — Set peraturan grup
 * !rules — Lihat peraturan grup
 */
const { saveDB } = require('../helpers/database');

module.exports = async (command, args, msg, user, db, sock, m) => {
    const valid = ['tagall','hidetag','kick','add','promote','demote','groupinfo','antilink','antispam','welcome','goodbye','mute','unmute','setrules','rules','listadmin','setdesc'];
    if (!valid.includes(command)) return;

    const jid = msg.key?.remoteJid || msg.from;
    const isGroup = jid?.endsWith('@g.us');
    if (!isGroup) return msg.reply('❌ Perintah ini hanya untuk grup!');

    const sender = msg.key?.participant || msg.key?.remoteJid;
    if (!db.groups) db.groups = {};
    if (!db.groups[jid]) db.groups[jid] = {};

    let groupMeta, botNumber, isAdmin, isSenderAdmin;
    try {
        groupMeta = await sock.groupMetadata(jid);
        botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        const admins = groupMeta.participants.filter(p => p.admin).map(p => p.id);
        isAdmin = admins.includes(botNumber);
        isSenderAdmin = admins.includes(sender);
    } catch(e) {
        return msg.reply('❌ Gagal ambil info grup: ' + e.message);
    }

    const requireAdmin = (botNeeded = true) => {
        if (!isSenderAdmin) { msg.reply('❌ Hanya admin yang bisa pakai perintah ini!'); return false; }
        if (botNeeded && !isAdmin) { msg.reply('❌ Bot harus jadi admin grup dulu!'); return false; }
        return true;
    };

    // ── GROUP INFO ─────────────────────────────────────────────
    if (command === 'groupinfo') {
        const admins = groupMeta.participants.filter(p => p.admin);
        const members = groupMeta.participants.filter(p => !p.admin);
        const groupSettings = db.groups[jid] || {};
        
        return msg.reply(
            `📊 *INFO GRUP*\n\n` +
            `📌 Nama: *${groupMeta.subject}*\n` +
            `🆔 ID: \`${jid}\`\n` +
            `👥 Total Member: ${groupMeta.participants.length}\n` +
            `👑 Admin: ${admins.length}\n` +
            `👤 Member: ${members.length}\n` +
            `📅 Dibuat: ${new Date(groupMeta.creation * 1000).toLocaleDateString('id-ID')}\n\n` +
            `🛡️ *Pengaturan Bot:*\n` +
            `🔗 Anti Link: ${groupSettings.antilink ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `🚫 Anti Spam: ${groupSettings.antispam ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `🔇 Mute: ${groupSettings.muted ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `👋 Welcome: ${groupSettings.welcome ? '✅ Aktif' : '❌ Nonaktif'}\n` +
            `📜 Rules: ${groupSettings.rules ? '✅ Ada' : '❌ Belum diset'}`
        );
    }

    // ── RULES ─────────────────────────────────────────────────
    if (command === 'rules') {
        const rules = db.groups[jid]?.rules;
        if (!rules) return msg.reply('📜 Belum ada peraturan grup.\n\nAdmin bisa set dengan: `!setrules <peraturan>`');
        return msg.reply(`📜 *PERATURAN GRUP*\n\n${rules}`);
    }

    if (command === 'setrules') {
        if (!requireAdmin(false)) return;
        const rules = args.join(' ');
        if (!rules) return msg.reply('❌ Format: `!setrules <peraturan grup>`\n\nContoh:\n`!setrules 1. Dilarang spam\n2. Hormati sesama member\n3. No SARA`');
        db.groups[jid].rules = rules;
        saveDB(db);
        return msg.reply(`✅ *Peraturan grup berhasil diupdate!*\n\nAnggota bisa lihat dengan: \`!rules\``);
    }

    // ── LIST ADMIN ────────────────────────────────────────────
    if (command === 'listadmin') {
        const admins = groupMeta.participants.filter(p => p.admin);
        const adminList = admins.map((a, i) => {
            const num = a.id.split('@')[0];
            const isSuperAdmin = a.admin === 'superadmin';
            return `${i+1}. ${isSuperAdmin ? '👑' : '⭐'} +${num}`;
        }).join('\n');
        return msg.reply(`👑 *DAFTAR ADMIN GRUP (${admins.length}):*\n\n${adminList}`);
    }

    // ── TAG ALL ────────────────────────────────────────────────
    if (command === 'tagall' || command === 'hidetag') {
        if (!isSenderAdmin) return msg.reply('❌ Hanya admin yang bisa tag semua!');
        const text = args.join(' ') || '📢 Pengumuman!';
        const mentions = groupMeta.participants.map(p => p.id);
        
        if (command === 'tagall') {
            const mentionText = mentions.map(m => `@${m.split('@')[0]}`).join(' ');
            await sock.sendMessage(jid, { text: `📢 *${text}*\n\n${mentionText}`, mentions }, { quoted: msg });
        } else {
            // Hide tag — kirim tanpa visible mention di teks
            await sock.sendMessage(jid, { text: `📢 *${text}*`, mentions }, { quoted: msg });
        }
        return;
    }

    // ── KICK ──────────────────────────────────────────────────
    if (command === 'kick') {
        if (!requireAdmin()) return;
        const quoted = m?.message?.extendedTextMessage?.contextInfo;
        const targetMention = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
                              quoted?.participant;
        if (!targetMention) return msg.reply('❌ Reply/mention member yang mau di-kick!\n\nContoh: mention @member + `!kick`');
        if (targetMention === botNumber) return msg.reply('❌ Tidak bisa kick diri sendiri!');
        const targetAdmin = groupMeta.participants.find(p => p.id === targetMention)?.admin;
        if (targetAdmin) return msg.reply('❌ Tidak bisa kick admin!');
        try {
            await sock.groupParticipantsUpdate(jid, [targetMention], 'remove');
            const num = targetMention.split('@')[0];
            await msg.reply(`✅ Member +${num} berhasil dikeluarkan!`);
        } catch(e) { await msg.reply('❌ Gagal kick: ' + e.message); }
        return;
    }

    // ── ADD ───────────────────────────────────────────────────
    if (command === 'add') {
        if (!requireAdmin()) return;
        let number = args[0]?.replace(/[^0-9]/g, '');
        if (!number) return msg.reply('❌ Format: `!add <nomor>`\nContoh: `!add 628123456789`');
        if (!number.startsWith('62')) number = '62' + (number.startsWith('0') ? number.slice(1) : number);
        const addJid = number + '@s.whatsapp.net';
        try {
            const result = await sock.groupParticipantsUpdate(jid, [addJid], 'add');
            await msg.reply(`✅ Berhasil menambahkan +${number} ke grup!`);
        } catch(e) { await msg.reply('❌ Gagal add: ' + e.message); }
        return;
    }

    // ── PROMOTE / DEMOTE ──────────────────────────────────────
    if (command === 'promote' || command === 'demote') {
        if (!requireAdmin()) return;
        const targetMention = m?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        if (!targetMention) return msg.reply(`❌ Reply/mention member!\nContoh: mention @member + \`!${command}\``);
        const action = command === 'promote' ? 'promote' : 'demote';
        try {
            await sock.groupParticipantsUpdate(jid, [targetMention], action);
            const num = targetMention.split('@')[0];
            await msg.reply(`✅ +${num} berhasil di-${command === 'promote' ? 'jadikan admin' : 'turunkan dari admin'}!`);
        } catch(e) { await msg.reply(`❌ Gagal ${command}: ` + e.message); }
        return;
    }

    // ── ANTI LINK ─────────────────────────────────────────────
    if (command === 'antilink') {
        if (!requireAdmin(false)) return;
        const current = db.groups[jid]?.antilink;
        db.groups[jid].antilink = !current;
        saveDB(db);
        return msg.reply(`🔗 *Anti Link: ${!current ? '✅ AKTIF' : '❌ NONAKTIF'}*\n\n${!current ? 'Pesan berisi link akan dihapus otomatis.' : 'Anggota kembali bisa kirim link.'}`);
    }

    // ── ANTI SPAM ─────────────────────────────────────────────
    if (command === 'antispam') {
        if (!requireAdmin(false)) return;
        const current = db.groups[jid]?.antispam;
        db.groups[jid].antispam = !current;
        saveDB(db);
        return msg.reply(`🚫 *Anti Spam: ${!current ? '✅ AKTIF' : '❌ NONAKTIF'}*\n\n${!current ? 'Member spam akan otomatis di-kick.' : 'Perlindungan anti-spam dimatikan.'}`);
    }

    // ── MUTE / UNMUTE ─────────────────────────────────────────
    if (command === 'mute') {
        if (!requireAdmin()) return;
        db.groups[jid].muted = true;
        saveDB(db);
        await sock.groupSettingUpdate(jid, 'announcement').catch(() => {});
        return msg.reply('🔇 *Grup dimute!* Hanya admin yang bisa mengirim pesan.');
    }

    if (command === 'unmute') {
        if (!requireAdmin()) return;
        db.groups[jid].muted = false;
        saveDB(db);
        await sock.groupSettingUpdate(jid, 'not_announcement').catch(() => {});
        return msg.reply('🔊 *Grup dibuka kembali!* Semua member bisa chat lagi.');
    }

    // ── WELCOME MESSAGE ───────────────────────────────────────
    if (command === 'welcome') {
        if (!requireAdmin(false)) return;
        const welcomeText = args.join(' ');
        if (!welcomeText) {
            const current = db.groups[jid]?.welcomeMsg;
            if (current) return msg.reply(`👋 *Welcome Message Saat Ini:*\n\n${current}\n\n_!welcome off → nonaktifkan_`);
            return msg.reply('👋 *WELCOME MESSAGE*\n\nFormat: `!welcome <pesan>`\nVariabel: {name} = nama member\n\nContoh:\n`!welcome Selamat datang {name}! Baca rules dulu ya 📜`\n\n`!welcome off` → matikan welcome msg');
        }
        if (welcomeText.toLowerCase() === 'off') {
            delete db.groups[jid].welcomeMsg;
            db.groups[jid].welcome = false;
            saveDB(db);
            return msg.reply('✅ Welcome message dimatikan!');
        }
        db.groups[jid].welcomeMsg = welcomeText;
        db.groups[jid].welcome = true;
        saveDB(db);
        return msg.reply(`✅ *Welcome message diset!*\n\nPreview:\n${welcomeText.replace('{name}', 'Nama Member')}`);
    }

    // ── GOODBYE MESSAGE ───────────────────────────────────────
    if (command === 'goodbye') {
        if (!requireAdmin(false)) return;
        const text = args.join(' ');
        if (!text) return msg.reply('👋 *GOODBYE MESSAGE*\n\nFormat: `!goodbye <pesan>`\nVariabel: {name} = nama member\n\nContoh: `!goodbye Selamat tinggal {name}! Sampai jumpa 👋`');
        if (text.toLowerCase() === 'off') {
            delete db.groups[jid].goodbyeMsg;
            saveDB(db);
            return msg.reply('✅ Goodbye message dimatikan!');
        }
        db.groups[jid].goodbyeMsg = text;
        saveDB(db);
        return msg.reply(`✅ *Goodbye message diset!*\n\nPreview:\n${text.replace('{name}', 'Nama Member')}`);
    }

    // ── SET DESC ──────────────────────────────────────────────
    if (command === 'setdesc') {
        if (!requireAdmin()) return;
        const desc = args.join(' ');
        if (!desc) return msg.reply('❌ Format: `!setdesc <deskripsi baru>`');
        try {
            await sock.groupUpdateDescription(jid, desc);
            return msg.reply('✅ Deskripsi grup berhasil diupdate!');
        } catch(e) { return msg.reply('❌ Gagal update deskripsi: ' + e.message); }
    }
};
