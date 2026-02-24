/**
 * AI TOOLS v2.0 — summarize, translate, ocr, codereview, improve, sentiment, explain, keywords, fakta
 */
require('dotenv').config();
const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const OpenAI = require('openai');

const API_KEY = process.env.OPENROUTER_API_KEY;
const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: API_KEY,
    defaultHeaders: { "HTTP-Referer": "https://wa-bot.com", "X-Title": "Arya Bot AI Tools" }
});

const SL = { level:'silent', info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{}, child:function(){return this;} };

async function tanyaAI(userMsg, sysMsg = '') {
    const msgs = [];
    if (sysMsg) msgs.push({ role:'system', content:sysMsg });
    msgs.push({ role:'user', content:userMsg });
    const res = await client.chat.completions.create({ model:'google/gemini-2.5-flash', messages:msgs, max_tokens:2000 });
    return res.choices[0]?.message?.content || 'Tidak ada respons.';
}

async function tanyaAIGambar(base64, mime, prompt) {
    const res = await client.chat.completions.create({
        model:'google/gemini-2.5-flash',
        messages:[{role:'user', content:[
            {type:'image_url', image_url:{url:`data:${mime};base64,${base64}`}},
            {type:'text', text:prompt}
        ]}],
        max_tokens:2000
    });
    return res.choices[0]?.message?.content || 'Tidak ada respons.';
}

async function fetchWeb(url) {
    try {
        const res = await axios.get(url, { timeout:10000, headers:{'User-Agent':'Mozilla/5.0'} });
        return res.data.replace(/<script[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<style[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().substring(0,5000);
    } catch { return null; }
}

async function getImage(m) {
    const mt = Object.keys(m?.message||{})[0];
    const q = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!mt && !q?.imageMessage) return null;
    if (q?.imageMessage) return downloadMediaMessage({key:m.message.extendedTextMessage.contextInfo.stanzaId, message:q},'buffer',{},{logger:SL});
    if (mt==='imageMessage') return downloadMediaMessage(m,'buffer',{},{logger:SL});
    return null;
}

function getQuotedText(m) {
    return m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation ||
           m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text || null;
}

module.exports = async (command, args, msg, user, db, sock, m) => {
    const valid = ['summarize','ringkas','translate','terjemah','ocr','baca','codereview','review','improve','perbaiki','sentiment','analisis','explain','jelaskan','keywords','katakunci','fakta','grammar'];
    if (!valid.includes(command)) return;

    const text = args.join(' ');
    const target = m || msg;

    // ── SUMMARIZE ──────────────────────────────────────────────
    if (command==='summarize'||command==='ringkas') {
        let content = text || getQuotedText(target);
        if (!content) return msg.reply('📄 *SUMMARIZE*\n\nFormat: `!summarize <link/teks>` atau reply teks + `!summarize`');
        await msg.react('📄'); await msg.reply('📄 *Sedang meringkas...*');
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) { const web = await fetchWeb(urlMatch[0]); if (web) content = `Artikel dari ${urlMatch[0]}:\n${web}`; }
        try {
            const r = await tanyaAI(`Ringkas ini dalam bahasa Indonesia dengan poin-poin penting:\n${content}`, 'Kamu ahli meringkas teks. Buat ringkasan akurat, padat, mudah dipahami. Format: poin-poin bullet + kesimpulan.');
            await msg.reply(`📄 *RINGKASAN:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── TRANSLATE ──────────────────────────────────────────────
    else if (command==='translate'||command==='terjemah') {
        const langs = {en:'English',english:'English',inggris:'English',id:'Indonesia',indonesia:'Indonesia',ar:'Arab',arabic:'Arab',jp:'Jepang',japanese:'Jepang',zh:'Mandarin',chinese:'Mandarin',ko:'Korea',korean:'Korea',fr:'Prancis',french:'Prancis',de:'Jerman',german:'Jerman',es:'Spanyol',spanish:'Spanyol',jv:'Jawa',su:'Sunda'};
        const fw = args[0]?.toLowerCase();
        let targetLang = 'Indonesia', textToTrans = text;
        if (fw && langs[fw]) { targetLang = langs[fw]; textToTrans = args.slice(1).join(' '); }
        if (!textToTrans) textToTrans = getQuotedText(target);
        if (!textToTrans) return msg.reply('🌍 *TRANSLATE*\n\nFormat:\n`!translate <teks>` (ke Indo)\n`!translate english <teks>`\n\nBahasa: english, indonesia, arab, jepang, mandarin, korea, prancis, jerman, spanyol, jawa, sunda');
        await msg.react('🌍');
        try {
            const r = await tanyaAI(`Terjemahkan ke ${targetLang}, balas hasil terjemahan saja:\n${textToTrans}`, 'Kamu penerjemah profesional. Hanya output terjemahan, tanpa penjelasan.');
            await msg.reply(`🌍 *TERJEMAHAN → ${targetLang}:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── OCR ────────────────────────────────────────────────────
    else if (command==='ocr'||command==='baca') {
        const buf = await getImage(target);
        if (!buf) return msg.reply('📝 *OCR*\n\nKirim/reply gambar + `!ocr`\n\nBisa baca: teks, struk, dokumen, papan nama, dll.');
        await msg.react('📝'); await msg.reply('📝 *Membaca teks dari gambar...*');
        try {
            const r = await tanyaAIGambar(buf.toString('base64'),'image/jpeg','Baca dan ekstrak SEMUA teks di gambar ini dengan akurat. Pertahankan format asli. Jika tidak ada teks, katakan "Tidak ada teks terdeteksi." Output teks saja tanpa penjelasan.');
            await msg.reply(`📝 *Teks Terdeteksi:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal OCR: '+e.message); await msg.react('❌'); }
    }

    // ── CODE REVIEW ────────────────────────────────────────────
    else if (command==='codereview'||command==='review') {
        const code = text || getQuotedText(target);
        if (!code) return msg.reply('💻 *CODE REVIEW*\n\nFormat: `!codereview <kode>` atau reply kode + `!review`\n\nTemukan bug, optimasi, security issues, dan best practices.');
        await msg.react('💻'); await msg.reply('💻 *Me-review kode...*');
        try {
            const r = await tanyaAI(code, 'Kamu senior engineer. Review kode ini:\n1. 🐛 Bug/Error\n2. ⚡ Optimasi performa\n3. 🔐 Security issues\n4. 📝 Clean code & best practices\n5. ✅ Versi diperbaiki jika perlu\nFormat dengan emoji, bahasa Indonesia.');
            await msg.reply(`💻 *CODE REVIEW:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── IMPROVE TEXT ───────────────────────────────────────────
    else if (command==='improve'||command==='perbaiki') {
        const t = text || getQuotedText(target);
        if (!t) return msg.reply('✍️ *IMPROVE TEXT*\n\nFormat: `!improve <teks>` atau reply teks + `!improve`\n\nPerbaiki grammar, gaya, keterbacaan tulisan.');
        await msg.react('✍️'); await msg.reply('✍️ *Memperbaiki tulisan...*');
        try {
            const r = await tanyaAI(`Perbaiki tulisan ini:\n\n${t}`, 'Kamu editor profesional. Koreksi grammar/ejaan, tingkatkan kejelasan dan kualitas, pertahankan makna asli. Tampilkan versi perbaikan dulu, lalu penjelasan singkat perubahan.');
            await msg.reply(`✍️ *HASIL IMPROVE:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── GRAMMAR CHECK ──────────────────────────────────────────
    else if (command==='grammar') {
        const t = text || getQuotedText(target);
        if (!t) return msg.reply('📖 *GRAMMAR CHECK*\n\nFormat: `!grammar <kalimat>` atau reply teks + `!grammar`');
        await msg.react('📖');
        try {
            const r = await tanyaAI(`Cek grammar kalimat ini:\n${t}`, 'Kamu grammar checker. Berikan:\n✅/❌ Status grammar\nKesalahan yang ditemukan (jika ada)\nVersi yang benar\nPenjelasan singkat aturan grammar. Bahasa Indonesia.');
            await msg.reply(`📖 *GRAMMAR CHECK:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── SENTIMENT ──────────────────────────────────────────────
    else if (command==='sentiment'||command==='analisis') {
        const t = text || getQuotedText(target);
        if (!t) return msg.reply('😊 *ANALISIS SENTIMEN*\n\nFormat: `!sentiment <teks>` atau reply teks + `!sentiment`');
        await msg.react('🔍');
        try {
            const r = await tanyaAI(`Analisis sentimen: "${t}"`, 'Kamu ahli NLP. Berikan:\n😊 Sentimen: Positif/Negatif/Netral/Mixed\n💯 Keyakinan: %\n🎭 Emosi dominan\n🌡️ Intensitas\n📝 Tone\n💡 Penjelasan singkat\nFormat rapi, bahasa Indonesia.');
            await msg.reply(`🔍 *ANALISIS SENTIMEN:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── EXPLAIN ────────────────────────────────────────────────
    else if (command==='explain'||command==='jelaskan') {
        if (!text) return msg.reply('💡 *EXPLAIN*\n\nFormat: `!explain <topik>`\nContoh: `!explain quantum computing`');
        await msg.react('💡');
        try {
            const r = await tanyaAI(`Jelaskan "${text}" dengan cara mudah dipahami.`, 'Kamu guru yang ahli menjelaskan hal kompleks dengan sederhana. Gunakan analogi kehidupan sehari-hari. Format: 🎯 Apa itu? 🔍 Cara kerjanya? 📌 Contoh nyata? 💡 Fakta menarik? Bahasa santai, pakai emoji.');
            await msg.reply(`💡 *PENJELASAN: ${text.toUpperCase()}*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── KEYWORDS ───────────────────────────────────────────────
    else if (command==='keywords'||command==='katakunci') {
        let content = text || getQuotedText(target);
        const urlMatch = content?.match(/https?:\/\/[^\s]+/);
        if (urlMatch) { await msg.reply('🔑 Mengambil konten dari link...'); const web = await fetchWeb(urlMatch[0]); if (web) content = web; }
        if (!content) return msg.reply('🔑 *KEYWORDS*\n\nFormat: `!keywords <teks/link>`');
        await msg.react('🔑');
        try {
            const r = await tanyaAI(`Ekstrak kata kunci dari:\n${content}`, 'Kamu ahli SEO. Berikan:\n🔑 Kata Kunci Utama (5-10)\n📌 Topik Utama\n🏷️ Tags Relevan (10-15)\n📊 Kategori Konten\nBahasa Indonesia, format rapi.');
            await msg.reply(`🔑 *KATA KUNCI:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }

    // ── FACT CHECK ─────────────────────────────────────────────
    else if (command==='fakta') {
        if (!text) return msg.reply('🔎 *FACT CHECK*\n\nFormat: `!fakta <pernyataan>`\nContoh: `!fakta Bumi berbentuk datar`');
        await msg.react('🔎'); await msg.reply('🔎 *Memverifikasi fakta...*');
        try {
            const r = await tanyaAI(`Cek fakta: "${text}"`, 'Kamu fact-checker profesional. Berikan:\n✅/❌/⚠️ Status: Fakta/Hoaks/Sebagian Benar/Perlu Konteks\n📊 Keyakinan: %\n🔍 Penjelasan detail\n📚 Dasar ilmiah\n⚠️ Nuansa penting\nObjektif, berbasis bukti, bahasa Indonesia. Akhiri: "Verifikasi ke sumber terpercaya untuk keputusan penting."');
            await msg.reply(`🔎 *FACT CHECK:*\n\n${r}`); await msg.react('✅');
        } catch(e) { await msg.reply('❌ Gagal: '+e.message); await msg.react('❌'); }
    }
};
