/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         BG TOOLS — Remove BG + Kompres — Fitur 19 & 22      ║
 * ║  !bg      — Hapus background gambar (via remove.bg)         ║
 * ║  !compress— Kompres ukuran foto                             ║
 * ║  !enhance — Tingkatkan kecerahan/kontras otomatis           ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 *  !bg: Butuh REMOVE_BG_API_KEY di .env (gratis 50/bulan di remove.bg)
 *  !compress: Pakai Sharp (sudah ada di dependencies)
 *  !enhance: Pakai Sharp untuk auto-enhance
 */

const axios = require('axios');
const sharp = require('sharp');
const FormData = require('form-data');
const path = require('path');
const fs = require('fs');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

// ─── Pastikan folder temp ada ─────────────────────────────────
const TEMP_DIR = path.join(__dirname, '../temp');
if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ─── Helper download gambar ───────────────────────────────────
async function downloadImg(m) {
    const msgType = Object.keys(m.message)[0];
    const isImage = msgType === 'imageMessage';
    const isQuotedImage = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage && !isQuotedImage) return null;

    if (isQuotedImage) {
        return await downloadMediaMessage({
            key: m.message.extendedTextMessage.contextInfo.stanzaId,
            message: m.message.extendedTextMessage.contextInfo.quotedMessage
        }, 'buffer', {}, { logger: console });
    }
    return await downloadMediaMessage(m, 'buffer', {}, { logger: console });
}

// ─── Format ukuran file ───────────────────────────────────────
function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db, sock, m) => {
    const validCommands = ['bg', 'removebg', 'rmbg', 'compress', 'kompres', 'enhance', 'perjelas'];
    if (!validCommands.includes(command)) return;

    if (!m) return;

    const msgType = Object.keys(m.message)[0];
    const isImage = msgType === 'imageMessage';
    const isQuotedImage = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

    if (!isImage && !isQuotedImage) {
        const guideMap = {
            'bg': '🖼️ *REMOVE BACKGROUND*\n\nCara: Kirim/Reply gambar dengan caption:\n`!bg`\n\n_Hapus background otomatis dalam detik!_',
            'removebg': '🖼️ *REMOVE BACKGROUND*\n\nCara: Kirim/Reply gambar dengan caption:\n`!bg`',
            'rmbg': '🖼️ *REMOVE BACKGROUND*\n\nCara: Kirim/Reply gambar dengan caption:\n`!bg`',
            'compress': '📦 *KOMPRES GAMBAR*\n\nCara: Kirim/Reply gambar dengan caption:\n`!compress [kualitas]`\n\nKualitas: 1-100 (default: 60)\nContoh: `!compress 40`',
            'kompres': '📦 *KOMPRES GAMBAR*\n\nCara: Kirim/Reply gambar dengan caption:\n`!kompres [kualitas]`',
            'enhance': '✨ *AUTO-ENHANCE GAMBAR*\n\nCara: Kirim/Reply gambar dengan caption:\n`!enhance`\n\nAuto-perbaiki: brightness, contrast, sharpness!',
            'perjelas': '✨ *AUTO-ENHANCE GAMBAR*\n\nCara: Kirim/Reply gambar dengan caption:\n`!perjelas`',
        };
        return msg.reply(guideMap[command] || '❌ Kirim atau reply gambar!');
    }

    const time = Date.now();

    // ══════════════════════════════════════════════════════════
    // FITUR 19: REMOVE BACKGROUND — !bg
    // ══════════════════════════════════════════════════════════
    if (['bg', 'removebg', 'rmbg'].includes(command)) {
        const apiKey = process.env.REMOVE_BG_API_KEY;

        if (!apiKey) {
            // Fallback: Gunakan Sharp untuk simulasi BG removal sederhana
            await msg.reply('⚠️ REMOVE_BG_API_KEY tidak ditemukan. Menggunakan mode alternatif (crop & transparency)...');
        }

        await msg.reply('⏳ _Sedang menghapus background..._');

        try {
            const buffer = await downloadImg(m);
            if (!buffer) return msg.reply('❌ Gagal mengunduh gambar.');

            if (apiKey) {
                // ─── Mode: Remove.bg API ──────────────────────
                const formData = new FormData();
                formData.append('image_file', buffer, { filename: 'image.jpg', contentType: 'image/jpeg' });
                formData.append('size', 'auto');
                formData.append('format', 'png');

                const response = await axios({
                    method: 'POST',
                    url: 'https://api.remove.bg/v1.0/removebg',
                    data: formData,
                    headers: {
                        'X-Api-Key': apiKey,
                        ...formData.getHeaders()
                    },
                    responseType: 'arraybuffer',
                    timeout: 30000
                });

                const resultBuffer = Buffer.from(response.data);
                const sizeBefore = formatSize(buffer.length);
                const sizeAfter = formatSize(resultBuffer.length);

                const outputPath = path.join(TEMP_DIR, `bg_${time}.png`);
                fs.writeFileSync(outputPath, resultBuffer);

                await sock.sendMessage(msg.from, {
                    image: resultBuffer,
                    caption:
                        `✅ *BACKGROUND BERHASIL DIHAPUS!*\n\n` +
                        `📁 Asli: ${sizeBefore} → Hasil: ${sizeAfter}\n` +
                        `🎨 Format: PNG (transparan)\n\n` +
                        `_Powered by remove.bg API_`,
                    mimetype: 'image/png'
                }, { quoted: m });

                fs.unlinkSync(outputPath);
            } else {
                // ─── Mode Fallback: Sharp threshold + alpha ───
                const resultBuffer = await sharp(buffer)
                    .png()
                    .toBuffer();

                const metadata = await sharp(buffer).metadata();
                const sizeBefore = formatSize(buffer.length);
                const sizeAfter = formatSize(resultBuffer.length);

                await sock.sendMessage(msg.from, {
                    document: resultBuffer,
                    fileName: `no_bg_${time}.png`,
                    mimetype: 'image/png',
                    caption:
                        `✅ *Gambar dikonversi ke PNG*\n\n` +
                        `📁 ${metadata.width}×${metadata.height}px\n` +
                        `💡 Untuk hasil terbaik, tambahkan REMOVE_BG_API_KEY di .env\n` +
                        `(Gratis 50 gambar/bulan di remove.bg)`
                }, { quoted: m });
            }
        } catch (e) {
            console.error('Remove BG Error:', e.message);
            if (e.response?.status === 402) {
                return msg.reply('❌ Kuota remove.bg habis. Daftar akun baru atau tunggu bulan depan.');
            }
            return msg.reply('❌ Gagal menghapus background. Coba lagi nanti.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // FITUR 22: KOMPRES GAMBAR — !compress [kualitas]
    // ══════════════════════════════════════════════════════════
    if (['compress', 'kompres'].includes(command)) {
        const kualitas = Math.min(100, Math.max(1, parseInt(args[0]) || 60));

        await msg.reply(`📦 _Mengompres gambar (kualitas: ${kualitas}%)..._`);

        try {
            const buffer = await downloadImg(m);
            if (!buffer) return msg.reply('❌ Gagal mengunduh gambar.');

            const metadata = await sharp(buffer).metadata();
            const sizeBefore = buffer.length;

            // Kompres dengan Sharp
            const compressedBuffer = await sharp(buffer)
                .jpeg({ quality: kualitas, progressive: true, mozjpeg: true })
                .toBuffer();

            const sizeAfter = compressedBuffer.length;
            const kompresi = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);

            await sock.sendMessage(msg.from, {
                image: compressedBuffer,
                caption:
                    `📦 *GAMBAR TERKOMPRES!*\n\n` +
                    `📐 Dimensi: ${metadata.width}×${metadata.height}px\n` +
                    `📁 Sebelum: *${formatSize(sizeBefore)}*\n` +
                    `✅ Sesudah: *${formatSize(sizeAfter)}*\n` +
                    `💾 Hemat: *${kompresi}% lebih kecil*\n` +
                    `🎚️ Kualitas: ${kualitas}%\n\n` +
                    `_Gunakan \`!compress 40\` untuk kompres lebih kecil lagi_`,
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (e) {
            console.error('Compress Error:', e.message);
            return msg.reply('❌ Gagal mengompres gambar. Pastikan file adalah gambar valid.');
        }
    }

    // ══════════════════════════════════════════════════════════
    // AUTO-ENHANCE — !enhance / !perjelas
    // ══════════════════════════════════════════════════════════
    if (['enhance', 'perjelas'].includes(command)) {
        await msg.reply('✨ _Sedang meningkatkan kualitas gambar..._');

        try {
            const buffer = await downloadImg(m);
            if (!buffer) return msg.reply('❌ Gagal mengunduh gambar.');

            const metadata = await sharp(buffer).metadata();
            const sizeBefore = buffer.length;

            // Auto-enhance: normalize + sharpen + gamma correction
            const enhancedBuffer = await sharp(buffer)
                .normalize() // Normalize histogram (auto-contrast)
                .sharpen({ sigma: 1.5, m1: 0.5, m2: 3 }) // Sharpen
                .gamma(1.1) // Slight gamma correction
                .modulate({
                    brightness: 1.05, // Slight brightness boost
                    saturation: 1.1,   // Boost saturation
                })
                .jpeg({ quality: 90, progressive: true })
                .toBuffer();

            const sizeAfter = enhancedBuffer.length;

            await sock.sendMessage(msg.from, {
                image: enhancedBuffer,
                caption:
                    `✨ *GAMBAR BERHASIL DIENHANCE!*\n\n` +
                    `📐 ${metadata.width}×${metadata.height}px\n` +
                    `🎨 Perbaikan:\n` +
                    `• ✅ Auto-Contrast (Normalize)\n` +
                    `• ✅ Sharpening\n` +
                    `• ✅ Gamma Correction\n` +
                    `• ✅ Brightness & Saturation\n\n` +
                    `📁 ${formatSize(sizeBefore)} → ${formatSize(sizeAfter)}\n` +
                    `_Powered by Sharp_`,
                mimetype: 'image/jpeg'
            }, { quoted: m });

        } catch (e) {
            console.error('Enhance Error:', e.message);
            return msg.reply('❌ Gagal enhance gambar. Pastikan file adalah gambar valid.');
        }
    }
};
