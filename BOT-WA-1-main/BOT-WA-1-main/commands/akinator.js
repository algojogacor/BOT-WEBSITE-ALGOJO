/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║              AKINATOR AI — Fitur 11                          ║
 * ║  !akinator   — Mulai permainan Akinator                      ║
 * ║  !ya / !tidak / !mungkin / !tidaktahu — Jawab pertanyaan     ║
 * ║  !akinatorberhenti — Stop game                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require('dotenv').config();
const OpenAI = require('openai');
const { saveDB } = require('../helpers/database');

const client = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "https://wa-bot.com",
        "X-Title": "Arya Bot Akinator"
    }
});

// ─── Sesi Akinator ────────────────────────────────────────────
const sesiAkinator = new Map(); // userId -> { pertanyaan, jawaban, pertanyaanKe, selesai, status, batasPertanyaan, tebakanSementara }

// ─── Tanya AI untuk pertanyaan berikutnya ─────────────────────
async function generatePertanyaan(riwayat) {
    const systemPrompt = `Kamu adalah Akinator tingkat dewa, pakar permainan tebak tokoh (nyata/fiksi), pahlawan, ilmuwan, hewan, atau benda.
Tugasmu: Menebak apa yang dipikirkan user dengan pertanyaan Ya/Tidak seefisien mungkin.

STRATEGI BERTANYA (Sangat Penting):
1. Mulai dari spektrum sangat luas (Nyata/Fiksi? Manusia/Bukan? Hidup/Mati?).
2. Gunakan metode eliminasi separuh (binary search). Jangan menebak hal spesifik terlalu awal.
3. Kerucutkan berdasarkan era, bidang keahlian, asal negara, gender, dll.
4. Analisis riwayat jawaban user secara logis untuk menyingkirkan kandidat yang tidak mungkin.

FORMAT RESPONS WAJIB JSON DENGAN STRUKTUR BERIKUT:
{
  "pemikiran_internal": "Tuliskan 3 kandidat terkuat saat ini berdasarkan riwayat jawaban, dan jelaskan mengapa kamu memilih pertanyaan selanjutnya.",
  "pertanyaan": "Pertanyaanmu selanjutnya (wajib bisa dijawab Ya/Tidak)",
  "tebakan_final": null, 
  "alasan_tebakan": "Alasan tebakanmu (isi jika tebakan_final tidak null)"
}

PANTANGAN:
- Jangan pernah memberikan teks atau sapaan di luar format JSON.
- Jangan mengulang pertanyaan yang maknanya sama dengan riwayat sebelumnya.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Riwayat tanya-jawab sejauh ini:\n${riwayat}\n\nBerikan pemikiran, pertanyaan berikutnya, atau tebakan dalam format JSON yang valid.` }
    ];

    const response = await client.chat.completions.create({
        model: 'google/gemini-2.5-flash',
        messages,
        max_tokens: 5000,
        temperature: 0.3 // Temperature rendah agar logikanya konsisten dan tidak melantur
    });

    let text = response.choices[0]?.message?.content || '{}';
    
    // Pembersih JSON yang lebih tangguh (menghindari error jika AI ngelantur)
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
        text = match[0];
    }
    
    return JSON.parse(text);
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['akinator', 'ya', 'tidak', 'mungkin', 'tidaktahu', 'entah', 'akinatorberhenti', 'akiberhenti'];
    if (!validCommands.includes(command)) return;

    const userId = msg.author || msg.from;

    // ══════════════════════════════════════════════════════════
    // !akinator — Mulai permainan baru
    // ══════════════════════════════════════════════════════════
    if (command === 'akinator') {
        if (sesiAkinator.has(userId)) {
            return msg.reply('🧞 Akinator sudah aktif! Jawab pertanyaannya dengan `!ya` / `!tidak` / `!mungkin` / `!tidaktahu`');
        }

        await msg.reply(
            `🧞 *AKINATOR*\n` +
            `${'─'.repeat(30)}\n\n` +
            `_"Aku bisa menebak siapa yang kamu pikirkan..."_\n\n` +
            `Pikirkan sebuah *karakter, tokoh, atau benda* apa saja.\n` +
            `Aku akan menebaknya hanya dengan pertanyaan!\n\n` +
            `⏳ _Sedang menyiapkan pertanyaan pertama..._`
        );

        try {
            const awal = await generatePertanyaan('(Belum ada riwayat, ini pertanyaan pertama)');

            sesiAkinator.set(userId, {
                pertanyaanKe: 1,
                riwayat: [],
                currentQ: awal.pertanyaan,
                selesai: false,
                status: 'bertanya', // <-- Status awal
                batasPertanyaan: 20, // <-- Batas default sebelum menebak paksa
                tebakanSementara: ''
            });

            return msg.reply(
                `🧞 *AKINATOR — Pertanyaan 1*\n\n` +
                `❓ *${awal.pertanyaan}*\n\n` +
                `Jawab:\n` +
                `✅ \`!ya\`  |  ❌ \`!tidak\`  |  🤔 \`!mungkin\`  |  ❓ \`!tidaktahu\`\n\n` +
                `_Berhenti: \`!akinatorberhenti\`_`
            );
        } catch (e) {
            console.error('Akinator Error:', e.message);
            return msg.reply('❌ Gagal memulai Akinator. Coba lagi.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // Jawaban user
    // ══════════════════════════════════════════════════════════
    if (['ya', 'tidak', 'mungkin', 'tidaktahu', 'entah'].includes(command)) {
        if (!sesiAkinator.has(userId)) {
            return msg.reply('❌ Belum ada game Akinator. Ketik `!akinator` untuk mulai!');
        }

        const sesi = sesiAkinator.get(userId);
        if (sesi.selesai) return;

        // --- 1. LOGIKA JIKA AKINATOR SEDANG MENUNGGU KONFIRMASI TEBAKAN ---
        if (sesi.status === 'menebak') {
            if (command === 'ya') {
                sesiAkinator.delete(userId);
                return msg.reply('🎉 *YAY! AKU BENAR!*\nAkinator memang tidak pernah salah (terlalu sering)!\n\nMain lagi? Ketik `!akinator`');
            } else if (command === 'tidak') {
                // Akinator salah, ubah status ke bertanya dan tambah jatah 5 pertanyaan
                sesi.status = 'bertanya';
                sesi.batasPertanyaan += 5; 
                sesi.riwayat.push(`Tebakan Akinator: "${sesi.tebakanSementara}" → Jawaban User: SALAH! Tebakan ini keliru, cari kandidat lain.`);
                
                await msg.reply(`Ternyata bukan ya... Hmm, oke beri aku tambahan 5 pertanyaan lagi untuk berpikir! 💭`);
                
                // Panggil AI lagi untuk dapat pertanyaan baru berdasarkan riwayat yang gagal
                try {
                    const riwayatStr = sesi.riwayat.join('\n');
                    const hasil = await generatePertanyaan(riwayatStr);
                    sesi.currentQ = hasil.pertanyaan;
                    
                    return msg.reply(
                        `🧞 *AKINATOR — Pertanyaan ${sesi.pertanyaanKe}*\n\n` +
                        `❓ *${hasil.pertanyaan}*\n\n` +
                        `✅ \`!ya\`  |  ❌ \`!tidak\`  |  🤔 \`!mungkin\`  |  ❓ \`!tidaktahu\``
                    );
                } catch (e) {
                    sesiAkinator.delete(userId);
                    return msg.reply('❌ Terjadi error saat memuat pertanyaan baru. Game dihentikan.');
                }
            } else {
                return msg.reply('⚠️ Jawab tebakanku dengan `!ya` atau `!tidak` saja ya!');
            }
        }

        // --- 2. LOGIKA JIKA AKINATOR SEDANG BERTANYA BIASA ---
        const jawabanMap = {
            'ya': 'Ya',
            'tidak': 'Tidak',
            'mungkin': 'Mungkin',
            'tidaktahu': 'Tidak tahu',
            'entah': 'Tidak tahu'
        };

        const jawaban = jawabanMap[command];
        sesi.riwayat.push(`Pertanyaan ${sesi.pertanyaanKe}: "${sesi.currentQ}" → Jawaban: ${jawaban}`);
        sesi.pertanyaanKe++;

        await msg.reply(`💭 _Berpikir..._`);

        try {
            const riwayatStr = sesi.riwayat.join('\n');
            const hasil = await generatePertanyaan(riwayatStr);

            // Jika AI sudah punya tebakan final atau batas pertanyaan habis
            if (hasil.tebakan_final || sesi.pertanyaanKe > sesi.batasPertanyaan) {
                sesi.status = 'menebak';
                sesi.tebakanSementara = hasil.tebakan_final || 'Aku benar-benar kebingungan...';
                
                return msg.reply(
                    `🧞 *AKINATOR PUNYA TEBAKAN!*\n` +
                    `${'─'.repeat(30)}\n\n` +
                    `Setelah *${sesi.pertanyaanKe - 1} pertanyaan*...\n\n` +
                    `🎯 Apakah yang kamu pikirkan adalah:\n\n` +
                    `✨ *${sesi.tebakanSementara.toUpperCase()}* ✨\n\n` +
                    `_${hasil.alasan_tebakan || 'Aku yakin ini jawaban yang benar berdasarkan ciri-cirinya.'}_\n\n` +
                    `${'─'.repeat(25)}\n` +
                    `Benar? Ketik \`!ya\` atau \`!tidak\`.`
                );
            }

            // Lanjut nanya kalau belum ada tebakan
            sesi.currentQ = hasil.pertanyaan;

            return msg.reply(
                `🧞 *AKINATOR — Pertanyaan ${sesi.pertanyaanKe}*\n\n` +
                `❓ *${hasil.pertanyaan}*\n\n` +
                `✅ \`!ya\`  |  ❌ \`!tidak\`  |  🤔 \`!mungkin\`  |  ❓ \`!tidaktahu\``
            );
        } catch (e) {
            console.error('Akinator Error:', e.message);
            sesiAkinator.delete(userId);
            return msg.reply('❌ Terjadi error. Game dihentikan. Coba `!akinator` lagi.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // !akinatorberhenti
    // ══════════════════════════════════════════════════════════
    if (command === 'akinatorberhenti' || command === 'akiberhenti') {
        if (!sesiAkinator.has(userId)) return msg.reply('❌ Tidak ada game Akinator aktif.');
        sesiAkinator.delete(userId);
        return msg.reply('🧞 *Akinator dihentikan.* Oke, aku menyerah kali ini...\nMain lagi? `!akinator`');
    }
};
