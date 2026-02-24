/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║           TRIVIA BATTLE — Fitur 8                           ║
 * ║  !trivia [kategori]  — Mulai trivia kuis berhadiah koin     ║
 * ║  !triviastop         — Stop sesi trivia                     ║
 * ║  !triviaskor         — Lihat leaderboard trivia             ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const { saveDB } = require('../helpers/database');

// ─── BANK SOAL TRIVIA ─────────────────────────────────────────
const SOAL_TRIVIA = {
    umum: [
        { q: 'Apa ibu kota Australia?', a: 'canberra', hint: 'Bukan Sydney atau Melbourne!' },
        { q: 'Berapa jumlah planet di tata surya kita?', a: '8', hint: 'Pluto sudah tidak dihitung' },
        { q: 'Siapa penemu lampu pijar?', a: 'thomas edison', hint: 'Orang Amerika yang terkenal' },
        { q: 'Apa nama gunung tertinggi di dunia?', a: 'everest', hint: 'Ada di perbatasan Nepal-Tibet' },
        { q: 'Berapa sisi yang dimiliki segi enam?', a: '6', hint: 'Segi enam = hex' },
        { q: 'Apa unsur kimia dengan simbol Au?', a: 'emas', hint: 'Logam mulia berwarna kuning' },
        { q: 'Negara mana yang memiliki populasi terbanyak di dunia?', a: 'india', hint: 'Melewati China di 2023' },
        { q: 'Apa nama organ yang memompa darah ke seluruh tubuh?', a: 'jantung', hint: 'Ada di dada sebelah kiri' },
        { q: 'Hewan darat tercepat di dunia adalah?', a: 'cheetah', hint: 'Kucing besar bercorak tutul' },
        { q: 'Apa nama benua terbesar di dunia?', a: 'asia', hint: 'Tempat negara kita berada' },
        { q: 'Mata uang resmi negara Jepang adalah?', a: 'yen', hint: 'Terdiri dari 3 huruf' },
        { q: 'Campuran warna merah dan kuning akan menghasilkan warna?', a: 'oranye', hint: 'Sama dengan warna buah jeruk' },
        { q: 'Samudra terluas di dunia adalah Samudra?', a: 'pasifik', hint: 'Membentang di antara Asia dan Amerika' },
        { q: 'Apa nama bahasa internasional yang paling banyak digunakan di dunia?', a: 'inggris', hint: 'Bahasa dari Britania Raya' }
    ],
    indonesia: [
        { q: 'Siapa presiden pertama Indonesia?', a: 'soekarno', hint: 'Proklamator kemerdekaan' },
        { q: 'Apa nama danau terbesar di Indonesia?', a: 'danau toba', hint: 'Ada di Sumatera Utara' },
        { q: 'Indonesia merdeka pada tanggal berapa?', a: '17 agustus 1945', hint: 'Sudah ada di lagu nasional' },
        { q: 'Apa nama gunung berapi paling aktif di Indonesia?', a: 'merapi', hint: 'Ada di Jawa Tengah' },
        { q: 'Suku apa yang menghuni pulau Kalimantan?', a: 'dayak', hint: 'Suku asli Borneo' },
        { q: 'Apa nama alat musik tradisional Jawa yang terbuat dari logam?', a: 'gamelan', hint: 'Dimainkan dipukul' },
        { q: 'Siapa pahlawan nasional yang dijuluki "Singa Podium"?', a: 'bung tomo', hint: 'Pemimpin pertempuran Surabaya 10 Nov' },
        { q: 'Candi Buddha terbesar di dunia yang terletak di Magelang adalah?', a: 'borobudur', hint: 'Dibangun pada masa Wangsa Syailendra' },
        { q: 'Siapa pencipta lagu kebangsaan Indonesia Raya?', a: 'wage rudolf soepratman', hint: 'Sering disingkat W.R. ...' },
        { q: 'Peristiwa sejarah yang menandai akhir dari masa Orde Lama dan awal transisi menuju Orde Baru?', a: 'g30s pki', hint: 'Terjadi pada akhir September 1965' },
        { q: 'Tari Kecak berasal dari provinsi mana?', a: 'bali', hint: 'Pulau Dewata' },
        { q: 'Semboyan negara Indonesia adalah?', a: 'bhinneka tunggal ika', hint: 'Berbeda-beda tetapi tetap satu jua' }
    ],
    sains: [
        { q: 'Apa rumus kimia air?', a: 'h2o', hint: '2 Hidrogen + 1 Oksigen' },
        { q: 'Berapa kecepatan cahaya dalam km/s?', a: '300000', hint: '3 x 10^5 km/s' },
        { q: 'Apa nama proses tanaman membuat makanan menggunakan cahaya matahari?', a: 'fotosintesis', hint: 'Foto = cahaya' },
        { q: 'Apa nama planet terdekat dari matahari?', a: 'merkurius', hint: 'Planet paling kecil di tata surya' },
        { q: 'Berapa derajat titik didih air pada tekanan normal?', a: '100', hint: 'Dalam satuan Celsius' },
        { q: 'Apa nama ilmuwan yang menemukan gravitasi saat melihat apel jatuh?', a: 'newton', hint: 'Sir Isaac ...' },
        { q: 'Dalam fisika, perubahan kecepatan per satuan waktu disebut?', a: 'percepatan', hint: 'Dalam rumus kinematika disimbolkan dengan huruf "a"' },
        { q: 'Skala yang digunakan untuk mengukur tingkat keasaman atau kebasaan suatu larutan disebut?', a: 'ph', hint: 'Nilainya berkisar dari 0 sampai 14' },
        { q: 'Benda langit yang mengorbit sebuah planet disebut?', a: 'satelit', hint: 'Bulan adalah contoh alaminya' },
        { q: 'Sebutan untuk reaksi kimia yang melepaskan panas ke lingkungan adalah?', a: 'eksoterm', hint: 'Kebalikan dari endoterm' },
        { q: 'Ilmu yang mempelajari tentang makhluk hidup adalah?', a: 'biologi', hint: 'Mencakup botani dan zoologi' }
    ],
    sepakbola: [
        { q: 'Siapa pencetak gol terbanyak sepanjang masa di Piala Dunia?', a: 'miroslav klose', hint: 'Pemain Jerman' },
        { q: 'Negara mana yang paling sering juara Piala Dunia?', a: 'brasil', hint: '5 kali juara' },
        { q: 'Apa nama stadion milik Arsenal?', a: 'emirates', hint: 'Disponsori maskapai Timur Tengah' },
        { q: 'Siapa top skor Piala Dunia 2022?', a: 'kylian mbappe', hint: 'Pemain muda Prancis' },
        { q: 'Club apa yang dijuluki "The Red Devils"?', a: 'manchester united', hint: 'Berbasis di Manchester, Inggris' },
        { q: 'Pemain dengan gelar Ballon d\'Or terbanyak sepanjang masa?', a: 'lionel messi', hint: 'Dijuluki La Pulga' },
        { q: 'Siapa pencetak gol terbanyak sepanjang masa di Piala Dunia?', a: 'miroslav klose', hint: 'Pemain Jerman' },
        { q: 'Negara mana yang paling sering juara Piala Dunia?', a: 'brasil', hint: '5 kali juara' },
        { q: 'Apa nama stadion milik Arsenal?', a: 'emirates', hint: 'Disponsori maskapai Timur Tengah' },
        { q: 'Siapa top skor Piala Dunia 2022?', a: 'kylian mbappe', hint: 'Pemain muda Prancis' },
        { q: 'Club apa yang dijuluki "The Red Devils"?', a: 'manchester united', hint: 'Berbasis di Manchester, Inggris' },
        { q: 'Pemain dengan gelar Ballon d\'Or terbanyak sepanjang masa?', a: 'lionel messi', hint: 'Dijuluki La Pulga' },
        { q: 'Klub mana yang memiliki trofi Liga Champions terbanyak?', a: 'real madrid', hint: 'Klub asal ibukota Spanyol, dijuluki Los Blancos' },
        { q: 'Negara mana yang memenangkan kompetisi Euro 2024?', a: 'spanyol', hint: 'Mengalahkan Inggris di laga final' },
        { q: 'Warna kartu yang diberikan wasit untuk mengusir pemain dari lapangan?', a: 'merah', hint: 'Warnanya mencolok' },
        { q: 'Berapa jumlah pemain dalam satu tim sepak bola yang berada di lapangan?', a: '11', hint: 'Sering disebut kesebelasan' },
        { q: 'Siapa pemain sepak bola dunia yang identik dengan julukan CR7?', a: 'cristiano ronaldo', hint: 'Berasal dari Portugal' },
        { q: 'Negara mana yang berhasil menjadi juara Piala Dunia 2022 di Qatar?', a: 'argentina', hint: 'Tim yang dikapteni Lionel Messi' },
        { q: 'Klub sepak bola asal Surabaya yang memiliki julukan Bajul Ijo adalah?', a: 'persebaya', hint: 'Klub kebanggaan Bonek' },
        { q: 'Apa nama stadion yang menjadi markas utama Timnas Indonesia?', a: 'gelora bung karno', hint: 'Terletak di Senayan, Jakarta' },
        { q: 'Istilah untuk pemain yang berhasil mencetak 3 gol dalam satu pertandingan adalah?', a: 'hattrick', hint: 'Tiga gol' },
        { q: 'Klub Italia mana yang memiliki julukan La Vecchia Signora atau Nyonya Tua?', a: 'juventus', hint: 'Jersey utamanya bergaris hitam putih' },
        { q: 'Siapa pelatih asal Korea Selatan yang menangani Timnas Indonesia sejak 2019?', a: 'shin tae yong', hint: 'Sering dipanggil STY' },
        { q: 'Apa nama penghargaan individu tahunan tertinggi berupa Bola Emas untuk pemain sepak bola?', a: 'ballon dor', hint: 'Bahasa Prancis dari Bola Emas' },
        { q: 'Negara mana yang menjadi tuan rumah Piala Eropa (Euro) 2024?', a: 'jerman', hint: 'Negara yang dijuluki Der Panzer' },
        { q: 'Klub asal Jerman yang bermarkas di Allianz Arena dan dijuluki Die Roten?', a: 'bayern munchen', hint: 'Rival abadi Borussia Dortmund' },
        { q: 'Klub mana yang memiliki trofi Liga Champions terbanyak?', a: 'real madrid', hint: 'Klub asal ibukota Spanyol, dijuluki Los Blancos' },
        { q: 'Negara mana yang memenangkan kompetisi Euro 2024?', a: 'spanyol', hint: 'Mengalahkan Inggris di laga final' },
        { q: 'Warna kartu yang diberikan wasit untuk mengusir pemain dari lapangan?', a: 'merah', hint: 'Warnanya mencolok' },
        { q: 'Berapa jumlah pemain dalam satu tim sepak bola yang berada di lapangan?', a: '11', hint: 'Sering disebut kesebelasan' }
    ],
    teknologi: [
        { q: 'Siapa pendiri Microsoft?', a: 'bill gates', hint: 'Orang terkaya di dunia beberapa tahun' },
        { q: 'Apa kepanjangan dari CPU?', a: 'central processing unit', hint: 'Otak dari komputer' },
        { q: 'Bahasa pemrograman apa yang digunakan untuk membuat WhatsApp pertama kali?', a: 'erlang', hint: 'Bukan Java, bukan Python' },
        { q: 'Siapa yang mendirikan Tesla Inc?', a: 'elon musk', hint: 'Juga punya SpaceX' },
        { q: 'Apa nama OS yang dikembangkan oleh Google untuk smartphone?', a: 'android', hint: 'Robot hijau sebagai logonya' },
        { q: 'Bahasa pemrograman populer yang memiliki nama dan logo seekor ular berbisa?', a: 'python', hint: 'Sering dipakai untuk AI dan Data Science' },
        { q: 'Perusahaan teknologi yang menciptakan iPhone dan Mac?', a: 'apple', hint: 'Logonya buah yang digigit' },
        { q: 'Library JavaScript populer yang sering digunakan untuk membangun bot WhatsApp?', a: 'baileys', hint: 'Sering dipasangkan dengan WASocket' },
        { q: 'Software yang digunakan untuk menjelajahi internet disebut?', a: 'browser', hint: 'Contohnya Chrome, Edge, Firefox' },
        { q: 'Platform berbagi video terbesar di dunia milik Google?', a: 'youtube', hint: 'Ikonnya tombol play berwarna merah' }
    ]
};

// ─── State Sesi ───────────────────────────────────────────────
const sesiTrivia = new Map(); // chatId -> { soal, jawaban, hint, kategori, pot, pemain, timeout, mulai }

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db, body) => {
    const chatId = msg.from;
    const sender = msg.author || msg.from;
    const now = Date.now();
    
    // Ambil isi chat secara penuh
    const textMessage = body ? body.toLowerCase().trim() : "";

    // ─── 1. PENGECEKAN JAWABAN (REBUTAN / DENGAN ATAU TANPA PREFIX) ────────────
    if (sesiTrivia.has(chatId)) {
        const sesi = sesiTrivia.get(chatId);
        const jawabanAsli = sesi.jawaban.toLowerCase().trim();

        // Bersihkan textMessage dari karakter prefix (!, /) di awal kata agar '!soekarno' terbaca 'soekarno'
        const jawabanUser = textMessage.replace(/^[^\w\s]/, '').trim();

        // Pastikan yang diketik user BUKAN command untuk menghentikan/menjalankan game
        const isCommandUtama = ['trivia', 'triviastop', 'triviaskor', 'trivialeader', 'hint'].includes(command);

        if (!isCommandUtama && jawabanUser.length > 0) {
            // Cek apakah jawaban cocok persis, atau ada kata kunci > 3 huruf yang nyangkut
            if (jawabanUser === jawabanAsli || jawabanAsli.split(' ').some(w => w.length > 3 && jawabanUser.includes(w))) {
                clearTimeout(sesi.timeout);
                sesiTrivia.delete(chatId);

                // Beri hadiah
                if (!db.users[sender]) db.users[sender] = {};
                const pemenang = db.users[sender];
                const hadiah = sesi.pot;
                if (typeof pemenang.balance === 'undefined') pemenang.balance = 0;
                pemenang.balance += hadiah;

                // Update skor trivia
                if (!pemenang.triviaSkor) pemenang.triviaSkor = 0;
                pemenang.triviaSkor += 1;

                saveDB(db);

                const elapsed = ((now - sesi.mulai) / 1000).toFixed(1);
                return msg.reply(
                    `🎉 *BENAR! SELAMAT!*\n\n` +
                    `👤 Pemenang: *${msg.pushName || 'Kamu'}*\n` +
                    `✅ Jawaban: *${sesi.jawaban}*\n` +
                    `⏱️ Waktu: *${elapsed} detik*\n` +
                    `💰 Hadiah: *+${hadiah.toLocaleString('id-ID')} koin*\n\n` +
                    `Ketik \`!trivia\` untuk soal berikutnya!`
                );
            }
        }
    }

    // ─── 2. TANGANI COMMAND UTAMA ──────────────────────────────────────────────
    // DAFTARKAN 'hint' di sini agar tidak nyasar ke file lain
    const validCommands = ['trivia', 'triviastop', 'triviaskor', 'trivialeader', 'hint'];
    if (!validCommands.includes(command)) return;

    // ══════════════════════════════════════════════════════════
    // !hint
    // ══════════════════════════════════════════════════════════
    if (command === 'hint') {
        if (!sesiTrivia.has(chatId)) return msg.reply('❌ Tidak ada sesi trivia aktif. Ketik `!trivia` untuk mulai!');
        const sesi = sesiTrivia.get(chatId);
        return msg.reply(`💡 *HINT:*\n\n_${sesi.hint}_`);
    }

    // ══════════════════════════════════════════════════════════
    // !trivia [kategori]
    // ══════════════════════════════════════════════════════════
    if (command === 'trivia') {
        if (sesiTrivia.has(chatId)) {
            const sesiAktif = sesiTrivia.get(chatId);
            return msg.reply(`⚠️ Masih ada soal aktif!\n\n❓ *${sesiAktif.soal}*\n\n_Ketik \`!triviastop\` untuk skip_`);
        }

        const KATEGORI = Object.keys(SOAL_TRIVIA);
        let kategori = args[0]?.toLowerCase();

        if (!kategori || !SOAL_TRIVIA[kategori]) {
            kategori = KATEGORI[Math.floor(Math.random() * KATEGORI.length)];
        }

        const bankSoal = SOAL_TRIVIA[kategori];
        const soalData = bankSoal[Math.floor(Math.random() * bankSoal.length)];

        const hadiah = Math.floor(Math.random() * 50000001) + 60000000; // 50 Juta – 80 Juta koin
        const WAKTU = 30; // 30 detik

        const timeout = setTimeout(async () => {
            if (sesiTrivia.has(chatId)) {
                sesiTrivia.delete(chatId);
                try {
                    await msg.reply(`⏰ *WAKTU HABIS!*\n\nJawaban yang benar: *${soalData.a}*\n\nKetik \`!trivia\` untuk coba lagi.`);
                } catch (e) { /* ignore */ }
            }
        }, WAKTU * 1000);

        sesiTrivia.set(chatId, {
            soal: soalData.q,
            jawaban: soalData.a,
            hint: soalData.hint,
            kategori,
            pot: hadiah,
            timeout,
            mulai: now
        });

        return msg.reply(
            `🧠 *TRIVIA BATTLE!*\n` +
            `${'─'.repeat(30)}\n\n` +
            `📚 Kategori: *${kategori.toUpperCase()}*\n` +
            `💰 Hadiah: *${hadiah.toLocaleString('id-ID')} koin*\n` +
            `⏱️ Waktu: *${WAKTU} detik*\n\n` +
            `❓ *${soalData.q}*\n\n` +
            `_Ketik jawabannya langsung di chat! (bisa pakai awalan ! atau tidak)_\n` +
            `Butuh bantuan? Ketik \`!hint\``
        );
    }

    // ══════════════════════════════════════════════════════════
    // !triviastop
    // ══════════════════════════════════════════════════════════
    if (command === 'triviastop') {
        if (!sesiTrivia.has(chatId)) return msg.reply('❌ Tidak ada sesi trivia aktif.');
        const sesi = sesiTrivia.get(chatId);
        clearTimeout(sesi.timeout);
        sesiTrivia.delete(chatId);
        return msg.reply(`🛑 Trivia dihentikan.\n\nJawaban yang benar tadi: *${sesi.jawaban}*`);
    }

    // ══════════════════════════════════════════════════════════
    // !triviaskor / !trivialeader
    // ══════════════════════════════════════════════════════════
    if (command === 'triviaskor' || command === 'trivialeader') {
        const allUsers = Object.entries(db.users || {})
            .filter(([, u]) => u.triviaSkor && u.triviaSkor > 0)
            .sort(([, a], [, b]) => (b.triviaSkor || 0) - (a.triviaSkor || 0))
            .slice(0, 10);

        if (allUsers.length === 0) return msg.reply('📊 Belum ada skor trivia. Mainkan \`!trivia\` dulu!');

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        let papan = `🧠 *LEADERBOARD TRIVIA*\n${'─'.repeat(30)}\n\n`;
        allUsers.forEach(([id, u], i) => {
            const nama = u.name || u.pushName || id.replace('@s.whatsapp.net', '');
            papan += `${medals[i]} *${nama}* — ${(u.triviaSkor || 0)} benar\n`;
        });

        papan += `\n${'─'.repeat(25)}\n`;
        papan += `Kamu: *${user.triviaSkor || 0}* benar`;
        return msg.reply(papan);
    }
};
