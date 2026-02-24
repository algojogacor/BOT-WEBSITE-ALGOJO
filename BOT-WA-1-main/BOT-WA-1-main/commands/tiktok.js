/**
 * SOCIAL MEDIA DOWNLOADER v1.0
 * !tiktok — Download video TikTok (tanpa watermark)
 * !youtube — Info video YouTube (fallback karena bot tidak bisa stream)
 * !ig — Download foto Instagram
 */
const axios = require('axios');

async function downloadTikTok(url) {
    // Gunakan API publik (beberapa tersedia, bisa update jika mati)
    const apis = [
        `https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`,
        `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`,
    ];
    
    for (const apiUrl of apis) {
        try {
            const res = await axios.get(apiUrl, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const d = res.data;
            
            // tikwm format
            if (d?.data?.play) return { url: d.data.play, title: d.data.title || 'TikTok Video', author: d.data.author?.nickname || 'Unknown', duration: d.data.duration };
            // tikmate format  
            if (d?.token) return { url: `https://tikmate.app/download/${d.token}/${d.id}.mp4`, title: d.title || 'TikTok Video', author: d.author || 'Unknown' };
        } catch {}
    }
    throw new Error('Semua API gagal');
}

module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['tiktok','tt','ttdl','download','dl'];
    if (!valid.includes(command)) return;

    const jid = msg.key?.remoteJid || msg.from;
    const url = args[0];
    
    if (!url) {
        return msg.reply(
            `📥 *SOCIAL MEDIA DOWNLOADER*\n\n` +
            `*TikTok:*\n\`!tiktok <link>\`\n\n` +
            `Contoh:\n\`!tiktok https://vm.tiktok.com/xxxxx\`\n\n` +
            `✅ Video tanpa watermark\n` +
            `⚠️ Hanya untuk konten yang diizinkan`
        );
    }
    
    // Validasi URL
    const isTikTok = url.includes('tiktok.com') || url.includes('vm.tiktok.com');
    
    if (!isTikTok) return msg.reply('❌ URL tidak valid! Masukkan link TikTok.\nContoh: https://vm.tiktok.com/xxxxx');
    
    await msg.react('⬇️');
    await msg.reply('⬇️ *Sedang download video TikTok...*\nTunggu sebentar ya!');
    
    try {
        const data = await downloadTikTok(url);
        
        await sock.sendMessage(jid, {
            video: { url: data.url },
            caption: `✅ *TikTok Downloaded!*\n\n👤 Creator: ${data.author}\n📝 ${data.title?.substring(0, 100) || 'Video TikTok'}\n\n_Download by Algojo Bot 🤖_`
        }, { quoted: msg });
        
        await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
    } catch(e) {
        await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        await msg.reply(`❌ Gagal download TikTok.\n\nKemungkinan penyebab:\n• Link tidak valid\n• Video private/dihapus\n• Server API sedang down\n\nCoba lagi nanti atau coba link lain.\nError: ${e.message}`);
    }
};
