/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║               WORDLE INDONESIA — Fitur 10                   ║
 * ║  !wordle       — Mulai permainan wordle baru               ║
 * ║  !wordle <kata>— Tebak kata 5 huruf                        ║
 * ║  !wordlestop   — Berhenti main                             ║
 * ║  !wordleskor   — Statistik & streak kamu                   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { saveDB } = require('../helpers/database');

// ─── Bank kata 5 huruf Bahasa Indonesia ──────────────────────
const KATA_WORDLE = [
    'apung','basmi','bukit','damai','datar','debut','delta',
    'elang','emosi','fajar','fakta','fiber','gajah','galau',
    'games','hasil','hutan','indah','ingin','janji','jarak',
    'kapal','karma','kilat','laris','layar','lemah','mandi',
    'manis','media','mewah','modal','mogok','mulia','nabak',
    'nakal','namun','nyata','obati','ojek','padat','paham',
    'pakta','pamer','pecah','peluk','pesan','pilih','pokok',
    'pulau','putar','ramai','ramai','rezki','ribet','rinci',
    'rindu','risau','robot','rusak','sabun','sadar','salah',
    'saraf','saran','sasar','sebab','sehat','sejuk','senam',
    'sendu','setan','siaga','sigap','sikap','sinyal','situs',
    'slang','solusi','sopan','suara','subuh','sulit','surya',
    'tagih','taraf','tatap','tawar','tebal','tegas','tekad',
    'tekun','teman','teras','terus','tiket','timur','tiruan',
    'tobat','tokoh','total','tulus','turun','tutor','ujian',
    'ukuran','ulang','ummat','unggu','unik','usaha','utama',
    'wadah','wajib','warna','wisma','yakin','zaman','zebra',
    'angan','ancam','angin','angka','anjur','antri','antre',
    'aroma','aspal','asrama','atasi','atlas','audit','avant',
    'babak','bahas','bakso','balik','bandu','bantu','bayar',
    'benci','benih','berat','beras','bibir','bidan','bisik',
    'blokir','bocah','bohon','bokep','bolak','bonus','bosan',
    'bunga','cakap','candu','catat','cerah','ceria','cicil',
    'cipta','covid','cuaca','cubit','daftar','dahak','dapur',
    'dekat','detik','dewas','dixit','donat','donor','drama',
    'dunia','durian','dunia','eBook','edisi','efisi','ejaan',
    'eksis','ekspo','email','empal','empat','empuk','energi',
    'error','esain','etika','fabel','faham','fajar','faksi',
    'famil','fobia','fokus','forum','foyer','franc','frasa',
    'gabah','gabung','gadai','gadis','gairah','galak','galeri',
    'galon','gamis','gatal','gaung','gebuk','gelap','gelar',
    'gerak','gigit','gitar','glokal','gobar','gosip','gurun',
    'habis','hadas','hamba','hantu','hapus','harga','harum',
    'hemat','hewani','hidup','hisab','hobby','honor','horor',
    'hujan','humor','huruf','ikhlas','imbal','imobil','induk',
    'infus','insan','intro','irama','ironi','iuran','jajan',
    'jalur','janji','jatuh','jenis','jepang','jerih','jodoh',
    'joget','juara','jumbo','jumlah','jurus','kadang','kaget',
    'kait','kalah','kaldu','kamus','karir','kasih','kejar',
    'keras','kerja','kinal','kiper','kirim','kocak','koran',
    'kotor','kritis','kunci','kuota','kurang','kursi','label',
    'lapar','lapas','laser','latih','lekas','lelah','lemak',
    'lewat','lihai','lirik','logis','longsor','lower','loyal',
    'lumut','lurus','macam','makan','makna','malam','maleh',
    'mana','mandek','masih','masuk','matang','mudah','mulai',
    'murni','musik','mutus','nafsu','nakal','napas','naskah',
    'nazar','ngeri','niaga','nikah','nikmat','norma','oasis',
    'obral','oknum','omong','orasi','orang','otak','pacuan',
    'palas','panas','panel','panen','papan','pasar','pasif',
    'pasok','paten','patuh','pawal','pecah','pelik','perlu',
    'pikir','pintar','piket','pindah','pinta','polis','polri',
    'ponsel','positif','potret','praja','premi','prosa','publik',
    'puisi','pupuk','purna','pusara','pusing','rawat','rebut',
    'rehat','rejeki','rekam','rekap','rekan','rekor','rehat',
    'rencana','rentan','retas','riset','ritual','royak','ruhut',
    'sadap','sahur','sakit','saksi','salat','sambal','santu',
    'sarjana','sayang','selalu','selang','selat','senjata','senyum',
    'setara','simak','simpan','sindir','sitir','skala','skema',
    'solat','somasi','sosial','sosmed','speedy','standar','strategi',
    'studi','subyek','sukses','sumber','syarat','tacit','tahan',
    'tahap','tajam','tambah','tampil','tanah','tangkap','target',
    'taruh','teman','tempat','tengah','tenang','terima','ternak',
    'tidak','tidur','tilang','tipu','topik','tradisi','transfer',
    'tumbuh','tunai','tugas','ungkap','upsert','uraian','usaha',
    'utang','utara','utara','vaksin','valid','video','viral',
    'visum','voters','wajah','walau','wanita','waras','warung',
    'wasit','water','waktu','weleh','wewenang','wirausaha','zakat',
];

// Filter hanya 5 huruf
const KATA_5 = [...new Set(KATA_WORDLE.filter(k => k.length === 5))];

// ─── Sesi game ────────────────────────────────────────────────
const sesiWordle = new Map(); // userId -> { kata, attempts, maxAttempts, startTime }

// ─── Render papan wordle ──────────────────────────────────────
function renderBoard(attempts, kata) {
    if (attempts.length === 0) return '_(Belum ada tebakan)_';
    let board = '';
    for (const tebak of attempts) {
        let baris = '';
        let hasil = '';
        for (let i = 0; i < 5; i++) {
            const c = tebak[i].toUpperCase();
            if (c === kata[i].toUpperCase()) {
                baris += `🟩`; // Benar posisi
                hasil += c;
            } else if (kata.toUpperCase().includes(c)) {
                baris += `🟨`; // Ada tapi salah posisi
                hasil += c;
            } else {
                baris += `⬜`; // Tidak ada
                hasil += c;
            }
        }
        board += `${baris} *${hasil}*\n`;
    }
    return board;
}

// ─── Petunjuk keyboard ───────────────────────────────────────
function renderKeyboard(attempts, kata) {
    const hurufBenar = new Set();
    const hurufAda = new Set();
    const hurufSalah = new Set();
    for (const tebak of attempts) {
        for (let i = 0; i < 5; i++) {
            const c = tebak[i].toUpperCase();
            if (c === kata[i].toUpperCase()) hurufBenar.add(c);
            else if (kata.toUpperCase().includes(c)) hurufAda.add(c);
            else hurufSalah.add(c);
        }
    }
    const abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let key = '';
    for (const c of abc) {
        if (hurufBenar.has(c)) key += `✅`;
        else if (hurufAda.has(c)) key += `🟨`;
        else if (hurufSalah.has(c)) key += `❌`;
        else key += c;
    }
    return key;
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['wordle', 'wordlestop', 'wordleskor'];
    // Cek juga tebakan dalam game
    const userId = msg.author || msg.from;
    const chatId = msg.from;
    const sesiKey = `${chatId}_${userId}`;

    if (!validCommands.includes(command)) return;

    // Inisialisasi stat
    if (!user.wordleStat) user.wordleStat = { menang: 0, kalah: 0, streak: 0, bestStreak: 0, gamesPlayed: 0 };

    // ══════════════════════════════════════════════════════════
    // !wordle — Mulai atau tebak
    // ══════════════════════════════════════════════════════════
    if (command === 'wordle') {
        const tebakan = args[0]?.toLowerCase();

        // --- Mulai game baru ---
        if (!tebakan) {
            if (sesiWordle.has(sesiKey)) {
                const s = sesiWordle.get(sesiKey);
                return msg.reply(
                    `🟩 *WORDLE AKTIF*\n\n` +
                    `Sisa percobaan: *${s.maxAttempts - s.attempts.length}/${s.maxAttempts}*\n\n` +
                    `${renderBoard(s.attempts, s.kata)}\n` +
                    `_Tebak kata 5 huruf: \`!wordle kata\`_\n` +
                    `_Berhenti: \`!wordlestop\`_`
                );
            }

            const kata = KATA_5[Math.floor(Math.random() * KATA_5.length)];
            sesiWordle.set(sesiKey, {
                kata,
                attempts: [],
                maxAttempts: 6,
                startTime: Date.now()
            });

            return msg.reply(
                `🟩 *WORDLE INDONESIA*\n` +
                `${'─'.repeat(30)}\n\n` +
                `Tebak kata *5 huruf* dalam *6 kesempatan*!\n\n` +
                `📖 Petunjuk:\n` +
                `🟩 = Huruf benar & posisi benar\n` +
                `🟨 = Huruf ada tapi posisi salah\n` +
                `⬜ = Huruf tidak ada di kata\n\n` +
                `Cara tebak: \`!wordle <kata>\`\n` +
                `Contoh: \`!wordle makan\`\n\n` +
                `${'─'.repeat(20)}\n` +
                `⬜⬜⬜⬜⬜\n`.repeat(6) +
                `${'─'.repeat(20)}\n` +
                `_Selamat menebak! 🍀_`
            );
        }

        // --- Proses tebakan ---
        if (!sesiWordle.has(sesiKey)) {
            return msg.reply('❌ Belum ada game aktif! Ketik `!wordle` untuk mulai.');
        }

        if (tebakan.length !== 5) {
            return msg.reply('❌ Kata harus *5 huruf*! Coba lagi.');
        }

        if (!/^[a-z]+$/.test(tebakan)) {
            return msg.reply('❌ Hanya huruf A-Z yang diperbolehkan!');
        }

        const sesi = sesiWordle.get(sesiKey);

        if (sesi.attempts.includes(tebakan)) {
            return msg.reply(`⚠️ Kata *"${tebakan.toUpperCase()}"* sudah pernah ditebak!`);
        }

        sesi.attempts.push(tebakan);
        const isWin = tebakan === sesi.kata;
        const isGameOver = sesi.attempts.length >= sesi.maxAttempts;

        const board = renderBoard(sesi.attempts, sesi.kata);
        const keyboard = renderKeyboard(sesi.attempts, sesi.kata);

        if (isWin) {
            sesiWordle.delete(sesiKey);
            const elapsed = Math.floor((Date.now() - sesi.startTime) / 1000);
            user.wordleStat.menang++;
            user.wordleStat.streak++;
            user.wordleStat.gamesPlayed++;
if (user.wordleStat.streak > user.wordleStat.bestStreak) {
                user.wordleStat.bestStreak = user.wordleStat.streak;
            }
            
          // --- SISTEM HADIAH BARU (50 Juta - 200 Juta) ---
            // Hadiah maksimal (200jt) jika tebak benar di percobaan ke-1.
            // Hadiah berkurang 30 Juta setiap kali tebakan salah.
            // Hadiah minimal (50jt) jika baru benar di percobaan ke-6.
            const hadiahMaksimal = 200000000;
            const penguranganPerSalah = 30000000;
            const hadiah = Math.max(hadiahMaksimal - (sesi.attempts.length - 1) * penguranganPerSalah, 50000000);
            
            user.balance = (user.balance || 0) + hadiah;
            saveDB(db);

            return msg.reply(
                `🎉 *HEBAT! BENAR!*\n` +
                `${'─'.repeat(30)}\n\n` +
                `${board}\n` +
                `${'─'.repeat(25)}\n\n` +
                `✅ Kata: *${sesi.kata.toUpperCase()}*\n` +
                `🎯 Percobaan ke-*${sesi.attempts.length}*\n` +
                `⏱️ Waktu: *${elapsed} detik*\n` +
                `💰 Hadiah: *+${hadiah} koin*\n` +
                `🔥 Streak: *${user.wordleStat.streak}*\n\n` +
                `_Ketik \`!wordle\` untuk main lagi!_`
            );
        }

        if (isGameOver) {
            sesiWordle.delete(sesiKey);
            user.wordleStat.kalah++;
            user.wordleStat.streak = 0;
            user.wordleStat.gamesPlayed++;
            saveDB(db);

            return msg.reply(
                `💀 *GAME OVER!*\n` +
                `${'─'.repeat(30)}\n\n` +
                `${board}\n` +
                `${'─'.repeat(25)}\n\n` +
                `❌ Kata yang benar: *${sesi.kata.toUpperCase()}*\n` +
                `💀 Streak rusak.\n\n` +
                `_Ketik \`!wordle\` untuk coba lagi!_`
            );
        }

        // Lanjut main
        const sisaPercobaan = sesi.maxAttempts - sesi.attempts.length;
        return msg.reply(
            `🟩 *WORDLE*\n` +
            `${'─'.repeat(25)}\n\n` +
            `${board}\n` +
            `${'─'.repeat(20)}\n\n` +
            `⬜⬜⬜⬜⬜\n`.repeat(sisaPercobaan) +
            `${'─'.repeat(20)}\n` +
            `⌨️ ${keyboard}\n\n` +
            `_Sisa: ${sisaPercobaan} percobaan lagi_`
        );
    }

    // !wordlestop
    if (command === 'wordlestop') {
        if (!sesiWordle.has(sesiKey)) return msg.reply('❌ Tidak ada game aktif.');
        const sesi = sesiWordle.get(sesiKey);
        sesiWordle.delete(sesiKey);
        user.wordleStat.kalah++;
        user.wordleStat.streak = 0;
        user.wordleStat.gamesPlayed++;
        saveDB(db);
        return msg.reply(`🏳️ Game dihentikan.\nJawaban: *${sesi.kata.toUpperCase()}*`);
    }

    // !wordleskor
    if (command === 'wordleskor') {
        const s = user.wordleStat;
        const winRate = s.gamesPlayed > 0 ? ((s.menang / s.gamesPlayed) * 100).toFixed(0) : 0;
        return msg.reply(
            `📊 *STATISTIK WORDLE — ${user.name || msg.pushName}*\n` +
            `${'─'.repeat(30)}\n\n` +
            `🎮 Total Dimainkan: *${s.gamesPlayed}*\n` +
            `✅ Menang: *${s.menang}*\n` +
            `❌ Kalah: *${s.kalah}*\n` +
            `📈 Win Rate: *${winRate}%*\n` +
            `🔥 Streak Sekarang: *${s.streak}*\n` +
            `🏆 Best Streak: *${s.bestStreak}*\n\n` +
            `_Ketik \`!wordle\` untuk main lagi!_`
        );
    }
};
