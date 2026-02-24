require('dotenv').config();
const OpenAI = require('openai');
const axios = require('axios');
const { saveDB } = require('../helpers/database');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// --- KONFIGURASI ---
const API_KEY = process.env.OPENROUTER_API_KEY;
const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: API_KEY,
    defaultHeaders: { "HTTP-Referer": "https://wa-bot.com", "X-Title": "Arya Bot Multi-Model" }
});

// ══════════════════════════════════════════════════════════════
// PERSONA SYSTEM
// ══════════════════════════════════════════════════════════════
const PERSONAS = {
    default:   { name: "🤖 Algojo AI",     prompt: `Kamu adalah Algojo, asisten AI WhatsApp yang cerdas, santai, dan helpful. Berbicara dalam bahasa Indonesia seperti Gen-Z. Jawaban singkat dan padat, pakai emoji yang tepat.` },
    english:   { name: "🎓 English Coach", prompt: `You are a professional English instructor with Gen-Z awareness. Give direct, structured feedback. Correct mistakes immediately with explanations. Keep it chill but educational.` },
    coder:     { name: "💻 Code Master",   prompt: `You are an expert senior software engineer. Debug, explain, and write clean code in any language. Format code with backticks. Be precise and complete. Explain the "why" behind solutions.` },
    motivator: { name: "🔥 Life Coach",    prompt: `Kamu adalah life coach energetik dan empatik. Bantu orang overcome challenges dan stay motivated. Bicara dengan penuh semangat, hangat, dan genuine. Mix Indonesia-English oke.` },
    chef:      { name: "👨‍🍳 Master Chef",   prompt: `Kamu adalah chef kelas dunia, expert masakan Indonesia dan internasional. Beri resep detail, tips masak, substitusi bahan, dan penjelasan food science. Buat masak terasa fun dan achievable.` },
    dokter:    { name: "🏥 Dokter AI",     prompt: `Kamu adalah asisten informasi medis (BUKAN pengganti dokter sungguhan). Jelaskan kondisi medis, gejala, obat, dan tips kesehatan dengan jelas. Selalu ingatkan untuk konsultasi dokter asli untuk keputusan medis. Bahasa Indonesia yang mudah dipahami.` },
    lawyer:    { name: "⚖️ Legal AI",      prompt: `Kamu adalah asisten informasi hukum Indonesia. Jelaskan konsep hukum, hak, prosedur, dan regulasi dengan jelas. Referensikan UU dan pasal yang relevan jika ada. Tegaskan bahwa kamu memberi informasi, bukan konsultasi hukum resmi.` },
    psikolog:  { name: "🧠 Psikolog AI",   prompt: `Kamu adalah psikolog yang compassionate dan profesional. Dengarkan dengan empati, validasi perasaan, dan beri strategi coping berbasis evidence (CBT, mindfulness). Bahasa hangat dan supportif dalam bahasa Indonesia. Sarankan bantuan profesional untuk isu serius.` },
    penulis:   { name: "✍️ Penulis Pro",   prompt: `Kamu adalah penulis profesional yang berpengalaman di berbagai genre: cerpen, puisi, copywriting, artikel, script. Bantu user menulis konten yang menarik, emosional, dan berkualitas. Berikan feedback konstruktif dan contoh konkret.` },
    bisnis:    { name: "📈 Business Guru", prompt: `Kamu adalah konsultan bisnis berpengalaman dengan expertise di startup, marketing, finance, dan strategy. Beri saran praktis berbasis data. Gunakan framework bisnis (SWOT, BMC, OKR) jika relevan. Bahasa Indonesia profesional tapi accessible.` }
};

// MODEL TIERS
const tier0 = ["google/gemini-2.5-flash", "deepseek/deepseek-v3.2", "anthropic/claude-sonnet-4-5"];
const tier1 = ["google/gemini-2.0-flash-lite-preview-02-05:free", "deepseek/deepseek-r1:free", "deepseek/deepseek-v3:free", "meta-llama/llama-3.3-70b-instruct:free", "qwen/qwen-2.5-72b-instruct:free"];
const tier2 = ["gryphe/mythomax-l2-13b:free", "sophosympatheia/midnight-rose-70b:free", "nousresearch/hermes-3-llama-3.1-405b:free"];
const tier3 = ["deepseek/deepseek-r1-distill-llama-70b:free", "nvidia/llama-3.1-nemotron-70b-instruct:free", "mistralai/mistral-nemo:free"];
const ALL_MODELS = [...tier0, ...tier1, ...tier2, ...tier3];

// ── Helper Download Media ─────────────────────────────────────
const SILENT_LOGGER = { level: 'silent', info:()=>{}, error:()=>{}, warn:()=>{}, debug:()=>{}, trace:()=>{}, fatal:()=>{}, child:()=>SILENT_LOGGER };

async function downloadMedia(m) {
    const msgType = Object.keys(m?.message || {})[0];
    const quoted = m?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const isImage = msgType === 'imageMessage';
    const isQuotedImage = quoted?.imageMessage;

    if (isQuotedImage) {
        return downloadMediaMessage({ key: m.message.extendedTextMessage.contextInfo.stanzaId, message: quoted }, 'buffer', {}, { logger: SILENT_LOGGER });
    } else if (isImage) {
        return downloadMediaMessage(m, 'buffer', {}, { logger: SILENT_LOGGER });
    }
    return null;
}

// ── Helper Analisis Gambar ────────────────────────────────────
async function analyzeImage(buffer, question) {
    const base64 = buffer.toString('base64');
    const res = await client.chat.completions.create({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            { type: 'text', text: question }
        ]}],
        max_tokens: 2000
    });
    return res.choices[0]?.message?.content || 'Tidak bisa menganalisis gambar.';
}

// ── Main Handler ──────────────────────────────────────────────
module.exports = async (command, args, msg, user, db, sock, m) => {
    const validCommands = ['ask','ai','tanya','ai0','ai1','ai2','ai3','sharechat','history','resetai','clearai','persona','aimode','aianalysis','aistat'];
    if (!validCommands.includes(command)) return;

    const now = Date.now();

    // Init user AI data
    if (!user.aiMemory) user.aiMemory = [];
    if (!user.aiFullHistory) user.aiFullHistory = [];
    if (!user.aiPersona) user.aiPersona = 'default';
    if (!user.aiStats) user.aiStats = { totalMessages: 0, totalChars: 0, firstChatDate: null };

    // ── RESET MEMORY ──────────────────────────────────────────
    if (command === 'resetai' || command === 'clearai') {
        user.aiMemory = [];
        saveDB(db);
        return msg.reply(`🔄 *Memory AI direset!*\nPercakapan dengan ${PERSONAS[user.aiPersona]?.name} dihapus. Mulai fresh! 🚀`);
    }

    // ── AI STATS ──────────────────────────────────────────────
    if (command === 'aistat') {
        const s = user.aiStats;
        return msg.reply(
            `📊 *STATISTIK AI KAMU*\n\n` +
            `🎭 Persona Aktif: ${PERSONAS[user.aiPersona]?.name || 'Default'}\n` +
            `💬 Total Pesan: ${s.totalMessages || 0}\n` +
            `📝 Total Karakter Diterima: ${(s.totalChars || 0).toLocaleString('id-ID')}\n` +
            `🧠 Konteks Tersimpan: ${Math.floor(user.aiMemory.length / 2)} percakapan\n` +
            `📚 Total Arsip: ${Math.floor(user.aiFullHistory.length / 2)} sesi\n` +
            `📅 Chat Pertama: ${s.firstChatDate ? new Date(s.firstChatDate).toLocaleDateString('id-ID') : 'Belum ada'}\n\n` +
            `_!resetai → hapus memori | !persona → ganti karakter_`
        );
    }

    // ── PERSONA SWITCHER ──────────────────────────────────────
    if (command === 'persona' || command === 'aimode') {
        const input = args[0]?.toLowerCase();
        if (!input || !PERSONAS[input]) {
            const list = Object.entries(PERSONAS).map(([k, v], i) => `${i+1}. ${v.name} → \`!persona ${k}\``).join('\n');
            return msg.reply(`🎭 *PILIH PERSONA AI*\n\n${list}\n\n📌 Aktif: *${PERSONAS[user.aiPersona]?.name}*\n\nMemori akan direset saat ganti persona.`);
        }
        user.aiPersona = input;
        user.aiMemory = [];
        saveDB(db);
        return msg.reply(`✅ Persona diganti ke *${PERSONAS[input].name}*!\nMemori lama dihapus. Siap chat! 🎭`);
    }

    // ── ANALISIS GAMBAR ───────────────────────────────────────
    if (command === 'aianalysis') {
        const target = m || msg;
        const buffer = await downloadMedia(target);
        if (!buffer) return msg.reply(`🔍 *AI IMAGE ANALYSIS*\n\nKirim/reply gambar dengan perintah ini.\nContoh: \`!aianalysis apa nama bunga ini?\``);
        const question = args.join(' ') || "Jelaskan isi gambar ini secara sangat detail dalam bahasa Indonesia. Sebutkan semua objek, warna, suasana, dan hal menarik.";
        await msg.react('🔍');
        await msg.reply("🔍 *Menganalisis gambar dengan AI Vision...*");
        try {
            const result = await analyzeImage(buffer, question);
            await msg.reply(`🖼️ *Hasil Analisis AI Vision:*\n\n${result}`);
            await msg.react('✅');
        } catch(e) {
            await msg.reply("❌ Gagal menganalisis gambar: " + e.message);
            await msg.react('❌');
        }
        return;
    }

    // ── SHARE HISTORY ─────────────────────────────────────────
    if (command === 'sharechat' || command === 'history') {
        if (!user.aiFullHistory?.length) return msg.reply("❌ Belum ada riwayat chat!");
        await msg.reply("⏳ Menyusun riwayat chat...");
        let text = `=== RIWAYAT CHAT: ${user.name || msg.pushName} ===\nTotal: ${user.aiFullHistory.length} pesan\nPersona: ${PERSONAS[user.aiPersona]?.name}\nTanggal: ${new Date().toLocaleString("id-ID")}\n${'='.repeat(42)}\n\n`;
        user.aiFullHistory.forEach(c => {
            const who = c.role === 'user' ? '👤 USER' : '🤖 BOT';
            text += `${who} (${c.date||'-'}) ${c.model?`[${c.model}]`:''}\n${c.content}\n${'-'.repeat(42)}\n`;
        });
        try {
            const res = await axios.post('https://paste.rs', text, { headers: { 'Content-Type': 'text/plain' } });
            return msg.reply(`✅ *Riwayat Chat Berhasil Disimpan!*\n\n🔗 ${res.data.trim()}\n\n_Klik link untuk melihat semua riwayat._ 📂`);
        } catch {
            return msg.reply("❌ Gagal membuat link. Coba lagi nanti.");
        }
    }

    // ── AI CHAT UTAMA ─────────────────────────────────────────
    const userPrompt = args.join(' ');

    // Cek vision: ada gambar + pertanyaan?
    const target2 = m || msg;
    const hasQuotedImage = target2?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    const hasDirectImage = target2?.message?.imageMessage;

    if ((hasQuotedImage || hasDirectImage) && userPrompt) {
        const buffer = await downloadMedia(target2);
        if (buffer) {
            await msg.react('👁️');
            await msg.reply("👁️ *Menganalisis gambar + pertanyaanmu...*");
            try {
                const visionPrompt = `${PERSONAS[user.aiPersona]?.prompt || PERSONAS.default.prompt}\n\nUser bertanya tentang gambar ini: "${userPrompt}"`;
                const result = await analyzeImage(buffer, visionPrompt);
                const ts = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
                user.aiMemory.push({ role:"user", content:`[Vision] ${userPrompt}` });
                user.aiMemory.push({ role:"assistant", content:result });
                if (user.aiMemory.length > 20) user.aiMemory = user.aiMemory.slice(-20);
                user.aiFullHistory.push({ role:"user", content:`[Vision] ${userPrompt}`, date:ts });
                user.aiFullHistory.push({ role:"assistant", content:result, date:ts, model:"gemini-vision" });
                user.aiStats.totalMessages = (user.aiStats.totalMessages||0) + 1;
                saveDB(db);
                await msg.reply(`👁️ *${PERSONAS[user.aiPersona]?.name} (Vision):*\n\n${result}`);
                await msg.react('✅');
            } catch(e) {
                await msg.reply("❌ Gagal analisis vision: " + e.message);
                await msg.react('❌');
            }
            return;
        }
    }

    if (!userPrompt) {
        const p = PERSONAS[user.aiPersona] || PERSONAS.default;
        return msg.reply(
            `🤖 *${p.name}*\n\n` +
            `Format: \`!ai <pertanyaan>\`\n\n` +
            `🎭 \`!persona\` — ganti karakter AI\n` +
            `🔄 \`!resetai\` — hapus memori\n` +
            `📊 \`!aistat\` — statistikmu\n` +
            `🖼️ \`!aianalysis\` — analisis gambar\n` +
            `📚 \`!sharechat\` — lihat riwayat\n\n` +
            `_Tier: !ai0 (premium) | !ai1 (smart) | !ai2 (creative) | !ai3 (fast)_`
        );
    }

    // Tentukan tier
    let priorityList = tier1;
    let modeName = PERSONAS[user.aiPersona]?.name || "🤖 Algojo AI";
    if (command === 'ai0') priorityList = tier0;
    else if (command === 'ai1') priorityList = tier1;
    else if (command === 'ai2') priorityList = tier2;
    else if (command === 'ai3') priorityList = tier3;

    const finalList = [...new Set([...priorityList, ...ALL_MODELS])];
    await msg.reply(`*${modeName} sedang berpikir...*`);
    await msg.react('⏳');

    const systemPrompt = PERSONAS[user.aiPersona]?.prompt || PERSONAS.default.prompt;
    const messagesToSend = [
        { role: "system", content: systemPrompt },
        ...user.aiMemory,
        { role: "user", content: userPrompt }
    ];

    let success = false, lastError = "";
    for (const modelId of finalList) {
        try {
            const completion = await client.chat.completions.create({ messages: messagesToSend, model: modelId, max_tokens: 2000 });
            const answer = completion.choices[0].message.content;
            const ts = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

            user.aiMemory.push({ role:"user", content:userPrompt });
            user.aiMemory.push({ role:"assistant", content:answer });
            if (user.aiMemory.length > 20) user.aiMemory = user.aiMemory.slice(-20);
            user.aiFullHistory.push({ role:"user", content:userPrompt, date:ts });
            user.aiFullHistory.push({ role:"assistant", content:answer, date:ts, model:modelId });

            if (!user.aiStats.firstChatDate) user.aiStats.firstChatDate = now;
            user.aiStats.totalMessages = (user.aiStats.totalMessages||0) + 1;
            user.aiStats.totalChars = (user.aiStats.totalChars||0) + answer.length;

            saveDB(db);
            await msg.reply(`*${modeName}:*\n\n${answer}\n\n_🧠 Model: ${modelId}_`);
            await msg.react('✅');
            success = true;
            break;
        } catch(e) {
            lastError = e.message;
            continue;
        }
    }

    if (!success) {
        await msg.reply(`❌ *Gagal Total.* Sudah coba ${finalList.length} model.\n⚠️ Error: ${lastError}`);
        await msg.react('❌');
    }
};
