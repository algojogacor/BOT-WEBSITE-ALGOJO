const { saveDB } = require('../helpers/database');
const axios = require('axios'); 

// HELPER FORMAT ANGKA
const fmt = (num) => Math.floor(Number(num)).toLocaleString('id-ID');

module.exports = async (command, args, msg, user, db) => {
    // 1. DAFTAR MATA UANG YANG TERSEDIA (Kode harus huruf kecil)
    const CURRENCIES = ['usd', 'eur', 'sgd', 'myr', 'jpy', 'gbp', 'cny', 'sar', 'aud', 'emas'];
    
    // 2. GENERATE VALID COMMANDS OTOMATIS (!beliusd, !jualsgd, dll)
    const validCommands = ['valas', 'kurs', 'forex', 'belivalas', 'jualvalas', 'aset', 'dompetvalas'];
    CURRENCIES.forEach(c => {
        validCommands.push(`beli${c}`);
        validCommands.push(`jual${c}`);
    });

    if (!validCommands.includes(command)) return;

    // INIT DATABASE USER (Dinamis sesuai daftar CURRENCIES)
    if (!user.forex) user.forex = {};
    CURRENCIES.forEach(c => {
        if (typeof user.forex[c] === 'undefined') user.forex[c] = 0;
    });
    
    // INIT DATABASE PASAR (Fallback jika API error)
    const defaultPrices = { usd: 16200, eur: 17500, sgd: 12000, myr: 3400, jpy: 110, gbp: 20000, cny: 2200, sar: 4300, aud: 10500, emas: 1350000 };
    if (!db.market.forex) db.market.forex = { ...defaultPrices }; 
    else {
        // Pastikan mata uang baru ikut masuk ke database lama
        CURRENCIES.forEach(c => {
            if (!db.market.forex[c]) db.market.forex[c] = defaultPrices[c];
        });
    }
    if (!db.market.lastForexUpdate) db.market.lastForexUpdate = 0;

    const now = Date.now();
    const UPDATE_INTERVAL = 15 * 60 * 1000; // Update tiap 15 Menit

    // ============================================================
    // 🌐 FETCH REAL DATA (ER-API & CoinGecko)
    // ============================================================
    if (now - db.market.lastForexUpdate > UPDATE_INTERVAL) {
        try {
            // 1. Ambil Kurs Mata Uang dari ER-API
            const forexRes = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 8000 });
            const rates = forexRes.data.rates;
            const idr = rates.IDR;

            db.market.forex.usd = Math.round(idr);
            db.market.forex.eur = Math.round(idr / rates.EUR);
            db.market.forex.sgd = Math.round(idr / rates.SGD);
            db.market.forex.myr = Math.round(idr / rates.MYR);
            db.market.forex.jpy = Math.round(idr / rates.JPY);
            db.market.forex.gbp = Math.round(idr / rates.GBP);
            db.market.forex.cny = Math.round(idr / rates.CNY);
            db.market.forex.sar = Math.round(idr / rates.SAR);
            db.market.forex.aud = Math.round(idr / rates.AUD);

            // 2. Ambil Harga Emas dari CoinGecko (PAX-Gold)
            try {
                const goldRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=idr', { timeout: 8000 });
                if (goldRes.data['pax-gold']?.idr) {
                    const pricePerOunce = goldRes.data['pax-gold'].idr;
                    db.market.forex.emas = Math.floor(pricePerOunce / 31.1035); // Konversi Ounce ke Gram
                }
            } catch (goldErr) {
                console.error("⚠️ Gagal update harga emas, pakai harga lama.");
            }

            db.market.lastForexUpdate = now;
            saveDB(db);
            console.log("✅ Bursa Valas Updated:", db.market.forex);
        } catch (err) {
            console.error("⚠️ Gagal update bursa valas:", err.message);
        }
    }

    // ============================================================
    // 📉 CEK KURS REAL-TIME (!kurs)
    // ============================================================
    if (command === 'valas' || command === 'kurs' || command === 'forex') {
        let txt = `📉 *BURSA VALAS REAL-TIME* 📈\n\n`;

        const m = db.market.forex;
        
        txt += `🇺🇸 *USD*: Rp ${fmt(m.usd)} / lembar\n`;
        txt += `🇪🇺 *EUR*: Rp ${fmt(m.eur)} / lembar\n`;
        txt += `🇸🇬 *SGD*: Rp ${fmt(m.sgd)} / lembar\n`;
        txt += `🇲🇾 *MYR*: Rp ${fmt(m.myr)} / lembar\n`;
        txt += `🇯🇵 *JPY*: Rp ${fmt(m.jpy)} / yen\n`;
        txt += `🇬🇧 *GBP*: Rp ${fmt(m.gbp)} / lembar\n`;
        txt += `🇨🇳 *CNY*: Rp ${fmt(m.cny)} / yuan\n`;
        txt += `🇸🇦 *SAR*: Rp ${fmt(m.sar)} / riyal\n`;
        txt += `🇦🇺 *AUD*: Rp ${fmt(m.aud)} / lembar\n`;
        txt += `🥇 *XAU*: Rp ${fmt(m.emas)} / gram (Emas)\n\n`;

        txt += `💡 *Cara Beli:* \`!beliusd 10\` atau \`!beliemas 5\``;
        
        const lastUp = Math.floor((now - db.market.lastForexUpdate) / 60000);
        txt += `\n_Updated: ${lastUp} menit yang lalu_`;
        
        return msg.reply(txt);
    }

    // ============================================================
    // 💼 CEK ASET (!aset)
    // ============================================================
    if (command === 'aset' || command === 'dompetvalas') {
        let txt = `💼 *PORTOFOLIO INVESTASI* 💼\n`;
        txt += `👤 Investor: *${user.name || 'Warga'}*\n\n`;

        let totalValuation = 0;
        const prices = db.market.forex;
        const flags = { usd: '🇺🇸 USD', eur: '🇪🇺 EUR', sgd: '🇸🇬 SGD', myr: '🇲🇾 MYR', jpy: '🇯🇵 JPY', gbp: '🇬🇧 GBP', cny: '🇨🇳 CNY', sar: '🇸🇦 SAR', aud: '🇦🇺 AUD', emas: '🥇 Emas' };

        let hasAsset = false;
        for (const c of CURRENCIES) {
            if (user.forex[c] > 0) {
                let val = user.forex[c] * prices[c];
                let satuan = c === 'emas' ? 'g' : '';
                txt += `${flags[c]}: ${fmt(user.forex[c])}${satuan} (Rp ${fmt(val)})\n`;
                totalValuation += val;
                hasAsset = true;
            }
        }

        if (!hasAsset) txt += "_Kamu belum punya investasi._\n";
        
        txt += `\n💰 *Total Aset Valas: Rp ${fmt(totalValuation)}*`;
        return msg.reply(txt);
    }

    // ============================================================
    // 🛒 BELI ASET (!beli<matauang> <jumlah>)
    // ============================================================
    if (command.startsWith('beli') && command !== 'belivalas') {
        args = [command.replace('beli', ''), args[0]];
        command = 'belivalas';
    }

    if (command === 'belivalas') {
        const code = args[0]?.toLowerCase();
        const qty = parseFloat(args[1]); 

        if (!code || !db.market.forex[code]) return msg.reply("❌ Aset tidak valid. Cek `!kurs`");
        if (isNaN(qty) || qty <= 0) return msg.reply("❌ Masukkan jumlah yang valid.");

        const price = db.market.forex[code];
        const totalCost = Math.floor(price * qty);

        if (user.balance < totalCost) return msg.reply(`❌ Uang kurang! Butuh Rp ${fmt(totalCost)}.`);

        user.balance -= totalCost;
        if (!user.forex) user.forex = {}; 
        user.forex[code] = (user.forex[code] || 0) + qty;
        
        saveDB(db);
        const unit = code === 'emas' ? 'gram' : (code === 'jpy' ? 'yen' : 'lembar');
        return msg.reply(`✅ *INVESTASI SUKSES*\nMembeli ${fmt(qty)} ${unit} ${code.toUpperCase()}.\n💸 Harga Beli: Rp ${fmt(price)}\n💰 Total: Rp ${fmt(totalCost)}`);
    }

    // ============================================================
    // 💵 JUAL ASET (!jual<matauang> <jumlah>)
    // ============================================================
    if (command.startsWith('jual') && command !== 'jualvalas') {
        args = [command.replace('jual', ''), args[0]];
        command = 'jualvalas';
    }

    if (command === 'jualvalas') {
        const code = args[0]?.toLowerCase();
        let qty = args[1]; 

        if (!code || !db.market.forex[code]) return msg.reply("❌ Aset tidak valid.");
        if (!user.forex || !user.forex[code] || user.forex[code] <= 0) return msg.reply("❌ Kamu tidak punya aset ini.");

        if (qty === 'all') {
            qty = user.forex[code];
        } else {
            qty = parseFloat(qty);
        }

        if (isNaN(qty) || qty <= 0) return msg.reply("❌ Jumlah tidak valid.");
        if (user.forex[code] < qty) return msg.reply(`❌ Stok kurang! Kamu cuma punya ${fmt(user.forex[code])}.`);

        const price = db.market.forex[code];
        const totalReceive = Math.floor(price * qty);

        user.forex[code] -= qty;
        user.balance += totalReceive;
        user.dailyIncome = (user.dailyIncome || 0) + totalReceive;

        saveDB(db);
        const unit = code === 'emas' ? 'gram' : (code === 'jpy' ? 'yen' : 'lembar');
        return msg.reply(`📉 *PENJUALAN SUKSES*\nMenjual ${fmt(qty)} ${unit} ${code.toUpperCase()}.\n💵 Harga Jual: Rp ${fmt(price)}\n💰 Diterima: Rp ${fmt(totalReceive)}`);
    }
};
