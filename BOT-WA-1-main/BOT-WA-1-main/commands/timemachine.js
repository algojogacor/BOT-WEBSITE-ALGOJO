module.exports = async (command, args, msg, user, db, sock) => {
    // Command trigger: !timemachine, !flashback, !dejavu
    if (command !== 'timemachine' && command !== 'flashback' && command !== 'dejavu') return;

    const chatId = msg.key.remoteJid;

    // 1. Cek Database
    if (!db.chatLogs || !db.chatLogs[chatId] || db.chatLogs[chatId].length === 0) {
        return msg.reply("❌ Bot belum punya ingatan masa lalu di grup ini.\nBot baru mulai merekam sekarang...");
    }

    const logs = db.chatLogs[chatId];
    let anchorTimestamp = null;
    let mode = "random"; // random | navigation

    // 2. Tentukan "Titik Tengah" (Anchor Time)
    // Jika user mengirim command dengan angka (cth: !timemachine 170928392), itu berarti mode navigasi
    if (args && args.length > 0 && !isNaN(args[0])) {
        anchorTimestamp = parseInt(args[0]);
        mode = "navigation";
    } else {
        // Mode Random: Cari pesan yang jamnya mirip dengan SEKARANG tapi di masa lalu
        const now = new Date();
        const currentMins = (now.getHours() * 60) + now.getMinutes();
        const RENTANG = 30; // +/- 30 Menit toleransi pencarian
        const oneDay = 24 * 60 * 60 * 1000;

        const candidates = logs.filter(log => {
            const logDate = new Date(log.t);
            const diffTime = now - logDate;

            // Syarat: Minimal 20 jam yang lalu
            if (diffTime < (oneDay - (4 * 60 * 60 * 1000))) return false;

            // Syarat: Jam mirip
            const logMins = (logDate.getHours() * 60) + logDate.getMinutes();
            const diff = Math.abs(currentMins - logMins);
            return diff <= RENTANG || diff >= (1440 - RENTANG);
        });

        if (candidates.length === 0) {
            return msg.reply("🕰️ *Time Machine Kosong*\nPada jam segini di masa lalu, grup ini sepi.");
        }

        // Ambil 1 pesan random sebagai jangkar
        const memory = candidates[Math.floor(Math.random() * candidates.length)];
        anchorTimestamp = memory.t;
    }

    // 3. Ambil Konteks (1 Jam Belakang s/d 1 Jam Depan dari Anchor)
    const ONE_HOUR = 60 * 60 * 1000;
    const startTime = anchorTimestamp - ONE_HOUR;
    const endTime = anchorTimestamp + ONE_HOUR;

    // Filter semua pesan dalam rentang waktu tersebut
    const contextMessages = logs.filter(m => m.t >= startTime && m.t <= endTime);
    
    // Urutkan dari yang terlama ke terbaru
    contextMessages.sort((a, b) => a.t - b.t);

    if (contextMessages.length === 0) {
        return msg.reply("❌ Data chat pada jam tersebut tidak ditemukan/rusak.");
    }

    // 4. Format Output
    // Ambil tanggal dari anchor untuk judul
    const anchorDate = new Date(anchorTimestamp);
    const dateStr = anchorDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const startStr = new Date(startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const endStr = new Date(endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let txt = `🕰️ *TIME MACHINE* 🕰️\n`;
    txt += `📅 ${dateStr}\n`;
    txt += `⏰ Arsip Pukul: ${startStr} - ${endStr}\n`;
    txt += `──────────────────\n\n`;

    // Loop pesan
    contextMessages.forEach(m => {
        const t = new Date(m.t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        // Membatasi panjang pesan agar tidak spamming jika ada text panjang
        let content = m.m;
        if (content.length > 100) content = content.substring(0, 97) + "...";
        
        txt += `[${t}] *${m.u}*: ${content}\n`;
    });

    txt += `\n──────────────────\n`;
    
    // 5. Buat Navigasi (Maju/Mundur 1 Jam)
    // Kita geser anchornya 1 jam ke belakang atau ke depan
    const prevAnchor = anchorTimestamp - ONE_HOUR;
    const nextAnchor = anchorTimestamp + ONE_HOUR;

    txt += `*Navigasi Waktu:*\n`;
    txt += `⬅️ Ketik: *${command} ${prevAnchor}* (Mundur 1 jam)\n`;
    txt += `➡️ Ketik: *${command} ${nextAnchor}* (Maju 1 jam)\n`;
    txt += `🎲 Ketik: *${command}* (Cari momen lain)`;

    return msg.reply(txt);
};
