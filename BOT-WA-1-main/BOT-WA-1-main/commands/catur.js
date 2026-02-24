module.exports = async function(command, args, msg, user, db, sock) {
    if (command !== 'catur') return;
    const sender = msg.author || msg.from; 
    
    // 1. Validasi Taruhan
    const bet = parseInt(args[0]);
    if (!bet || isNaN(bet) || bet < 100) {
        return msg.reply("⚠️ Masukkan taruhan minimal 100 perak.\nContoh: *!catur 1000*");
    }

    // 2. Cek Saldo User
    if (user.balance < bet) {
        return msg.reply(`❌ Uangmu kurang! Saldo: ${user.balance}, butuh: ${bet}`);
    }

    // 3. Potong Saldo
    user.balance -= bet;
    
    // 4. BUAT LINK 
    let baseUrl = process.env.APP_URL || "http://localhost:3000";
    
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    const link = `${baseUrl}/game/index.html?user=${sender}&bet=${bet}`;

    // 5. Kirim Pesan (Update Info Hadiah)
    await sock.sendMessage(msg.from, { 
        text: `🎮 *CATUR VS AI*\n\n💰 Taruhan: ${bet}\n📊 *Pilihan Mode di Web:*\n- Medium: Profit 20%\n- Hard: Profit 30%\n\n👇 *KLIK LINK BUAT MAIN:* 👇\n${link}\n\n_(Jangan refresh browser!)_`
    }, { quoted: msg });
};
