const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static'); 

// Set path
ffmpeg.setFfmpegPath(ffmpegPath);

// Format Sesi: { "id_user": { buffers: [], mode: 'color' | 'bw' } }
const pdfSessions = {};

module.exports = async (command, args, msg, sender, sock) => {
    
    // DETEKSI GAMBAR
    const content = msg.message;
    const isImage = content.imageMessage || 
                    content.ephemeralMessage?.message?.imageMessage || 
                    content.viewOnceMessage?.message?.imageMessage ||
                    content.viewOnceMessageV2?.message?.imageMessage ||
                    content.documentMessage?.mimetype?.startsWith('image/');
                    
    const isQuotedImage = content.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage ||
                          content.extendedTextMessage?.contextInfo?.quotedMessage?.viewOnceMessage?.message?.imageMessage;

    // ==================================================================
    // 1. LOGIKA SAAT SESI AKTIF (User kirim gambar terus-terusan)
    // ==================================================================
    if (pdfSessions[sender]) {
        
        // SELESAI
        if (command === 'pdfdone' || command === 'donepdf') {
            if (pdfSessions[sender].buffers.length === 0) {
                return msg.reply("❌ Belum ada gambar! Kirim gambar dulu.");
            }

            const totalPages = pdfSessions[sender].buffers.length;
            const currentMode = pdfSessions[sender].mode === 'bw' ? 'Hitam Putih (Scan)' : 'Warna Asli';

            msg.reply(`⏳ Menggabungkan ${totalPages} gambar menjadi PDF (${currentMode})...`);
            
            try {
                const doc = new PDFDocument({ autoFirstPage: false });
                let buffers = [];

                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', async () => {
                    const pdfData = Buffer.concat(buffers);
                    await sock.sendMessage(msg.key.remoteJid, { 
                        document: pdfData, 
                        mimetype: 'application/pdf', 
                        fileName: `Dokumen_${pdfSessions[sender].mode}_${Date.now()}.pdf`,
                        caption: `✅ *PDF Selesai!*\n📄 Halaman: ${totalPages}\n🎨 Mode: ${currentMode}`
                    }, { quoted: msg });

                    delete pdfSessions[sender]; // Hapus sesi
                });

                for (let imgBuffer of pdfSessions[sender].buffers) {
                    try {
                        const img = doc.openImage(imgBuffer);
                        doc.addPage({ size: [img.width, img.height] });
                        doc.image(img, 0, 0);
                    } catch (e) {
                        console.error("Gagal menambahkan halaman:", e);
                    }
                }
                doc.end();
            } catch (err) {
                console.error("PDF Error:", err);
                msg.reply("❌ Gagal membuat PDF.");
            }
            return;
        }

        // BATAL
        if (command === 'pdfcancel') {
            delete pdfSessions[sender];
            return msg.reply("🗑️ Sesi PDF dibatalkan.");
        }

        // TANGKAP GAMBAR (AUTO)
        if (isImage) {
            console.log(`📥 [PDF] Menerima gambar dari ${sender}...`);
            try {
                // Download
                let buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
                
                // JIKA MODE SCAN (BW)
                if (pdfSessions[sender].mode === 'bw') {
                    const time = Date.now();
                    const tempInput = path.join(__dirname, `../temp/scan_in_${time}.jpg`);
                    const tempOutput = path.join(__dirname, `../temp/scan_out_${time}.jpg`);
                    
                    await fs.ensureDir(path.join(__dirname, '../temp'));
                    await fs.writeFile(tempInput, buffer);

                    // Filter FFmpeg (Contrast & Grayscale)
                    await new Promise((resolve, reject) => {
                        ffmpeg(tempInput)
                            .outputOptions(["-vf", "eq=contrast=1.5:saturation=0:brightness=0.1"])
                            .save(tempOutput)
                            .on('end', () => resolve())
                            .on('error', (err) => reject(err));
                    });

                    buffer = await fs.readFile(tempOutput);
                    fs.unlinkSync(tempInput);
                    fs.unlinkSync(tempOutput);
                }

                if (pdfSessions[sender].buffers.length >= 20) {
                    return msg.reply("❌ Limit 20 gambar tercapai! Ketik *!pdfdone*.");
                }

                pdfSessions[sender].buffers.push(buffer);
                console.log(`✅ [PDF] Gambar tersimpan. Total: ${pdfSessions[sender].buffers.length}`);
                
                // Kasih reaksi jempol biar user tau gambar masuk
                if (msg.react) msg.react('👍'); 
                
            } catch (err) {
                console.error("Gagal download gambar sesi:", err);
            }
            return;
        }
    }

    // ==================================================================
    // 2. MULAI SESI BARU
    // ==================================================================
    if (command === 'topdf' || command === 'pdf' || command === 'scan') {
        
        if (pdfSessions[sender]) {
            return msg.reply(`⚠️ Sesi Masih Aktif! Ketik *!pdfdone* untuk selesai.`);
        }

        const mode = (command === 'scan') ? 'bw' : 'color';
        pdfSessions[sender] = { buffers: [], mode: mode };

        const textMode = mode === 'bw' ? "⚫⚪ *MODE SCAN (Hitam Putih)*" : "🎨 *MODE WARNA ASLI*";
        const replyText = `🚀 *Sesi PDF Dimulai!*\n${textMode}\n\nSilakan kirim gambar-gambarnya (bisa album). Bot akan otomatis memproses.\nKetik *!pdfdone* jika selesai.`;

        // Jika perintah disertai gambar langsung (Caption atau Reply)
        if (isImage || isQuotedImage) {
            msg.reply(replyText);
            try {
                let buffer;

                // ✅ FIX: Download Logic yang lebih aman
                if (isQuotedImage) {
                    // Trik download quoted message yang aman di Baileys
                    const quotedMsg = msg.message.extendedTextMessage.contextInfo.quotedMessage;
                    buffer = await downloadMediaMessage(
                        { key: { remoteJid: msg.key.remoteJid, id: msg.message.extendedTextMessage.contextInfo.stanzaId }, message: quotedMsg },
                        'buffer', {}, { logger: console }
                    );
                } else {
                    buffer = await downloadMediaMessage(msg, 'buffer', {}, { logger: console });
                }

                // Proses Filter jika Mode Scan
                if (mode === 'bw') {
                    const time = Date.now();
                    const tempInput = path.join(__dirname, `../temp/scan_in_${time}.jpg`);
                    const tempOutput = path.join(__dirname, `../temp/scan_out_${time}.jpg`);
                    await fs.ensureDir(path.join(__dirname, '../temp'));
                    await fs.writeFile(tempInput, buffer);
                    
                    await new Promise((resolve, reject) => {
                        ffmpeg(tempInput)
                            .outputOptions(["-vf", "eq=contrast=1.5:saturation=0:brightness=0.1"])
                            .save(tempOutput)
                            .on('end', () => resolve())
                            .on('error', (err) => reject(err));
                    });
                    buffer = await fs.readFile(tempOutput);
                    fs.unlinkSync(tempInput); fs.unlinkSync(tempOutput);
                }

                pdfSessions[sender].buffers.push(buffer);
                console.log(`✅ [PDF] Gambar pertama tersimpan.`);
                if (msg.react) msg.react('👍');

            } catch (err) {
                console.error("Gagal download gambar pertama:", err);
                msg.reply("❌ Gagal mengambil gambar pertama.");
            }
        } else {
            msg.reply(replyText);
        }
    }
};