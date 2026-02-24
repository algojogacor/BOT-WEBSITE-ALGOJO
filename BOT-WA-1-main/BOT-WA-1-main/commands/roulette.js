const { saveDB } = require('../helpers/database');

module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['roulette', 'rolet', 'rl'];
    if (!validCommands.includes(command)) return;

    // Cara main: !rolet <pilihan> <taruhan>
    // Pilihan: 0-36, merah, hitam, ganjil, genap
    
    const choice = args[0]?.toLowerCase();
    const betRaw = args[1];

    if (!choice || !betRaw) {
        let txt = `🎰 *ROULETTE KASINO* 🎰\n`;
        txt += `_Game keberuntungan para Sultan_\n\n`;
        txt += `📜 *JENIS TARUHAN:*\n`;
        txt += `🔴 *Warna:* \`!rolet merah 1000\` (x2)\n`;
        txt += `⚫ *Warna:* \`!rolet hitam 1000\` (x2)\n`;
        txt += `🔢 *Angka (0-36):* \`!rolet 7 1000\` (x15 🔥)\n`; // <--- UPDATE TEXT
        txt += `⚖️ *Genap/Ganjil:* \`!rolet ganjil 1000\` (x2)\n\n`;
        txt += `🎯 *Tips:* Tebak angka (0-36) untuk hadiah 15x lipat!`;
        return msg.reply(txt);
    }

    // Parsing Taruhan
    let bet = 0;
    if (betRaw.toLowerCase() === 'all') {
        bet = Math.floor(user.balance);
    } else {
        bet = parseInt(betRaw);
    }

    // Validasi
    if (isNaN(bet) || bet < 1000) return msg.reply("❌ Minimal taruhan 💰1.000");
    if (user.balance < bet) return msg.reply("❌ Uang kurang bos! Jangan maksa.");

    // Kurangi saldo dulu
    user.balance -= bet;
    saveDB(db);

    // --- PUTAR RODA ROULETTE ---
    // 🎉 EVENT: Winrate Gila — paksa hasil sesuai pilihan user (85% chance menang)
    const winrateGilaAktif = db.settings?.winrateGila && Date.now() < db.settings.winrateGilaUntil;
    const reds = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    const blacks = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

    let resultNum;
    if (winrateGilaAktif && Math.random() < 0.85) {
        const parsed = parseInt(choice);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 36) {
            resultNum = parsed; // tebak angka → paksa keluar
        } else if (choice === 'merah' || choice === 'red') {
            resultNum = reds[Math.floor(Math.random() * reds.length)];
        } else if (choice === 'hitam' || choice === 'black') {
            resultNum = blacks[Math.floor(Math.random() * blacks.length)];
        } else if (choice === 'ganjil' || choice === 'odd') {
            const ganjil = [1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31,33,35];
            resultNum = ganjil[Math.floor(Math.random() * ganjil.length)];
        } else if (choice === 'genap' || choice === 'even') {
            const genap = [2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36];
            resultNum = genap[Math.floor(Math.random() * genap.length)];
        } else {
            resultNum = Math.floor(Math.random() * 37);
        }
    } else {
        resultNum = Math.floor(Math.random() * 37); // Normal (non-event atau 15% bad luck)
    }
    
    // Tentukan Warna & Sifat
    // 0 = Hijau | Angka Merah & Hitam sudah didefinisikan di atas (event block)
    let color = 'hijau'; // Default 0
    let type = 'netral'; // 0 itu bukan ganjil/genap dalam roulette

    if (resultNum !== 0) {
        if (reds.includes(resultNum)) color = 'merah';
        else color = 'hitam';

        if (resultNum % 2 === 0) type = 'genap';
        else type = 'ganjil';
    }

    // Tentukan Icon
    let icon = '🟢';
    if (color === 'merah') icon = '🔴';
    if (color === 'hitam') icon = '⚫';

    // --- CEK KEMENANGAN ---
    let win = false;
    let multiplier = 0;

    // 1. Tebak Angka Spesifik (x15) <--- LOGIKA BARU
    if (parseInt(choice) === resultNum) {
        win = true;
        multiplier = 15;
    }
    // 2. Tebak Warna (x2)
    else if (choice === color) {
        win = true;
        multiplier = 2;
    }
    // 3. Tebak Ganjil/Genap (x2)
    else if (choice === type) {
        win = true;
        multiplier = 2;
    }
    // 4. Tebak Even/Odd (Bahasa Inggris)
    else if ((choice === 'even' && type === 'genap') || (choice === 'odd' && type === 'ganjil')) {
        win = true;
        multiplier = 2;
    }
    // 5. Tebak Red/Black (Bahasa Inggris)
    else if ((choice === 'red' && color === 'merah') || (choice === 'black' && color === 'hitam')) {
        win = true;
        multiplier = 2;
    }

    // --- HASIL ---
    let txt = `🎰 *BOLA BERPUTAR...* 🎰\n\n`;
    txt += `Hasil: ${icon} *[ ${resultNum} ]*\n`;
    txt += `Sifat: ${color.toUpperCase()} | ${type.toUpperCase()}\n\n`;

    if (win) {
        const prize = bet * multiplier;
        const tax = Math.floor(prize * 0.05); // Pajak 5%
        const finalPrize = prize - tax;

        user.balance += finalPrize;
        user.dailyIncome = (user.dailyIncome || 0) + finalPrize;
        saveDB(db);

        txt += `🎉 *JACKPOT!!* Tebakanmu benar!\n`;
        txt += `💰 Win Rate: x${multiplier}\n`;
        txt += `💸 Total Dapat: Rp ${finalPrize.toLocaleString('id-ID')}\n`;
        if (multiplier === 15) txt += `🔥 *SULTAN MENDADAK!!* 🔥`;
        if (winrateGilaAktif) txt += `\n🎉 *EVENT WINRATE GILA AKTIF!*`;
    } else {
        txt += `❌ *ZONK!* Kamu kalah.\n`;
        txt += `💸 Uang Rp ${bet.toLocaleString('id-ID')} dimakan bandar.`;
    }

    return msg.reply(txt);
};
