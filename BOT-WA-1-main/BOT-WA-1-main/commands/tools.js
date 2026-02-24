const axios = require('axios');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { saveDB, addQuestProgress } = require('../helpers/database');
const fs = require('fs'); // Pakai fs standar aja biar aman
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// ✅ Set Path FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = async (command, args, msg, user, db, chat) => {
    
    // Ambil ID Chat lawan bicara
    const jid = msg.key.remoteJid; 
    const sender = msg.key.participant || msg.key.remoteJid;

    // ==========================================
    // FITUR 2: STICKER (FIXED)
    // ==========================================
    if (command === "s" || command === "sticker") {
        try {
            const isQuotedImage = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            const isImage = msg.message.imageMessage;
            const isVideo = msg.message.videoMessage || msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
            const isQuotedVideo = msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;

            if (isImage || isQuotedImage || isVideo || isQuotedVideo) {
                // 1. Download Media
                let buffer;
                let isVid = false;
                
                // Cek apakah user mereply pesan atau kirim langsung
                if (isQuotedImage || isQuotedVideo) {
                      buffer = await downloadMediaMessage(
                        {
                            key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                            message: msg.message.extendedTextMessage.contextInfo.quotedMessage
                        },
                        'buffer', {}, { logger: console }
                    );
                    if (isQuotedVideo) isVid = true;
                } else {
                    buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
                    if (isVideo) isVid = true;
                }

                if (buffer.length > 10 * 1024 * 1024) { // Cek Jika file > 10MB
                     return msg.reply("⚠️ File terlalu besar! Maksimal 10MB.");
                }

                // 2. Simpan File Sementara
                const time = Date.now();
                const ext = isVid ? 'mp4' : 'jpg'; 
                
                // Pastikan folder temp ada
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                const tempInput = path.join(tempDir, `input_${time}.${ext}`);
                const tempOutput = path.join(tempDir, `output_${time}.webp`);

                await fs.writeFileSync(tempInput, buffer);

                // 3. Konversi pakai FFmpeg
                msg.reply("⏳ Membuat stiker...");
                
                await new Promise((resolve, reject) => {
                    const commandFfmpeg = ffmpeg(tempInput)
                        .on('error', (err) => {
                            console.error('FFmpeg Error:', err);
                            reject(err);
                        })
                        .on('end', () => resolve());

                    if (isVid) {
                        // SETTINGAN VIDEO KHUSUS (Kompresi Kuat)
                        commandFfmpeg.inputFormat('mp4');
                        commandFfmpeg.addOutputOptions([
                            `-vcodec libwebp`,
                            `-vf scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse`,
                            `-loop 0`,
                            `-ss 00:00:00`,
                            `-t 00:00:05`, // POTONG CUMA 5 DETIK AWAL
                            `-preset default`,
                            `-an`, // Hapus Audio
                            `-vsync 0`,
                            `-q:v 50` // Turunkan kualitas ke 50% biar size kecil
                        ]);
                    } else {
                        // SETTINGAN GAMBAR BIASA
                        commandFfmpeg.addOutputOptions([
                            `-vcodec libwebp`,
                            `-vf scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse`
                        ]);
                    }

                    commandFfmpeg.toFormat('webp').save(tempOutput);
                });

                // 4. Kirim Stiker
                const stickerBuffer = fs.readFileSync(tempOutput);
                await chat.sendMessage(jid, { sticker: stickerBuffer }, { quoted: msg });

                // Bersihkan file sampah
                if(fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
                if(fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);

                // Update Quest
                addQuestProgress(user, "sticker");
                saveDB(db);

            } else {
                msg.reply("📸 Balas foto/video atau kirim foto dengan caption *!s*");
            }

        } catch (err) {
            console.error("Sticker Error:", err);
            msg.reply("❌ Gagal. Video mungkin corrupt atau FFmpeg error.");
        }
    }

    // ==========================================
    // FITUR 3: TOIMG (FIXED)
    // ==========================================
    if (command === "toimg") {
        try {
            // Cek apakah user mereply stiker
            const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
            const isQuotedSticker = quotedMsg?.stickerMessage;
            
            if (isQuotedSticker) {
                msg.reply("⏳ Mengubah stiker ke gambar...");

                // 1. Download Stiker
                const buffer = await downloadMediaMessage(
                    {
                        key: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        message: quotedMsg
                    },
                    'buffer', {}, { logger: console }
                );

                // 2. Path File
                const time = Date.now();
                const tempDir = path.join(__dirname, '../temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

                const tempInput = path.join(tempDir, `sticker_${time}.webp`);
                const tempOutput = path.join(tempDir, `image_${time}.png`);

                fs.writeFileSync(tempInput, buffer);

                // 3. Konversi WebP -> PNG
                await new Promise((resolve, reject) => {
                    ffmpeg(tempInput)
                        .on('error', (err) => reject(err))
                        .on('end', () => resolve())
                        .outputOptions([
                            '-vframes 1', 
                            '-vcodec png'
                        ])
                        .save(tempOutput);
                });

                // 4. Kirim Gambar
                const imgBuffer = fs.readFileSync(tempOutput);
                await chat.sendMessage(jid, { image: imgBuffer, caption: "🖼️ Ini gambarnya!" }, { quoted: msg });

                // Bersihkan
                fs.unlinkSync(tempInput);
                fs.unlinkSync(tempOutput);
                
            } else {
                msg.reply("⚠️ Balas stiker dengan perintah *!toimg*");
            }
        } catch (err) {
            console.error("ToImg Error:", err);
            msg.reply("❌ Gagal. Stiker animasi tidak didukung penuh.");
        }
    }

    // ==========================================
    // FITUR 4: YTMP3 (FIXED)
    // ==========================================
    if (command === "ytmp3") {
        const url = args[0];
        if (!url) return msg.reply("❌ Masukkan URL YouTube!");
        msg.reply("⏳ Sedang memproses audio...");

        try {
            const response = await axios.post("https://co.wuk.sh/api/json", {
                url: url, aFormat: "mp3", isAudioOnly: true
            }, { 
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
            });

            if (response.data && response.data.url) {
                await chat.sendMessage(jid, { 
                    audio: { url: response.data.url }, 
                    mimetype: 'audio/mp4',
                    fileName: 'lagu.mp3'
                }, { quoted: msg });
                
                msg.reply("✅ *Download Berhasil!*");
            } else {
                msg.reply("❌ Gagal mendapatkan link (API Error).");
            }
        } catch (err) {
            console.error("YT API Error:", err.message);
            msg.reply("❌ Gagal. Pastikan link valid.");
        }
    }
};