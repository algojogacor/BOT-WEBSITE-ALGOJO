const axios = require('axios');
const { saveDB } = require('../helpers/database'); // PENTING: Import saveDB
const https = require('https');

// Pengaman SSL
const agent = new https.Agent({  
    rejectUnauthorized: false 
});

// Sesi disimpan di Map agar persisten
const gameSessions = new Map();

module.exports = async (command, args, msg, user, db, body) => {
    const chatId = msg.from;
    const senderId = msg.author || msg.from; // ID Pengirim (Bisa kamu atau teman)

    // --- 1. FITUR NYERAH ---
    if (command === 'nyerah') {
        if (gameSessions.has(chatId)) {
            const game = gameSessions.get(chatId);
            const jawabanBenar = game.jawaban;
            gameSessions.delete(chatId);
            return msg.reply(`🏳️ *MENYERAH!*\n\nJawaban yang benar: *${jawabanBenar.toUpperCase()}*`);
        }
        return msg.reply("❌ Tidak ada game aktif.");
    }

    // --- 2. FITUR HINT ---
    if (command === 'hint') {
        if (gameSessions.has(chatId)) {
            const game = gameSessions.get(chatId);
            const jwb = game.jawaban.trim();
            // Tampilkan huruf awal & akhir, sensor tengahnya
            let hint = jwb[0] + jwb.slice(1, -1).replace(/[a-zA-Z]/g, '_') + jwb.slice(-1);
            return msg.reply(`💡 *HINT:* \`${hint.toUpperCase()}\``);
        }
        return msg.reply("❌ Game belum dimulai.");
    }

    // --- 3. LOGIKA JAWAB (SISTEM REBUTAN) ---
    // Logika ini jalan jika TIDAK ada command (pesan biasa) DAN ada sesi game
    if (!command && gameSessions.has(chatId)) {
        const game = gameSessions.get(chatId);
        
        // Normalisasi jawaban (kecilkan huruf & hapus spasi berlebih)
        const jawabanUser = body.toLowerCase().trim();
        const kunciJawaban = game.jawaban.toLowerCase().trim();

        if (jawabanUser === kunciJawaban) {
            // -- PERBAIKAN: Pastikan Pemenang Ada di Database --
            // Jika temanmu baru pertama kali chat, dia mungkin belum ada di db.users
            // Kita inisialisasi manual di sini agar tidak error.
            if (!db.users[senderId]) {
                db.users[senderId] = { 
                    balance: 0, xp: 0, level: 1, crypto: {}, 
                    quest: { daily: [], lastReset: new Date().toISOString().split("T")[0] } 
                };
            }

            // Ambil objek user pemenang langsung dari DB (Bukan variabel 'user' dari parameter fungsi)
            // Ini menjamin saldo masuk ke orang yang menjawab, bukan yang memulai game.
            const winner = db.users[senderId];

            winner.balance += 150;
            winner.xp += 50;
            
            // PENTING: Simpan ke database JSON
            saveDB(db); 
            
            gameSessions.delete(chatId); // Hapus sesi
            
            return msg.reply(`🎉 *JAWABAN BENAR!*\n\nPemenang: @${senderId.split('@')[0]}\n💰 Hadiah: *150 Koin* & ✨ *50 XP*`, null, { mentions: [senderId] });
        }
        return; // Jawaban salah, diam saja (biar chat tidak spam)
    }

    // --- 4. MEMULAI GAME ---
    const gameCommands = ['tebakgambar', 'asahotak', 'susunkata'];
    if (!gameCommands.includes(command)) return;

    if (gameSessions.has(chatId)) {
        return msg.reply("⚠️ Masih ada soal belum terjawab! Jawab dulu atau ketik *!nyerah*.");
    }

    try {
        let soal, jawaban, media;
        const config = { timeout: 10000, httpsAgent: agent }; // Timeout dinaikkan ke 10s

        if (command === 'tebakgambar') {
            const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json', config);
            const item = res.data[Math.floor(Math.random() * res.data.length)];
            soal = "Tebak gambar apakah ini?";
            jawaban = item.jawaban;
            media = await MessageMedia.fromUrl(item.img);
        } 
        else if (command === 'asahotak') {
            const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/asahotak.json', config);
            const item = res.data[Math.floor(Math.random() * res.data.length)];
            soal = `🧠 *ASAH OTAK*\n\n"${item.soal}"`;
            jawaban = item.jawaban;
        } 
        else if (command === 'susunkata') {
            const res = await axios.get('https://raw.githubusercontent.com/BochilTeam/database/master/games/susunkata.json', config);
            const item = res.data[Math.floor(Math.random() * res.data.length)];
            soal = `🔠 *SUSUN KATA*\n\nSoal: *${item.soal}*\nTipe: ${item.tipe}`;
            jawaban = item.jawaban;
        }

        // Simpan Jawaban
        gameSessions.set(chatId, { jawaban: jawaban.trim() });

        // Kirim Soal
        if (media) {
            await msg.reply(media, chatId, { caption: `${soal}\n\n_Balas pesan ini untuk menjawab!_` });
        } else {
            await msg.reply(`${soal}\n\n_Balas pesan ini untuk menjawab!_`);
        }

    } catch (e) {
        console.error("Game Error:", e.message);
        gameSessions.delete(chatId);
        msg.reply("❌ Gagal mengambil soal (Server Error). Coba lagi nanti.");
    }
};