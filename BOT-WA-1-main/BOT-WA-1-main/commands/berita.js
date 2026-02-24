/**
 * BERITA & INFO TERKINI v1.0
 * !berita — Berita terkini Indonesia
 * !cuaca — Cuaca kota (wrapper prakiraan.js)  
 * !kurs — Kurs mata uang terkini
 * !saham — Info harga saham
 */
const axios = require('axios');

// RSS Parser sederhana tanpa dependency tambahan
async function fetchRSS(url) {
    const res = await axios.get(url, { timeout: 10000, headers: { 'User-Agent': 'Mozilla/5.0' } });
    const xml = res.data;
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
        const item = match[1];
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || '';
        const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>|<description>(.*?)<\/description>/)?.[1] || '';
        const cleanDesc = desc.replace(/<[^>]+>/g, '').trim().substring(0, 150);
        if (title) items.push({ title: title.replace(/<!\[CDATA\[|\]\]>/g,'').trim(), link: link.trim(), desc: cleanDesc });
    }
    return items;
}

// Kurs dari public API (BI/ExchangeRate)
async function getKurs(base = 'USD') {
    const res = await axios.get(`https://open.er-api.com/v6/latest/${base}`, { timeout: 8000 });
    return res.data.rates;
}

module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['berita','news','kurs','valas','dollar','btc','bitcoin'];
    if (!valid.includes(command)) return;

    const text = args.join(' ');

    // ── BERITA ─────────────────────────────────────────────────
    if (command === 'berita' || command === 'news') {
        const kategori = args[0]?.toLowerCase();
        const feeds = {
            default:  'https://www.cnnindonesia.com/rss',
            teknologi: 'https://tekno.kompas.com/rss',
            ekonomi:  'https://money.kompas.com/rss',
            olahraga: 'https://bola.kompas.com/rss',
            hiburan:  'https://entertainment.kompas.com/rss',
            sains:    'https://sains.kompas.com/rss',
        };

        if (!kategori || !feeds[kategori]) {
            if (kategori && !feeds[kategori]) await msg.reply(`⚠️ Kategori "${kategori}" tidak ada. Pakai kategori default.`);
            else return msg.reply(
                `📰 *BERITA TERKINI*\n\n` +
                `Format: \`!berita [kategori]\`\n\n` +
                `*Kategori tersedia:*\n` +
                `📱 \`!berita\` — Berita umum\n` +
                `💻 \`!berita teknologi\`\n` +
                `💰 \`!berita ekonomi\`\n` +
                `⚽ \`!berita olahraga\`\n` +
                `🎬 \`!berita hiburan\`\n` +
                `🔬 \`!berita sains\``
            );
        }

        await msg.react('📰');
        await msg.reply('📰 *Mengambil berita terkini...*');
        
        try {
            const feedUrl = feeds[kategori] || feeds.default;
            const items = await fetchRSS(feedUrl);
            
            if (!items.length) return msg.reply('❌ Gagal mengambil berita. Coba lagi nanti.');
            
            const kat = kategori === 'default' ? 'Umum' : kategori.charAt(0).toUpperCase() + kategori.slice(1);
            let reply = `📰 *BERITA TERKINI — ${kat.toUpperCase()}*\n\n`;
            
            items.forEach((item, i) => {
                reply += `${i+1}. *${item.title}*\n`;
                if (item.desc) reply += `   ${item.desc}...\n`;
                if (item.link) reply += `   🔗 ${item.link}\n`;
                reply += '\n';
            });
            
            reply += `_Update: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`;
            await msg.reply(reply);
            await msg.react('✅');
        } catch(e) {
            await msg.reply('❌ Gagal ambil berita: ' + e.message);
            await msg.react('❌');
        }
    }

    // ── KURS MATA UANG ─────────────────────────────────────────
    if (command === 'kurs' || command === 'valas') {
        await msg.react('💱');
        await msg.reply('💱 *Mengambil kurs terkini...*');
        
        try {
            const rates = await getKurs('USD');
            const idr = rates.IDR;
            const selected = {
                'USD 🇺🇸': 1,
                'EUR 🇪🇺': rates.EUR,
                'SGD 🇸🇬': rates.SGD,
                'MYR 🇲🇾': rates.MYR,
                'JPY 🇯🇵': rates.JPY,
                'GBP 🇬🇧': rates.GBP,
                'CNY 🇨🇳': rates.CNY,
                'SAR 🇸🇦': rates.SAR,
                'AUD 🇦🇺': rates.AUD,
            };

            let reply = `💱 *KURS MATA UANG vs IDR*\n`;
            reply += `_Update: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_\n\n`;

            for (const [curr, rate] of Object.entries(selected)) {
                const rateToIDR = Math.round(idr / rate);
                reply += `${curr}: *Rp ${rateToIDR.toLocaleString('id-ID')}*\n`;
            }

            reply += `\n_Sumber: Open Exchange Rates_`;
            await msg.reply(reply);
            await msg.react('✅');
        } catch(e) {
            await msg.reply('❌ Gagal ambil kurs: ' + e.message);
            await msg.react('❌');
        }
    }

    // ── DOLLAR (Quick check USD/IDR) ───────────────────────────
    if (command === 'dollar') {
        try {
            const rates = await getKurs('USD');
            const idr = rates.IDR;
            return msg.reply(`💵 *Kurs Dollar Terkini*\n\n1 USD = *Rp ${Math.round(idr).toLocaleString('id-ID')}*\n\n_Update: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`);
        } catch { return msg.reply('❌ Gagal ambil kurs dollar.'); }
    }

    // ── BITCOIN ────────────────────────────────────────────────
    if (command === 'btc' || command === 'bitcoin') {
        try {
            const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd,idr', { timeout: 8000 });
            const d = res.data;
            let reply = `₿ *HARGA CRYPTO TERKINI*\n\n`;
            if (d.bitcoin) reply += `🟡 Bitcoin (BTC): $${d.bitcoin.usd?.toLocaleString()} | Rp ${d.bitcoin.idr?.toLocaleString('id-ID')}\n`;
            if (d.ethereum) reply += `🔵 Ethereum (ETH): $${d.ethereum.usd?.toLocaleString()} | Rp ${d.ethereum.idr?.toLocaleString('id-ID')}\n`;
            if (d.binancecoin) reply += `🟠 BNB: $${d.binancecoin.usd?.toLocaleString()} | Rp ${d.binancecoin.idr?.toLocaleString('id-ID')}\n`;
            if (d.solana) reply += `🟣 Solana (SOL): $${d.solana.usd?.toLocaleString()} | Rp ${d.solana.idr?.toLocaleString('id-ID')}\n`;
            reply += `\n_Update: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`;
            return msg.reply(reply);
        } catch { return msg.reply('❌ Gagal ambil harga crypto.'); }
    }
};
