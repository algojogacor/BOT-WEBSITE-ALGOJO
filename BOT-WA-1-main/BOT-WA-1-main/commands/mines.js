const { saveDB } = require('../helpers/database');

// Session sementara
const sessions = {};

// TABEL MULTIPLIER 
// Index 0 = Awal, Index 1 = 1 Kotak
const MULTIPLIERS = [1.0, 1.3, 1.6, 2.0, 2.5, 3.2, 4.0, 5.5, 7.5, 10.0, 15.0, 25.0, 50.0];

// Helper ambil multi
const getMulti = (step) => {
    if (step < 0) return 0;
    if (step >= MULTIPLIERS.length) return MULTIPLIERS[MULTIPLIERS.length - 1];
    return MULTIPLIERS[step];
};

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['mines', 'bom', 'gali', 'open', 'stop', 'cashout', 'nyerah'];
    if (!validCommands.includes(command)) return;

    const senderId = msg.author || msg.key.remoteJid;

    // 1. MULAI GAME (!bom <taruhan>)
    if (command === 'mines' || command === 'bom') {
        if (sessions[senderId]) {
            return msg.reply("❌ Kamu masih punya sesi permainan aktif!\nKetik `!gali <angka>` atau `!stop`.");
        }

        const bet = parseInt(args[0]);
        if (isNaN(bet) || bet < 1000) return msg.reply("❌ Minimal taruhan 💰1.000");
        if (user.balance < bet) return msg.reply("❌ Uang kurang bos!");

        // Kurangi saldo di awal
        user.balance -= bet;
        saveDB(db);

        // Generate Posisi Bom
        // 🎉 EVENT: Winrate Gila — jumlah bom dikurangi dari 3 jadi 1
        const winrateGilaAktif = db.settings?.winrateGila && Date.now() < db.settings.winrateGilaUntil;
        const totalBom = winrateGilaAktif ? 1 : 3;

        const bombs = [];
        while (bombs.length < totalBom) {
            const r = Math.floor(Math.random() * 12) + 1;
            if (!bombs.includes(r)) bombs.push(r);
        }

        sessions[senderId] = {
            bet: bet,
            currentWin: bet,
            multiplier: 1.0,
            opened: [],
            bombs: bombs
        };

        let txt = `💣 *TEBAK BOM DIMULAI* 💣\n`;
        txt += `💰 Taruhan: Rp ${bet.toLocaleString('id-ID')}\n`;
        if (winrateGilaAktif) txt += `🎉 *EVENT WINRATE GILA! Hanya ${totalBom} Bom!*\n`;
        txt += `\n📦 *PILIH KOTAK (1-12)*:\n`;
        txt += `[1] [2] [3] [4]\n[5] [6] [7] [8]\n[9] [10] [11] [12]\n\n`;
        txt += `⚠️ Ada *3 BOM* tersembunyi.\n`;
        txt += `💡 *Fitur Asuransi:* Jika sudah buka 3 kotak lalu meledak, kamu tetap dapat sebagian uang!\n`;
        txt += `⛏️ Ketik: \`!gali <angka>\``;

        return msg.reply(txt);
    }

    const ses = sessions[senderId];
    if (!ses) return msg.reply("❌ Kamu belum main. Ketik `!bom <jumlah>` dulu.");

    // 2. GALI KOTAK (!gali <angka>)
    if (command === 'gali' || command === 'open') {
        const pick = parseInt(args[0]);
        if (isNaN(pick) || pick < 1 || pick > 12) return msg.reply("❌ Pilih angka 1 sampai 12.");
        if (ses.opened.includes(pick)) return msg.reply("❌ Kotak ini sudah dibuka.");

        // --- SKENARIO KENA BOM ---
        if (ses.bombs.includes(pick)) {
            const streak = ses.opened.length; // Jumlah kotak yg berhasil dibuka sebelumnya
            delete sessions[senderId]; // Hapus sesi
            
            let txt = `💥 *BOOOOM!!!* 💥\n`;
            txt += `Kamu menginjak ranjau di kotak *${pick}*.\n`;
            txt += `💣 Lokasi Bom: ${ses.bombs.join(', ')}\n\n`;

            // Minimal sudah sukses buka 3 kotak dapat hadiah hiburan
            if (streak >= 3) {
                const saveStep = streak - 2; // Mundur 2 langkah
                const saveMulti = getMulti(saveStep); // Ambil multiplier langkah tsb
                
                const rawPrize = Math.floor(ses.bet * saveMulti);
                const tax = Math.floor(rawPrize * 0.05); // Pajak 5%
                const finalPrize = rawPrize - tax;

                user.balance += finalPrize;
                user.dailyIncome = (user.dailyIncome || 0) + finalPrize;
                saveDB(db);

                txt += `🚑 *ASURANSI CAIR!* 🚑\n`;
                txt += `Karena kamu sudah sampai tahap ${streak}, kamu tidak rugi total.\n`;
                txt += `🔙 Mundur ke Tahap ${saveStep} (x${saveMulti})\n`;
                txt += `💸 Hadiah Hiburan: Rp ${finalPrize.toLocaleString('id-ID')}\n`;
                txt += `📉 _(Dipotong pajak admin 5%)_`;
            } else {
                // Kalau baru buka 0-2 kotak udah meledak, ya nasib.
                txt += `💸 Uang Taruhan: Rp ${ses.bet.toLocaleString('id-ID')} *HANGUS*.\n`;
                txt += `_Belum sampai tahap aman (3 kotak). Coba lagi!_ 💀`;
            }
            
            return msg.reply(txt);
        } else {
            // --- SKENARIO AMAN ---
            ses.opened.push(pick);
            
            const totalOpened = ses.opened.length;
            const multi = getMulti(totalOpened); 

            ses.multiplier = multi;
            ses.currentWin = Math.floor(ses.bet * multi);

            // Tampilan Grid
            let grid = "";
            for (let i = 1; i <= 12; i++) {
                if (ses.opened.includes(i)) grid += "[✅] ";
                else grid += `[${i}] `;
                if (i % 4 === 0) grid += "\n";
            }

            let txt = `✅ *AMAN!* (x${multi.toFixed(1)})\n\n`;
            txt += grid + "\n";
            txt += `💰 Uang Sekarang: *Rp ${ses.currentWin.toLocaleString('id-ID')}*\n`;
            
            // Info Asuransi
            if (totalOpened === 2) txt += `💡 _Satu lagi aman, fitur Asuransi aktif!_\n`;
            else if (totalOpened >= 3) txt += `🛡️ _Asuransi Aktif (Aman sebagian)_\n`;

            txt += `⛏️ Lanjut gali? Ketik \`!gali <angka>\`\n`;
            txt += `🛑 Ambil uang? Ketik \`!stop\``;

            sessions[senderId] = ses;
            return msg.reply(txt);
        }
    }

    // 3. STOP / AMBIL DUIT (!stop)
    if (command === 'stop' || command === 'cashout' || command === 'nyerah') {
        if (ses.opened.length === 0) return msg.reply("❌ Belum gali satupun kok udah nyerah? Minimal gali 1 kotak.");

        user.balance += ses.currentWin;
        user.dailyIncome = (user.dailyIncome || 0) + ses.currentWin;
        saveDB(db);
        
        delete sessions[senderId];

        let txt = `🛑 *CASHOUT BERHASIL* 🛑\n\n`;
        txt += `Keputusan bijak! Uang diamankan.\n`;
        txt += `💰 Total Dapat: *Rp ${ses.currentWin.toLocaleString('id-ID')}*\n`;
        txt += `📈 Profit Bersih: Rp ${(ses.currentWin - ses.bet).toLocaleString('id-ID')}`;

        return msg.reply(txt);
    }
};
