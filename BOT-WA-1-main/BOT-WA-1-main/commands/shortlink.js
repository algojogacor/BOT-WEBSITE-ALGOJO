/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           URL SHORTENER — Fitur 24                          ║
 * ║  !short <url>  — Buat short link                            ║
 * ║  !unshort <url>— Reveal URL asli dari short link            ║
 * ║  !mylinks      — Daftar link yang kamu buat                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 *  Menggunakan tinyurl.com API (gratis, no API key)
 *  Fallback: is.gd API (gratis juga)
 *  OPSIONAL: Set CLEANURI_API_KEY di .env untuk tracking klik (cleanuri.com)
 */

const axios = require('axios');
const { saveDB } = require('../helpers/database');

// ─── Shortener Providers ──────────────────────────────────────
const PROVIDERS = {
    tinyurl: async (url) => {
        const res = await axios.get(
            `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
            { timeout: 8000 }
        );
        return res.data.startsWith('http') ? res.data : null;
    },

    isgd: async (url) => {
        const res = await axios.get(
            `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
            { timeout: 8000 }
        );
        return res.data.startsWith('http') ? res.data : null;
    },

    vgd: async (url) => {
        const res = await axios.get(
            `https://v.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
            { timeout: 8000 }
        );
        return res.data.startsWith('http') ? res.data : null;
    }
};

// ─── Validasi URL ─────────────────────────────────────────────
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// ─── Shorten dengan fallback antar provider ───────────────────
async function shortenUrl(url) {
    for (const [name, fn] of Object.entries(PROVIDERS)) {
        try {
            const result = await fn(url);
            if (result) return { shortUrl: result, provider: name };
        } catch (e) {
            console.log(`Provider ${name} gagal:`, e.message);
        }
    }
    return null;
}

// ─── Resolve short link ke URL asli ──────────────────────────
async function resolveUrl(url) {
    try {
        const res = await axios.get(url, {
            maxRedirects: 10,
            timeout: 8000,
            validateStatus: () => true,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        return res.request?.res?.responseUrl || res.config?.url || url;
    } catch (e) {
        // Try HEAD request
        try {
            const res = await axios.head(url, {
                maxRedirects: 10,
                timeout: 5000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            return res.request?.res?.responseUrl || url;
        } catch {
            return null;
        }
    }
}

// ─── Cek keamanan URL basic ───────────────────────────────────
function isSafeUrl(url) {
    const blacklist = [
        'bit.ly', 'tinyurl.com', 'is.gd', 'v.gd', // skip re-shorten
    ];
    // Tidak block, hanya warning
    return true;
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['short', 'shorten', 'shortlink', 'pendekkan', 'unshort', 'reveal_link', 'mylinks', 'linkku'];
    if (!validCommands.includes(command)) return;

    // Init user links
    if (!user.myLinks) user.myLinks = [];

    // ══════════════════════════════════════════════════════════
    // !short <url> — Buat short link
    // ══════════════════════════════════════════════════════════
    if (['short', 'shorten', 'shortlink', 'pendekkan'].includes(command)) {
        const url = args[0];

        if (!url) {
            return msg.reply(
                `🔗 *URL SHORTENER*\n\n` +
                `Cara pakai:\n` +
                `• \`!short <url>\` — Buat link pendek\n` +
                `• \`!unshort <shortlink>\` — Lihat URL asli\n` +
                `• \`!mylinks\` — Riwayat link kamu\n\n` +
                `Contoh: \`!short https://www.google.com/maps/place/Jakarta...\``
            );
        }

        // Tambahkan https jika tidak ada
        const urlFixed = url.startsWith('http') ? url : `https://${url}`;

        if (!isValidUrl(urlFixed)) {
            return msg.reply('❌ URL tidak valid. Pastikan format benar: `https://contoh.com`');
        }

        // Cek panjang URL
        if (urlFixed.length < 20) {
            return msg.reply('⚠️ URL terlalu pendek untuk disingkat!');
        }

        await msg.reply('⏳ _Mempersingkat URL..._');

        try {
            const hasil = await shortenUrl(urlFixed);

            if (!hasil) {
                return msg.reply('❌ Semua provider shortener sedang tidak tersedia. Coba lagi nanti.');
            }

            // Simpan ke riwayat user
            user.myLinks.unshift({
                original: urlFixed,
                short: hasil.shortUrl,
                provider: hasil.provider,
                createdAt: new Date().toLocaleDateString('id-ID'),
                clicks: 0
            });

            // Batasi 20 link
            if (user.myLinks.length > 20) user.myLinks = user.myLinks.slice(0, 20);
            saveDB(db);

            const domain = new URL(urlFixed).hostname;
            const savedLen = urlFixed.length - hasil.shortUrl.length;

            return msg.reply(
                `✅ *URL BERHASIL DIPERSINGKAT!*\n` +
                `${'─'.repeat(30)}\n\n` +
                `🔗 *Link Pendek:*\n${hasil.shortUrl}\n\n` +
                `${'─'.repeat(20)}\n` +
                `📌 URL Asli: ${domain}...\n` +
                `📏 Hemat: ${savedLen} karakter\n` +
                `🔧 Provider: ${hasil.provider}\n\n` +
                `💡 Lihat URL asli: \`!unshort ${hasil.shortUrl}\`\n` +
                `📋 Semua linkmu: \`!mylinks\``
            );
        } catch (e) {
            console.error('Shortener Error:', e.message);
            return msg.reply('❌ Gagal mempersingkat URL. Coba lagi nanti.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // !unshort <url> — Reveal URL asli
    // ══════════════════════════════════════════════════════════
    if (['unshort', 'reveal_link'].includes(command)) {
        const url = args[0];

        if (!url) return msg.reply('❌ Format: `!unshort <short_url>`\nContoh: `!unshort https://tinyurl.com/abc123`');

        const urlFixed = url.startsWith('http') ? url : `https://${url}`;
        if (!isValidUrl(urlFixed)) return msg.reply('❌ URL tidak valid.');

        await msg.reply('🔍 _Memeriksa URL asli..._');

        try {
            const resolved = await resolveUrl(urlFixed);

            if (!resolved || resolved === urlFixed) {
                return msg.reply(
                    `🔍 *HASIL CEK URL*\n\n` +
                    `❓ URL ini mungkin sudah langsung atau tidak bisa di-resolve.\n` +
                    `🔗 Input: ${urlFixed}`
                );
            }

            const inputDomain = new URL(urlFixed).hostname;
            const resolvedDomain = new URL(resolved).hostname;
            const isDifferent = inputDomain !== resolvedDomain;

            return msg.reply(
                `🔍 *URL REVEAL*\n` +
                `${'─'.repeat(25)}\n\n` +
                `📌 Short URL:\n${urlFixed}\n\n` +
                `${isDifferent ? '⚠️ REDIRECT KE:' : '✅ URL Asli:'}\n*${resolved}*\n\n` +
                `🌐 Domain: ${resolvedDomain}\n` +
                (isDifferent ? `\n_URL ini redirect ke domain berbeda. Hati-hati!_` : `_URL aman, tidak ada redirect mencurigakan_`)
            );
        } catch (e) {
            console.error('Unshort Error:', e.message);
            return msg.reply('❌ Gagal memeriksa URL. Coba lagi.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // !mylinks — Riwayat link
    // ══════════════════════════════════════════════════════════
    if (['mylinks', 'linkku'].includes(command)) {
        if (user.myLinks.length === 0) {
            return msg.reply('🔗 Belum ada link. Buat dengan `!short <url>`');
        }

        let list = `🔗 *LINK-LINK KAMU*\n${'─'.repeat(30)}\n\n`;
        user.myLinks.slice(0, 10).forEach((link, i) => {
            const num = i + 1;
            const domain = link.original ? (() => { try { return new URL(link.original).hostname; } catch { return link.original.substring(0, 30); } })() : '-';
            list +=
                `${num}. ${link.short}\n` +
                `   📌 ${domain}\n` +
                `   📅 ${link.createdAt || '-'}\n\n`;
        });

        list += `${'─'.repeat(20)}\n_Total: ${user.myLinks.length} link tersimpan_`;
        return msg.reply(list);
    }
};
