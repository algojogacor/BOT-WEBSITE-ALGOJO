/**
 * UTILITAS SUPER v1.0
 * !qr — Generate QR code dari teks/link
 * !link — Shorten URL
 * !password — Generate password aman
 * !uuid — Generate UUID
 * !base64 — Encode/decode base64
 * !md5 — Hash MD5 string
 * !ip — Info IP address
 * !whois — Whois domain
 * !ping — Ping URL/domain
 * !waktu — Waktu berbagai kota dunia
 * !countdown — Countdown ke tanggal
 */
const axios = require('axios');
const crypto = require('crypto');

module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['qr','qrcode','password','passgen','uuid','base64','encode','decode','md5','hash','ip','ipinfo','ping','waktu','time','timezone','countdown','timer'];
    if (!valid.includes(command)) return;

    const text = args.join(' ');
    const jid = msg.key?.remoteJid || msg.from;

    // ── QR CODE ────────────────────────────────────────────────
    if (command === 'qr' || command === 'qrcode') {
        if (!text) return msg.reply('📲 *QR CODE GENERATOR*\n\nFormat: `!qr <teks/link>`\nContoh: `!qr https://wa.me/6281234567890`\n\nBisa buat QR untuk: link, teks, nomor WA, alamat, dll.');
        const encoded = encodeURIComponent(text);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encoded}&bgcolor=FFFFFF&color=000000&ecc=M`;
        try {
            await sock.sendMessage(jid, {
                image: { url: qrUrl },
                caption: `📲 *QR Code Generated!*\n\nIsi: _${text.substring(0, 100)}${text.length > 100 ? '...' : ''}_`
            }, { quoted: msg });
        } catch(e) { await msg.reply('❌ Gagal generate QR: ' + e.message); }
        return;
    }

    // ── PASSWORD GENERATOR ─────────────────────────────────────
    if (command === 'password' || command === 'passgen') {
        const length = parseInt(args[0]) || 16;
        const type = args[1]?.toLowerCase();

        if (length < 4 || length > 100) return msg.reply('❌ Panjang password harus antara 4-100 karakter.');

        const chars = {
            simple: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
            strong: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+[]{}|;:,.<>?',
            pin: '0123456789',
            memorable: 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
        };

        const charset = chars[type] || chars.strong;
        let password = '';
        const randomBytes = crypto.randomBytes(length);
        for (let i = 0; i < length; i++) {
            password += charset[randomBytes[i] % charset.length];
        }

        // Calculate entropy
        const entropy = Math.log2(Math.pow(charset.length, length));
        const strength = entropy < 40 ? '🔴 Lemah' : entropy < 60 ? '🟡 Sedang' : entropy < 80 ? '🟢 Kuat' : '💪 Sangat Kuat';

        return msg.reply(
            `🔑 *PASSWORD GENERATOR*\n\n` +
            `🔐 Password:\n\`${password}\`\n\n` +
            `📏 Panjang: ${length} karakter\n` +
            `💪 Kekuatan: ${strength}\n` +
            `🎲 Entropy: ${entropy.toFixed(0)} bits\n\n` +
            `*Type lain:*\n` +
            `• \`!password 12 simple\` — huruf+angka\n` +
            `• \`!password 6 pin\` — angka saja\n` +
            `• \`!password 16 strong\` — semua karakter\n\n` +
            `⚠️ _Jangan share password ke siapapun!_`
        );
    }

    // ── UUID GENERATOR ─────────────────────────────────────────
    if (command === 'uuid') {
        const count = Math.min(parseInt(args[0]) || 1, 10);
        const uuids = [];
        for (let i = 0; i < count; i++) {
            uuids.push(crypto.randomUUID ? crypto.randomUUID() : 
                ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c => (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)));
        }
        return msg.reply(`🆔 *UUID Generated (${count}):*\n\n${uuids.map((u,i) => `${i+1}. \`${u}\``).join('\n')}`);
    }

    // ── BASE64 ─────────────────────────────────────────────────
    if (command === 'base64' || command === 'encode' || command === 'decode') {
        if (!text) return msg.reply('🔤 *BASE64*\n\nFormat:\n`!base64 encode <teks>`\n`!base64 decode <base64>`\n\nAtau:\n`!encode <teks>` / `!decode <base64>`');
        
        const isDecodeMode = command === 'decode' || args[0]?.toLowerCase() === 'decode';
        const isEncodeMode = command === 'encode' || args[0]?.toLowerCase() === 'encode';
        const inputText = (isDecodeMode || isEncodeMode) ? args.slice(1).join(' ') : text;
        
        if (!inputText) return msg.reply('❌ Masukkan teks yang mau di-encode/decode!');

        try {
            if (isDecodeMode) {
                const decoded = Buffer.from(inputText, 'base64').toString('utf8');
                return msg.reply(`🔓 *BASE64 DECODE:*\n\nInput:\n\`${inputText.substring(0, 100)}\`\n\nHasil:\n\`${decoded}\``);
            } else {
                const encoded = Buffer.from(inputText).toString('base64');
                return msg.reply(`🔒 *BASE64 ENCODE:*\n\nInput:\n\`${inputText}\`\n\nHasil:\n\`${encoded}\``);
            }
        } catch(e) { return msg.reply('❌ Gagal: ' + e.message); }
    }

    // ── MD5 HASH ───────────────────────────────────────────────
    if (command === 'md5' || command === 'hash') {
        if (!text) return msg.reply('🔑 *HASH GENERATOR*\n\nFormat: `!md5 <teks>`\n\nGenerate MD5, SHA1, SHA256, SHA512 dari teks.');
        const md5 = crypto.createHash('md5').update(text).digest('hex');
        const sha1 = crypto.createHash('sha1').update(text).digest('hex');
        const sha256 = crypto.createHash('sha256').update(text).digest('hex');
        return msg.reply(
            `🔑 *HASH RESULT:*\n\nInput: \`${text}\`\n\n` +
            `MD5: \`${md5}\`\n` +
            `SHA1: \`${sha1}\`\n` +
            `SHA256: \`${sha256}\``
        );
    }

    // ── IP INFO ────────────────────────────────────────────────
    if (command === 'ip' || command === 'ipinfo') {
        const ipOrDomain = args[0] || '';
        await msg.react('🌐');
        try {
            const url = ipOrDomain ? `https://ipinfo.io/${ipOrDomain}/json` : 'https://ipinfo.io/json';
            const res = await axios.get(url, { timeout: 8000 });
            const d = res.data;
            return msg.reply(
                `🌐 *IP INFO*\n\n` +
                `📍 IP: ${d.ip}\n` +
                `🏙️ Kota: ${d.city || '-'}\n` +
                `🗺️ Region: ${d.region || '-'}\n` +
                `🌍 Negara: ${d.country || '-'}\n` +
                `📮 Postal: ${d.postal || '-'}\n` +
                `📡 ISP/Org: ${d.org || '-'}\n` +
                `🕐 Timezone: ${d.timezone || '-'}\n` +
                `📌 Koordinat: ${d.loc || '-'}`
            );
        } catch { return msg.reply('❌ Gagal ambil info IP.'); }
    }

    // ── PING ──────────────────────────────────────────────────
    if (command === 'ping') {
        const url = args[0];
        if (!url) return msg.reply('🏓 *PING*\n\nFormat: `!ping <url/domain>`\nContoh: `!ping google.com`');
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        await msg.react('🏓');
        try {
            const start = Date.now();
            const res = await axios.get(targetUrl, { timeout: 10000 });
            const ms = Date.now() - start;
            const status = res.status;
            const emoji = ms < 200 ? '🟢' : ms < 500 ? '🟡' : '🔴';
            return msg.reply(`🏓 *PING RESULT*\n\n🌐 URL: ${targetUrl}\n✅ Status: ${status} OK\n${emoji} Respon: ${ms}ms\n\n${ms < 200 ? '⚡ Sangat cepat!' : ms < 500 ? '✅ Normal' : '⚠️ Lambat'}`);
        } catch(e) {
            return msg.reply(`🏓 *PING RESULT*\n\n🌐 URL: ${targetUrl}\n❌ Gagal/Offline\nError: ${e.message.substring(0, 100)}`);
        }
    }

    // ── WAKTU DUNIA ────────────────────────────────────────────
    if (command === 'waktu' || command === 'time' || command === 'timezone') {
        const cities = {
            'Jakarta':      'Asia/Jakarta',
            'Singapore':    'Asia/Singapore',
            'Kuala Lumpur': 'Asia/Kuala_Lumpur',
            'Tokyo':        'Asia/Tokyo',
            'Beijing':      'Asia/Shanghai',
            'Dubai':        'Asia/Dubai',
            'London':       'Europe/London',
            'Paris':        'Europe/Paris',
            'New York':     'America/New_York',
            'Los Angeles':  'America/Los_Angeles',
            'Sydney':       'Australia/Sydney',
            'Mecca':        'Asia/Riyadh',
        };

        const now = new Date();
        let reply = `🕐 *WAKTU SEKARANG DI BERBAGAI KOTA*\n\n`;
        
        for (const [city, tz] of Object.entries(cities)) {
            const timeStr = now.toLocaleString('id-ID', {
                timeZone: tz,
                hour: '2-digit', minute: '2-digit',
                weekday: 'short',
                hour12: false
            });
            reply += `🌍 ${city}: *${timeStr}*\n`;
        }
        
        return msg.reply(reply);
    }

    // ── COUNTDOWN ─────────────────────────────────────────────
    if (command === 'countdown' || command === 'timer') {
        // Format: !countdown 25/12/2025 atau !countdown 2025-12-25
        const dateStr = args.join(' ');
        if (!dateStr) return msg.reply('⏳ *COUNTDOWN*\n\nFormat:\n`!countdown 25/12/2025` (DD/MM/YYYY)\n`!countdown 2025-12-25` (YYYY-MM-DD)\n\nContoh: `!countdown 17/08/2026` — HUT RI');

        let targetDate;
        const ddmm = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        const yyyymm = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        
        if (ddmm) targetDate = new Date(parseInt(ddmm[3]), parseInt(ddmm[2])-1, parseInt(ddmm[1]));
        else if (yyyymm) targetDate = new Date(parseInt(yyyymm[1]), parseInt(yyyymm[2])-1, parseInt(yyyymm[3]));
        else return msg.reply('❌ Format tanggal tidak valid!\n\nGunakan: DD/MM/YYYY atau YYYY-MM-DD');

        const now = new Date();
        const diff = targetDate - now;

        if (diff < 0) return msg.reply(`❌ Tanggal ${dateStr} sudah lewat! Masukkan tanggal yang akan datang.`);

        const hari = Math.floor(diff / 86400000);
        const jam = Math.floor((diff % 86400000) / 3600000);
        const menit = Math.floor((diff % 3600000) / 60000);
        const detik = Math.floor((diff % 60000) / 1000);

        return msg.reply(
            `⏳ *COUNTDOWN*\n\n` +
            `📅 Target: *${targetDate.toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}*\n\n` +
            `⏱️ Sisa waktu:\n` +
            `📆 ${hari} hari\n` +
            `🕐 ${jam} jam\n` +
            `⏱️ ${menit} menit\n` +
            `⏰ ${detik} detik\n\n` +
            `_Dihitung dari sekarang: ${now.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`
        );
    }
};
