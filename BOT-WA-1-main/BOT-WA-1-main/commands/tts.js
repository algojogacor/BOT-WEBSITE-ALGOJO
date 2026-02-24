const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

module.exports = async (command, args, msg) => {
    
    if (command !== 'tts') return;

    // 1. Cek Input
    if (args.length === 0) {
        return msg.reply("❌ Masukkan teksnya! Contoh: \n!tts Halo apa kabar");
    }

    const text = args.join(" ");
    const lang = 'id'; // Bahasa Indonesia

    try {
        // 2. Siapkan Chat Wrapper (untuk send message)
        const chat = await msg.getChat(); 

        // 3. Tentukan Lokasi File Sementara
        const tempDir = path.join(__dirname, '../temp');
        
        // Pastikan folder temp ada
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const filePath = path.join(tempDir, `tts_${Date.now()}.mp3`);

        // 4. Proses Google TTS
        const tts = new gTTS(text, lang);
        
        tts.save(filePath, async function (err, result) {
            if (err) { 
                console.error("Gagal save TTS:", err);
                return msg.reply("❌ Gagal membuat audio TTS."); 
            }

            // 5. BACA FILE JADI BUFFER (Ini Cara Baileys!)
            // Baileys tidak butuh 'MessageMedia', dia butuh 'Buffer'.
            const audioBuffer = fs.readFileSync(filePath);

            // 6. Kirim Audio
            await chat.sendMessage({ 
                audio: audioBuffer, 
                mimetype: 'audio/mp4', 
                ptt: true // true = Kirim sebagai Voice Note
            });

            // 7. Hapus File Sampah biar server gak penuh
            fs.unlinkSync(filePath);
        });

    } catch (e) {
        console.error("Error TTS:", e);
        msg.reply("❌ Terjadi kesalahan pada fitur TTS.");
    }
};
