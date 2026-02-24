/**
 * KALKULATOR & KONVERSI SUPER v1.0
 * !kalk / !calc / !hitung — Kalkulator ekspresi matematika
 * !konversi — Konversi satuan (panjang, berat, suhu, mata uang)
 * !bmi — Hitung BMI
 * !cicilan — Hitung cicilan kredit
 * !persen — Hitung persentase
 * !zakat — Hitung zakat
 */
const axios = require('axios');

function safeEval(expr) {
    // Sanitize: hanya izinkan angka, operator, dan fungsi math
    const safe = expr
        .replace(/\^/g, '**')
        .replace(/[^0-9+\-*/.()%\s]/g, '');
    if (!safe.trim()) throw new Error('Ekspresi kosong');
    return Function('"use strict"; return (' + safe + ')')();
}

module.exports = async (command, args, msg, user, db, sock) => {
    const valid = ['kalk','calc','hitung','kalkulasi','konversi','convert','bmi','cicilan','kredit','persen','percent','zakat','suhu','celsius','fahrenheit'];
    if (!valid.includes(command)) return;

    const text = args.join(' ');

    // ── KALKULATOR ─────────────────────────────────────────────
    if (['kalk','calc','hitung','kalkulasi'].includes(command)) {
        if (!text) return msg.reply(
            `🔢 *KALKULATOR*\n\n` +
            `Format: \`!kalk <ekspresi>\`\n\n` +
            `*Contoh:*\n` +
            `• \`!kalk 2 + 2\`\n` +
            `• \`!kalk (15 * 8) / 3\`\n` +
            `• \`!kalk 2^10\` (pangkat)\n` +
            `• \`!kalk 15% * 500000\`\n\n` +
            `*Operator:* + - * / ^ % ()`
        );
        try {
            const result = safeEval(text);
            if (!isFinite(result)) return msg.reply('❌ Hasil tidak valid (infinite atau NaN)');
            const formatted = Number.isInteger(result) ? result.toLocaleString('id-ID') : result.toLocaleString('id-ID', { maximumFractionDigits: 8 });
            return msg.reply(`🔢 *HASIL:*\n\n\`${text}\`\n= *${formatted}*`);
        } catch(e) {
            return msg.reply(`❌ Ekspresi tidak valid: \`${text}\`\n\nContoh yang benar: \`!kalk (15 + 5) * 3\``);
        }
    }

    // ── PERSEN ─────────────────────────────────────────────────
    if (command === 'persen' || command === 'percent') {
        // Format: !persen 15 dari 500000
        // Format: !persen diskon 20 dari 800000
        const numMatch = text.match(/(\d+[\.,]?\d*)\s*(?:persen|%|dari|of)\s*(\d+[\.,]?\d*)/i) ||
                         text.match(/(\d+[\.,]?\d*)\s+(\d+[\.,]?\d*)/);
        
        if (!numMatch) return msg.reply(
            `💯 *HITUNG PERSEN*\n\n` +
            `Format:\n` +
            `• \`!persen 15 dari 500000\` → 15% dari 500.000\n` +
            `• \`!persen 500000 300000\` → berapa % 300.000 dari 500.000\n\n` +
            `Contoh: \`!persen 20 dari 250000\``
        );
        
        const a = parseFloat(numMatch[1].replace(',','.')), b = parseFloat(numMatch[2].replace(',','.'));
        let reply = `💯 *KALKULATOR PERSEN*\n\n`;
        
        if (a <= 100) {
            const result = (a / 100) * b;
            reply += `📊 ${a}% dari ${b.toLocaleString('id-ID')} = *${result.toLocaleString('id-ID', { maximumFractionDigits: 2 })}*\n`;
            reply += `🏷️ Setelah diskon ${a}%: *${(b - result).toLocaleString('id-ID', { maximumFractionDigits: 2 })}*\n`;
            reply += `📈 Setelah naik ${a}%: *${(b + result).toLocaleString('id-ID', { maximumFractionDigits: 2 })}*`;
        } else {
            const pct = (a / b * 100);
            reply += `📊 ${a.toLocaleString('id-ID')} dari ${b.toLocaleString('id-ID')}\n`;
            reply += `= *${pct.toFixed(2)}%*`;
        }
        return msg.reply(reply);
    }

    // ── BMI CALCULATOR ─────────────────────────────────────────
    if (command === 'bmi') {
        // Format: !bmi <berat> <tinggi>
        const w = parseFloat(args[0]), h = parseFloat(args[1]);
        if (!w || !h || isNaN(w) || isNaN(h)) return msg.reply(
            `⚖️ *BMI CALCULATOR*\n\n` +
            `Format: \`!bmi <berat_kg> <tinggi_cm>\`\n` +
            `Contoh: \`!bmi 65 170\`\n\n` +
            `BMI = Berat(kg) / Tinggi²(m)`
        );
        const heightM = h / 100;
        const bmi = w / (heightM * heightM);
        let kategori, emoji, saran;
        if (bmi < 18.5) { kategori = 'Kurus (Underweight)'; emoji = '🦴'; saran = 'Tingkatkan asupan kalori dan protein!'; }
        else if (bmi < 25) { kategori = 'Normal (Ideal)'; emoji = '✅'; saran = 'Pertahankan pola makan sehat!'; }
        else if (bmi < 30) { kategori = 'Gemuk (Overweight)'; emoji = '⚠️'; saran = 'Mulai diet seimbang dan olahraga rutin!'; }
        else { kategori = 'Obesitas'; emoji = '🔴'; saran = 'Konsultasi dokter untuk program penurunan berat badan!'; }
        
        return msg.reply(
            `⚖️ *HASIL BMI KAMU*\n\n` +
            `📏 Berat: ${w} kg | Tinggi: ${h} cm\n` +
            `💯 BMI: *${bmi.toFixed(1)}*\n` +
            `${emoji} Kategori: *${kategori}*\n\n` +
            `💡 Saran: ${saran}\n\n` +
            `📊 *Kategori BMI:*\n` +
            `< 18.5 = Kurus\n` +
            `18.5-24.9 = Normal ✅\n` +
            `25-29.9 = Overweight\n` +
            `≥ 30 = Obesitas`
        );
    }

    // ── CICILAN / KREDIT ────────────────────────────────────────
    if (command === 'cicilan' || command === 'kredit') {
        // Format: !cicilan <pokok> <bunga%/tahun> <tenor_bulan>
        // Contoh: !cicilan 50000000 12 24
        const pokok = parseFloat(args[0]), bungaPerTahun = parseFloat(args[1]), tenor = parseInt(args[2]);
        
        if (!pokok || !bungaPerTahun || !tenor || isNaN(pokok) || isNaN(bungaPerTahun) || isNaN(tenor)) {
            return msg.reply(
                `💳 *KALKULATOR CICILAN*\n\n` +
                `Format: \`!cicilan <pokok> <bunga%/tahun> <tenor_bulan>\`\n\n` +
                `Contoh: \`!cicilan 50000000 12 24\`\n` +
                `(Pinjaman 50jt, bunga 12%/tahun, cicilan 24 bulan)`
            );
        }
        
        const bungaPerBulan = bungaPerTahun / 100 / 12;
        const cicilan = pokok * (bungaPerBulan * Math.pow(1 + bungaPerBulan, tenor)) / (Math.pow(1 + bungaPerBulan, tenor) - 1);
        const totalBayar = cicilan * tenor;
        const totalBunga = totalBayar - pokok;
        
        return msg.reply(
            `💳 *SIMULASI CICILAN KREDIT*\n\n` +
            `🏦 Pokok Pinjaman: Rp ${pokok.toLocaleString('id-ID')}\n` +
            `📊 Bunga: ${bungaPerTahun}%/tahun (${(bungaPerTahun/12).toFixed(2)}%/bulan)\n` +
            `📅 Tenor: ${tenor} bulan (${Math.ceil(tenor/12)} tahun)\n\n` +
            `💰 *Cicilan/bulan: Rp ${Math.ceil(cicilan).toLocaleString('id-ID')}*\n` +
            `💵 Total Bayar: Rp ${Math.ceil(totalBayar).toLocaleString('id-ID')}\n` +
            `🏷️ Total Bunga: Rp ${Math.ceil(totalBunga).toLocaleString('id-ID')}\n\n` +
            `⚠️ _Simulasi saja. Bunga aktual bisa berbeda._`
        );
    }

    // ── ZAKAT ─────────────────────────────────────────────────
    if (command === 'zakat') {
        // Format: !zakat <penghasilan_bulanan>
        const penghasilan = parseFloat(args[0]);
        if (!penghasilan || isNaN(penghasilan)) return msg.reply(
            `🕌 *KALKULATOR ZAKAT*\n\n` +
            `Format: \`!zakat <penghasilan_bulanan>\`\n` +
            `Contoh: \`!zakat 5000000\`\n\n` +
            `Menghitung zakat penghasilan/maal.`
        );
        
        // Nisab = 85 gram emas (harga emas ~1.1 juta/gram = ~93.5 juta)
        const hargaEmasPerGram = 1100000;
        const nisabEmas = 85 * hargaEmasPerGram;
        const zakatPenghasilan = penghasilan * 0.025; // 2.5%
        const penghasilanTahunan = penghasilan * 12;
        const wajibZakat = penghasilanTahunan >= nisabEmas;
        
        return msg.reply(
            `🕌 *KALKULATOR ZAKAT PENGHASILAN*\n\n` +
            `💰 Penghasilan/bulan: Rp ${penghasilan.toLocaleString('id-ID')}\n` +
            `📅 Penghasilan/tahun: Rp ${penghasilanTahunan.toLocaleString('id-ID')}\n\n` +
            `📏 Nisab (85 gr emas): Rp ${nisabEmas.toLocaleString('id-ID')}\n` +
            `${wajibZakat ? '✅' : '❌'} Status: *${wajibZakat ? 'WAJIB ZAKAT' : 'Belum wajib zakat (di bawah nisab)'}*\n\n` +
            (wajibZakat ? 
                `💸 *Zakat/bulan (2.5%): Rp ${zakatPenghasilan.toLocaleString('id-ID')}*\n` +
                `💸 Zakat/tahun: Rp ${(zakatPenghasilan * 12).toLocaleString('id-ID')}\n\n` +
                `_Bayarkan zakat setiap bulan atau sekaligus per tahun._` : 
                `_Lanjutkan menabung & berbagi meski belum wajib zakat!_`
            ) + `\n\n⚠️ _Konsultasi ulama untuk perhitungan yang tepat._`
        );
    }

    // ── KONVERSI SATUAN ────────────────────────────────────────
    if (command === 'konversi' || command === 'convert') {
        if (!text) return msg.reply(
            `🔄 *KONVERSI SATUAN*\n\n` +
            `Format: \`!konversi <nilai> <dari> ke <ke>\`\n\n` +
            `*Panjang:* km, m, cm, mm, inch, ft, mile, yard\n` +
            `*Berat:* kg, g, mg, lb, oz, ton\n` +
            `*Suhu:* celsius, fahrenheit, kelvin\n` +
            `*Volume:* liter, ml, gallon, oz\n` +
            `*Data:* gb, mb, kb, tb, byte\n\n` +
            `*Contoh:*\n` +
            `\`!konversi 5 km ke mile\`\n` +
            `\`!konversi 100 celsius ke fahrenheit\`\n` +
            `\`!konversi 70 kg ke lb\``
        );

        const match = text.match(/^([\d.,]+)\s+(\w+)\s+(?:ke|to)\s+(\w+)$/i);
        if (!match) return msg.reply('❌ Format: `!konversi <nilai> <dari> ke <ke>`\nContoh: `!konversi 5 km ke mile`');

        const value = parseFloat(match[1].replace(',', '.'));
        const from = match[2].toLowerCase();
        const to = match[3].toLowerCase();

        const conversions = {
            // Length (base: meter)
            km: 1000, m: 1, cm: 0.01, mm: 0.001, inch: 0.0254, ft: 0.3048, foot: 0.3048, feet: 0.3048, mile: 1609.344, yard: 0.9144,
            // Weight (base: gram)
            kg: 1000, g: 1, mg: 0.001, lb: 453.592, oz: 28.3495, ton: 1000000,
            // Volume (base: liter)
            liter: 1, l: 1, ml: 0.001, gallon: 3.78541, quart: 0.946353, pint: 0.473176,
            // Data (base: byte)
            byte: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776,
        };

        // Suhu — handle khusus
        const suhuMap = {celsius:['c','celsius','celcius'], fahrenheit:['f','fahrenheit','fahrenheit'], kelvin:['k','kelvin']};
        const isSuhu = Object.values(suhuMap).some(a => a.includes(from)) && Object.values(suhuMap).some(a => a.includes(to));
        
        if (isSuhu) {
            let result;
            const fromN = Object.entries(suhuMap).find(([k,v]) => v.includes(from))?.[0];
            const toN = Object.entries(suhuMap).find(([k,v]) => v.includes(to))?.[0];
            let inCelsius = fromN === 'celsius' ? value : fromN === 'fahrenheit' ? (value - 32) * 5/9 : value - 273.15;
            result = toN === 'celsius' ? inCelsius : toN === 'fahrenheit' ? inCelsius * 9/5 + 32 : inCelsius + 273.15;
            return msg.reply(`🌡️ *KONVERSI SUHU*\n\n${value} ${from} = *${result.toFixed(2)} ${to}*`);
        }

        if (!conversions[from] || !conversions[to]) return msg.reply(`❌ Satuan tidak dikenal: \`${from}\` atau \`${to}\`\n\nGunakan: \`!konversi\` untuk lihat satuan yang tersedia.`);

        // Deteksi kategori (harus satuan yang sama)
        const lengthUnits = ['km','m','cm','mm','inch','ft','foot','feet','mile','yard'];
        const weightUnits = ['kg','g','mg','lb','oz','ton'];
        const volumeUnits = ['liter','l','ml','gallon','quart','pint'];
        const dataUnits = ['byte','kb','mb','gb','tb'];
        
        const getCategory = (unit) => {
            if (lengthUnits.includes(unit)) return 'length';
            if (weightUnits.includes(unit)) return 'weight';
            if (volumeUnits.includes(unit)) return 'volume';
            if (dataUnits.includes(unit)) return 'data';
            return null;
        };

        if (getCategory(from) !== getCategory(to)) return msg.reply(`❌ Tidak bisa konversi ${from} ke ${to}! Satuan harus kategori yang sama.`);

        const result = value * conversions[from] / conversions[to];
        const formattedResult = result >= 0.001 ? result.toLocaleString('id-ID', { maximumFractionDigits: 6 }) : result.toExponential(4);
        
        const categoryEmoji = { length:'📏', weight:'⚖️', volume:'🧊', data:'💾' };
        const emoji = categoryEmoji[getCategory(from)] || '🔄';
        
        return msg.reply(`${emoji} *HASIL KONVERSI*\n\n${value.toLocaleString('id-ID')} ${from} = *${formattedResult} ${to}*`);
    }
};
