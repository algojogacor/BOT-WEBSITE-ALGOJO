// ╔══════════════════════════════════════════════════════════════════╗
// ║   menu.js — Algojo Bot WA v2.0 | Wiki Interaktif Lengkap        ║
// ║   Format: Buku Panduan dengan Mekanik, Usage, dan Pro-Tips       ║
// ╚══════════════════════════════════════════════════════════════════╝

module.exports = async (command, args, msg, user) => {
    if (command !== 'menu' && command !== 'help') return false;

    const sub = (args[0] || '').toLowerCase();

    // ── Helpers ────────────────────────────────────────────────────
    const bar = (val, len = 10) => {
        const v = Math.min(Math.max(val || 0, 0), 100);
        const fill = Math.round((v / 100) * len);
        return '█'.repeat(fill) + '░'.repeat(len - fill);
    };
    const fmt  = n => Math.floor(n || 0).toLocaleString('id-ID');
    const bal  = fmt(user?.balance || 0);
    const hp   = Math.floor(user?.hp  ?? 100);
    const nrg  = Math.floor(user?.energy ?? 100);
    const hng  = Math.floor(user?.hunger ?? 100);
    const lvl  = user?.level ?? 1;
    const xp   = fmt(user?.xp || 0);
    const job  = user?.job ? `💼 ${user.job}` : '😴 Pengangguran';

    // ══════════════════════════════════════════════════════════════
    //  MENU UTAMA
    // ══════════════════════════════════════════════════════════════
    if (!sub) {
        await msg.reply(
`╔══════════════════════════════╗
║  ⚔️  *ALGOJO BOT WA v2.0*  ⚔️  ║
║   _Wiki Panduan Interaktif_   ║
╚══════════════════════════════╝

❤️ HP     : [${bar(hp)}] ${hp}%
🍗 Lapar  : [${bar(hng)}] ${hng}%
⚡ Energi : [${bar(nrg)}] ${nrg}%
💰 Saldo  : Rp ${bal}
🎖️ Level  : ${lvl} (${xp} XP) | ${job}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔰 *PANDUAN PEMULA — MULAI DI SINI*
┌─────────────────────────────┐
│ 1. Cek status  → !me        │
│ 2. Ambil daily → !daily     │
│ 3. Lamar kerja → !jobs      │
│ 4. Mulai cuan  → !farming   │
│ 5. Jangan mati → !makan     │
└─────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🩺 *KEHIDUPAN & EKONOMI*
• !menu nyawa    — Survival: HP, lapar, energi, kematian
• !menu bank     — Keuangan: transfer, pinjam, limit harian
• !menu jobs     — Profesi: gaji, skill pasif, sertifikasi

⚔️ *GAMES & HIBURAN*
• !menu game     — Casino, slot, roulette, mines, duel
• !menu minigame — Catur, Slither, RPG, Akinator, Trivia
• !menu bola     — Sportsbook: 1X2, HDP, O/U, Mix Parlay

🏭 *BISNIS & INDUSTRI*
• !menu farming  — Pertanian, mesin pabrik, industri bersama
• !menu ternak   — Peternakan, pakan, budidaya hewan
• !menu mining   — VGA rig, BTC mining, trading crypto

📊 *INVESTASI & ASET*
• !menu investasi — Saham BEI (real-time), valas, emas
• !menu properti  — Usaha pasif: gerobak hingga maskapai

🏳️ *NEGARA & PERANG*
• !menu negara   — Bangun negara, perang, aliansi, spionase

🤖 *AI & KREATIVITAS*
• !menu ai       — ChatAI multi-tier, tools AI, analisis gambar
• !menu kreatif  — Image AI, meme, cerita interaktif, lirik lagu

🛠️ *TOOLS & UTILITAS*
• !menu tools    — Stiker, PDF, TTS, downloader, image editor
• !menu utilitas — QR, password, enkripsi, IP, countdown

🎭 *LIFESTYLE*
• !menu mood     — Zodiak, shio, mood tracker, horoskop
• !menu reminder — Pengingat jadwal & tagihan otomatis

👥 *GRUP & SISTEM*
• !menu group    — Admin tools, antilink, welcome message
• !menu event    — Admin Abuse: 10 event acak 30 menit
• !menu analitik — Statistik penggunaan bot
• !menu developer — Panel admin/developer bot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Ketik !menu <kategori> untuk panduan detail_
_Contoh: !menu farming | !menu game | !menu ai_`
        );
        return true;
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu nyawa
    // ══════════════════════════════════════════════════════════════
    if (['nyawa','survival','life','hp','status'].includes(sub)) {
        return msg.reply(
`🩺 *SISTEM KEHIDUPAN — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Bot menjalankan sistem survival real-time.
Setiap menit, status karaktermu berubah:

  🍗 Lapar   : -0.1% / menit (habis dlm ~16 jam)
  ⚡ Energi  : -0.09% / menit (habis dlm ~18 jam)
  ❤️ HP      : -0.1% / menit (HANYA jika lapar = 0%)

Jika HP mencapai 0% → 💀 *MATI*
  └ Saldo berkurang *20%* secara otomatis!
  └ Semua command diblokir kecuali !revive

Saat *!tidur* aktif → metabolisme melambat:
  └ Energi +0.6% / menit (isi penuh)
  └ Lapar  -0.02% / menit saja (hemat 5x)
  └ Semua command DIBLOKIR kecuali !bangun

${'─'.repeat(30)}
📊 *STATUS KAMU SEKARANG*
❤️ HP     : [${bar(hp)}] ${hp}%
🍗 Lapar  : [${bar(hng)}] ${hng}%
⚡ Energi : [${bar(nrg)}] ${nrg}%
${hp <= 30 ? '⚠️ PERINGATAN: HP kritis! Segera !makan atau !rs' : hp <= 60 ? '⚡ HP sedang — pertimbangkan !makan' : '✅ Status cukup aman'}

${'─'.repeat(30)}
⌨️ *COMMAND & USAGE*

!me
  → Cek status lengkap (HP, Lapar, Energi, Saldo)

!makan
  → Makan hidangan sultan. Lapar → 100%, HP +10%
  → Biaya: Rp 50.000.000
  → Contoh: !makan

!tidur <jam>
  → Tidur 1–10 jam. Energi terisi, lapar melambat
  → Contoh: !tidur 8
  → Saat tidur: command lain tidak bisa dipakai!

!bangun
  → Paksa bangun sebelum waktu tidur habis
  → Contoh: !bangun

!rs  /  !revive
  → Berobat di RS. HP, Lapar, Energi → 100%
  → Biaya: Rp 500.000.000 (atau BPJS gratis jika miskin)
  → Gunakan saat mati ATAU HP kritis

!matistatus
  → *Admin:* Bekukan sistem kehidupan semua user
  → Berguna saat maintenance / bot mau offline lama

!hidupstatus  /  !nyalastatus
  → *Admin:* Aktifkan kembali sistem kehidupan

${'─'.repeat(30)}
💡 *PRO-TIPS BERTAHAN HIDUP*

🏆 *Strategi Efisien:*
• !tidur 8 sebelum tidur malam → Energi full saat bangun,
  lapar cuma turun ~10% (hemat Rp 50 Juta makan!)
• Simpan saldo di !depo (bank) — denda mati hanya
  potong saldo *dompet*, bukan saldo bank!
• Pantau lapar: jika lapar < 20% dan lupa makan,
  HP mulai turun. Set reminder dengan !remind

⚠️ *Jangan lakukan ini:*
• Jangan tinggalkan HP < 30% tanpa !makan
• Jangan biarkan lapar = 0% lebih dari 16 jam
• Jangan aktifkan !tidur saat mau gaming lama

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu bank
    // ══════════════════════════════════════════════════════════════
    if (['bank','keuangan','duit','ekonomi'].includes(sub)) {
        return msg.reply(
`🏦 *BANK & KEUANGAN — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Ada dua jenis kantong uang:
  💳 *Dompet* (balance) — uang siap pakai, bisa di-rob
  🏦 *Bank*   (bank)   — aman dari maling, butuh !depo

Transfer harian dibatasi *Rp 10 Miliar/hari*.
Setiap transfer kena *pajak 5%* (masuk kas bot).
Pinjaman maksimal *Rp 5 Miliar* dengan bunga *20%*.
Hutang tidak lunas → saldo otomatis dipotong.

Cooldown bank/tarik: *10 menit* per transaksi.
Cooldown !rob: *30 menit* per percobaan.

${'─'.repeat(30)}
⌨️ *COMMAND & USAGE*

!me  /  !bank  /  !atm
  → Lihat saldo dompet + bank + hutang + limit harian

!depo <jumlah>  /  !depo all
  → Setor saldo ke bank (lebih aman dari maling)
  → Contoh: !depo 5000000 | !depo all

!tarik <jumlah>  /  !tarik all
  → Tarik saldo dari bank ke dompet
  → Contoh: !tarik 1000000 | !tarik all

!tf @user <jumlah>
  → Transfer ke user lain (kena pajak 5%)
  → Contoh: !tf @teman 1000000
  → Batas: Rp 10 Miliar/hari

!give @user <jumlah>
  → Kirim koin langsung tanpa pajak
  → Contoh: !give @teman 500000

!pinjam <jumlah>
  → Pinjam uang (bunga 20%, langsung masuk dompet)
  → Contoh: !pinjam 5000000000
  → Total bayar = pinjaman × 1.2

!bayar <jumlah>  /  !bayar all
  → Cicil atau lunasi hutang
  → Contoh: !bayar all

!rob @user
  → Rampok 20% dompet target (jika sukses)
  → Syarat: Energi > 10%, target saldo > Rp 1 Juta
  → Gagal: denda 10% saldo + HP -20 (dihajar warga)
  → Cooldown: 30 menit

!maling
  → Curi random tanpa target

!top  /  !leaderboard  /  !dailyrank
  → Lihat top 10 pendapatan hari ini di grup

${'─'.repeat(30)}
💡 *PRO-TIPS KEUANGAN*

🏆 *Strategi Aman:*
• Simpan 80–90% saldo di bank — denda mati
  cuma potong *dompet*, bank aman 100%!
• Transfer besar? Bagi jadi beberapa hari agar
  tidak kena blokir limit Rp 10 Miliar
• !pinjam untuk modal farming/mining besar,
  tapi lunasi sebelum bunga jadi beban

💰 *Strategi Rob:*
• Rob target yang saldo dompetnya besar
  (pakai !me @target untuk cek)
• Jadi !polisi untuk kebal dari !rob orang lain
• 40% sukses berarti butuh ~2.5x percobaan
  rata-rata → siapkan energi & 30 menit cooldown

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu jobs
    // ══════════════════════════════════════════════════════════════
    if (['jobs','kerja','pekerjaan','job','profesi'].includes(sub)) {
        return msg.reply(
`💼 *PROFESI & PEKERJAAN — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Pekerjaan memberi *gaji berkala* + *skill aktif/pasif*.
Kamu hanya bisa punya SATU pekerjaan.
Sertifikasi perlu biaya sekali bayar (tidak berulang).
Gaji diambil manual dengan !kerja (ada cooldown).
!skill digunakan untuk aktivasi kemampuan khusus.

${'─'.repeat(30)}
📋 *DAFTAR PROFESI (DATA AKURAT)*
┌────────────────────────────────────────┐
│ 🌾 PETANI MODERN                       │
│   Sertifikasi : Rp 10.000.000         │
│   Gaji        : Rp 1.000.000 / 60 mnt │
│   Skill       : Percepat panen -3 jam  │
├────────────────────────────────────────┤
│ 🤠 JURAGAN TERNAK                      │
│   Sertifikasi : Rp 25.000.000         │
│   Gaji        : Rp 2.500.000 / 2 jam  │
│   Skill       : Hewan langsung lapar   │
│                 (siap makan lagi)       │
├────────────────────────────────────────┤
│ 👮 POLISI SIBER                        │
│   Sertifikasi : Rp 50.000.000         │
│   Gaji        : Rp 7.500.000 / 4 jam  │
│   Pasif       : KEBAL dari !rob        │
│   Skill       : Gerebek markas maling  │
│                 → Bonus Rp 5–10 Juta   │
└────────────────────────────────────────┘

⌨️ *COMMAND & USAGE*

!jobs
  → Lihat semua lowongan + gaji + syarat

!lamar <profesi>
  → Daftar pekerjaan (bayar sertifikasi 1x)
  → Contoh: !lamar petani | !lamar polisi

!kerja  /  !work
  → Ambil gaji (sesuai cooldown profesi)
  → Otomatis tambah XP +50

!skill
  → Aktifkan kemampuan khusus profesi
  → Contoh Petani: semua tanaman panen -3 jam
  → Contoh Peternak: semua hewan lapar (siap makan)
  → Contoh Polisi: dapat Rp 5–10 Juta sitaan

!resign
  → Keluar kerja (gaji periode ini hangus!)

${'─'.repeat(30)}
💡 *PRO-TIPS PROFESI*

🏆 *Pilih berdasarkan gaya main:*
• Main farming → ambil 🌾 PETANI (skill percepat panen)
• Main ternak  → ambil 🤠 PETERNAK (skill hewan lapar lagi)
• Sering di-rob → ambil 👮 POLISI (kebal maling + bonus gerebek)

📈 *Kalkulasi gaji per jam:*
• Petani  : Rp 1.000.000 / jam (paling sering ambil gaji)
• Peternak: Rp 1.250.000 / jam (2.5 jt tiap 2 jam)
• Polisi  : Rp 1.875.000 / jam (7.5 jt tiap 4 jam)
→ Polisi paling cuan per jam, tapi butuh disiplin
  gajian tiap 4 jam & saldo awal lebih besar!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu game
    // ══════════════════════════════════════════════════════════════
    if (['game','games','judi','hiburan','casino'].includes(sub)) {
        return msg.reply(
`🎮 *GAMES & JUDI — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK UMUM)*
Semua game casino dipengaruhi *Event Winrate Gila*.
Saat event aktif: winrate semua casino naik ke *85%*!
Item *Luck Charm* dari !shop menaikkan casino ke 50%.
Tanpa event/buff: winrate casino dasar = *35%*.

${'─'.repeat(30)}
🎰 *CASINO SOLO*

!casino <jumlah>
  Tebak kartu. Winrate: 35% (normal) / 85% (event)
  Menang: +100% taruhan (x2 total)
  Contoh: !casino 1000000

!slot <jumlah>
  Pool: 10 simbol (5 bagus, 5 sampah) → susah pair!
  🍒🍋🍇💎7️⃣ vs 💩🦴🏴‍☠️🌑🥀
  • Pair 2 sama  → +50% taruhan
  • Jackpot 3 sama → 75x taruhan (💎 = 75x!)
  • Event Winrate Gila → slot selalu jackpot 3 sama!
  Contoh: !slot 500000

!rolet <pilihan> <jumlah>
  Pilihan & payout:
  • merah / hitam / ganjil / genap → x2 taruhan
  • Angka 0–36 (tebak pas)         → x15 taruhan 🔥
  Contoh: !rolet merah 1000000
  Contoh: !rolet 7 500000  (jackpot jika keluar 7!)

!tembok <jumlah> <1/2/3>
  Tebak di balik salah satu dari 3 tembok → x2.5
  Contoh: !tembok 1000000 2

!gacha
  Biaya: Rp 200. Reward: random item/koin
  Jackpot: Rp 10.000 koin (sangat langka)

${'─'.repeat(30)}
💣 *MINESWEEPER — SISTEM MULTIPLIER*
Ada 12 kotak, tersembunyi 3 bom.
Saat event Winrate Gila: hanya 1 bom!

Tabel multiplier per kotak dibuka:
  1 kotak → 1.3x  |  4 kotak → 2.5x
  2 kotak → 1.6x  |  5 kotak → 3.2x
  3 kotak → 2.0x  |  6 kotak → 4.0x
  7 kotak → 5.5x  |  9 kotak → 10.0x
  8 kotak → 7.5x  |  10+ kotak → 15–50x!

!mines / !bom <taruhan>  → Mulai sesi
!gali / !open <1–12>     → Buka kotak
!stop / !cashout          → Ambil kemenangan
  (Jika kena bom setelah 3 kotak: asuransi aktif!)

Contoh sesi: !bom 5000000 → !gali 3 → !gali 7 → !stop

${'─'.repeat(30)}
⚔️ *PvP DUEL & BATTLE*

!duel @user <taruhan>
  Mekanik: 50:50 murni (koin dilempar)
  Pajak: 10% dari taruhan (masuk bot)
  Pemenang dapat: taruhan lawan - pajak 10%
  Event Duel Berhadiah: +Rp 2 Juta bonus!
  Contoh: !duel @teman 10000000
  └ !terima → terima tantangan
  └ !tolak  → tolak tantangan

!pvp / !battle @user
  Battle RPG bergantian. Balas: !terima
  Menyerah: !nyerah / !stopbattle / !surrender

${'─'.repeat(30)}
🧠 *TEBAK BERHADIAH*

!tebakgambar  → Tebak dari gambar petunjuk
!asahotak     → Tebak kata dari kalimat asosiasi
!susunkata    → Susun huruf acak jadi kata yang benar
  └ !hint     → Minta petunjuk (reward berkurang)
  └ !nyerah   → Lihat jawaban (reward hangus)

!wordle       → Tebak kata 5 huruf (gaya NYT)
  └ !wordlestop   → Stop sesi
  └ !wordleskor   → Lihat skormu

!trivia       → Quiz trivia acak
  └ !triviastop      → Stop sesi
  └ !triviaskor      → Leaderboard trivia
  └ !trivialeader    → Leaderboard global

${'─'.repeat(30)}
💡 *PRO-TIPS GAME*

• 🎰 Tunggu event *Winrate Gila* sebelum casino besar
  → Winrate 85% vs 35% = keuntungan 2.4x lebih besar!
• 💎 Di slot, tebak jackpot 💎 karena payout 75x!
• 🎯 Roulette: tebak angka spesifik = payout 15x
  → Lebih menguntungkan daripada merah/hitam (x2)
• 💣 Mines: cashout di 5–6 kotak (3.2x–4x) adalah
  sweet spot risiko vs reward. Jangan serakah!
• ⚔️ Duel besar saat event *Duel Berhadiah* aktif
  → Dapat bonus +2 Juta di atas kemenangan normal

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu minigame
    // ══════════════════════════════════════════════════════════════
    if (['minigame','catur','chess','slither','rpg','akinator','trivia'].includes(sub)) {
        return msg.reply(
`🕹️ *MINI GAME INTERAKTIF — PANDUAN LENGKAP*
${'━'.repeat(30)}

♟️ *CATUR (CHESS)*
  Bermain catur vs AI di browser.
  Taruhan saldo berlaku — menang atau kalah nyata!

  !catur easy   → Level mudah (pemula)
  !catur medium → Level sedang (default)
  !catur hard   → Level susah (master)
  Contoh: !catur medium

🐍 *SLITHER (ULAR)*
  Main Slither.io di browser.
  !slither / !snake         → Buka link game
  !claimslither <kode>      → Klaim skor/reward selesai

⚔️ *RPG BROWSER BATTLE*
  Lawan musuh AI di game RPG berbasis browser.
  !rpg / !battle             → Buka link RPG
  !claim / !redeem <kode>    → Klaim reward kemenangan

🧠 *AKINATOR — TEBAK PIKIRAN*
  AI akan bertanya untuk menebak pikiranmu.
  Jawab Ya/Tidak, Akinator mencoba menebak
  tokoh/karakter yang kamu pikirkan.

  !akinator              → Mulai sesi
  !ya                    → Jawab "Ya"
  !tidak                 → Jawab "Tidak"
  !akinatorberhenti      → Hentikan sesi

⏳ *TIME MACHINE*
  Bot kirim ulang momen chat di jam yang sama
  tapi dari masa lalu — nostalgia grup!

  !timemachine / !flashback / !dejavu
  → Bot akan pilih pesan random dari database
    log chat di jam yang sama seperti sekarang

${'─'.repeat(30)}
💡 *PRO-TIPS MINI GAME*

• ♟️ Catur: Kuasai opening standard (e4 e5, d4 d5)
  sebelum naik ke level medium/hard
• 🧠 Akinator: Pikirkan tokoh anime/film populer
  Indonesia — Akinator lebih pintar untuk karakter global
• ⚔️ RPG: Klaim reward segera setelah menang,
  kode klaim kadaluarsa dalam waktu terbatas!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu bola
    // ══════════════════════════════════════════════════════════════
    if (['bola','sport','betting','parlay'].includes(sub)) {
        return msg.reply(
`⚽ *SPORTSBOOK — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Pasang taruhan sebelum pertandingan mulai.
Hasil ditentukan admin via !resultbola.
Odds berubah sesuai kondisi yang diinput admin.
Mix Parlay: odds semua leg dikali (bisa >100x!)

${'─'.repeat(30)}
📚 *PANDUAN SUB-MENU*
• !menu bolaajar  → Pengenalan judi bola (pemula)
• !menu odds      → Cara baca & hitung odds
• !menu 1x2       → Taruhan Home/Draw/Away
• !menu hdp       → Asian Handicap (Voor)
• !menu ou        → Over/Under (jumlah gol)
• !menu parlayajar→ Mix Parlay step-by-step

${'─'.repeat(30)}
⌨️ *SEMUA COMMAND TARUHAN*

!bola
  → Lihat semua pertandingan aktif + ID match

!odds <ID>
  → Detail odds + garis HDP + O/U suatu match
  → Contoh: !odds AB12

!bet <ID> <jenis> <pilihan> <jumlah>
  → Pasang taruhan tunggal
  → Jenis: 1x2  |  hdp  |  ou
  → Pilihan 1x2: h (home) | d (draw) | a (away)
  → Pilihan ou : o (over)  | u (under)
  → Contoh: !bet AB12 1x2 h 5000000
  → Contoh: !bet AB12 hdp a 3000000
  → Contoh: !bet AB12 ou o 2000000

!parlay <ID> <jenis> <pilihan>
  → Tambah 1 leg ke slip parlay
  → Contoh: !parlay AB12 1x2 h
  → Contoh: !parlay CD34 ou o
  → Contoh: !parlay EF56 hdp a

!parlaylihat   → Cek slip parlay + total odds
!parlaybet <jumlah>  → Pasang semua leg parlay
  → Contoh: !parlaybet 1000000
!parlaybatal   → Kosongkan slip parlay

!mybets        → Riwayat semua taruhanmu
!topbola       → Leaderboard profit betting

🔧 *ADMIN BOLA*
!addbola → !updatebola → !resultbola
!tutupbola → !hapusbola

${'─'.repeat(30)}
💡 *PRO-TIPS SPORTSBOOK*

• 🔢 Mulai dengan *1X2* — paling mudah dipahami
• 🎯 Odds 1.70–1.90 = sweet spot profit vs risiko
• 🎰 Parlay 3–4 leg (odds ~8–10x) lebih masuk akal
  daripada 8 leg yang hampir mustahil semua benar
• 📊 Baca !menu hdp sebelum pasang handicap —
  sistem refund bisa menyelamatkan taruhanmu!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    if (sub === 'bolaajar') {
        return msg.reply(
`🔰 *PANDUAN JUDI BOLA — UNTUK PEMULA*
${'━'.repeat(30)}

*Apa itu Taruhan Bola?*
Kamu memasang uang untuk menebak hasil
pertandingan sepak bola. Benar → dapat lebih.
Salah → uang hangus.

*Apa itu Odds?*
Angka pengali kemenangan. Makin tinggi odds,
makin jarang terjadi, makin besar keuntungan.

Rumus: *Kemenangan = Taruhan × Odds*

Contoh: !bet AB12 1x2 h 100000
(Odds home 1.85 → menang dapat Rp 185.000)

${'─'.repeat(30)}
🎯 *3 JENIS TARUHAN UTAMA*

1️⃣ *1X2* — Paling mudah
   Tebak: Home menang / Seri / Away menang
   → !menu 1x2 untuk panduan detail

2️⃣ *Asian Handicap (HDP)* — Menengah
   Sistem voor agar taruhan lebih seimbang
   → !menu hdp untuk panduan detail

3️⃣ *Over/Under (O/U)* — Menengah
   Tebak jumlah total gol lebih/kurang dari garis
   → !menu ou untuk panduan detail

🎰 *Mix Parlay* — Lanjutan
   Gabung banyak match → odds dikali → potensi besar
   → !menu parlayajar untuk panduan detail

${'─'.repeat(30)}
⚠️ Mulai dari taruhan kecil dulu!
↩️ Balik: *!menu bola*`
        );
    }

    if (sub === 'odds') {
        return msg.reply(
`📊 *CARA BACA ODDS — PANDUAN*
${'━'.repeat(30)}

Odds = angka pengali uangmu jika menang.

💰 Hasil  = Taruhan × Odds
📈 Untung = Hasil - Taruhan

*Contoh: Man City vs Arsenal*
  🏠 Man City menang : *1.75*
  🤝 Seri            : *3.50*
  ✈️ Arsenal menang  : *4.20*

Bet Rp 200.000 → Man City:
  ✅ Menang: 200.000 × 1.75 = *Rp 350.000* (+150k)
  ❌ Kalah : Rp 200.000 hangus

${'─'.repeat(30)}
🔍 *ARTI NILAI ODDS*
  1.10–1.40 → Favorit berat (untung kecil, sering menang)
  1.70–2.10 → Tim kuat (odds ideal untuk pemula)
  2.50–4.00 → Underdog (untung besar, jarang menang)
  5.00+     → Outsider besar (sangat jarang menang)

💡 Seri selalu odds tinggi (~3.40+) karena
   memang jarang terjadi di sepak bola.

↩️ Balik: *!menu bola*`
        );
    }

    if (sub === '1x2') {
        return msg.reply(
`🎯 *TARUHAN 1X2 — PANDUAN*
${'━'.repeat(30)}

*Pilihan:*  1=Home  X=Seri  2=Away

*Contoh: Liverpool (H) vs Chelsea (A)*
  🏠 Liverpool: *1.85*  🤝 Seri: *3.40*  ✈️ Chelsea: *4.00*

Bet Rp 500.000:
  Liverpool → ✅ ×1.85 = *Rp 925.000*
  Seri      → ✅ ×3.40 = *Rp 1.700.000*
  Chelsea   → ✅ ×4.00 = *Rp 2.000.000*

*Cara pasang (ID: LV12):*
  !bet LV12 1x2 h 500000  → Home
  !bet LV12 1x2 d 500000  → Seri
  !bet LV12 1x2 a 500000  → Away

💡 Tips: Odds rendah = favorit. Hindari seri
   jika tidak yakin — paling susah diprediksi.

↩️ Balik: *!menu bola*`
        );
    }

    if (sub === 'hdp') {
        return msg.reply(
`⚖️ *ASIAN HANDICAP — PANDUAN*
${'━'.repeat(30)}

Sistem voor untuk menyeimbangkan taruhan.
Tim favorit dapat handicap minus (-).

*Garis Handicap Umum:*
  HDP 0      → Seri = REFUND
  HDP -0.25  → Seri = kalah SETENGAH (refund 50%)
  HDP -0.5   → Home harus menang ≥ 1 gol
  HDP -1     → Home harus menang ≥ 2 gol
               (Selisih 1 gol = REFUND)
  HDP -1.5   → Home harus menang ≥ 2 gol (no refund)

*Contoh: Real Madrid -1 vs Atletico*
  Madrid menang 3-0 → ✅ *MENANG*
  Madrid menang 2-1 → ❌ *KALAH*
  Madrid menang 1-0 → 🔄 *REFUND* (uang kembali)
  Seri / Atletico   → ❌ *KALAH*

*Cara pasang:*
  !bet LV12 hdp h 200000  → Bet Home (tim unggul)
  !bet LV12 hdp a 200000  → Bet Away (tim dapat voor)

💡 Tips: Bet Away jika tim lemah diunggulkan
   menahan selisih. HDP kecil = risiko lebih aman.

↩️ Balik: *!menu bola*`
        );
    }

    if (sub === 'ou') {
        return msg.reply(
`📈 *OVER/UNDER — PANDUAN*
${'━'.repeat(30)}

Tebak total gol kedua tim. Tidak perlu
tahu siapa yang menang!

*Garis O/U Umum:*
  2.5 → Over ≥ 3 gol  |  Under ≤ 2 gol
  3.0 → Over ≥ 4 gol  |  Under ≤ 2 gol (tepat 3 = refund)
  3.5 → Over ≥ 4 gol  |  Under ≤ 3 gol

*Contoh: Barcelona vs PSG — O/U 2.5*
  Skor 2-1 (3 gol) → Over ✅ *MENANG* → ×1.90
  Skor 1-0 (1 gol) → Under ✅ *MENANG* → ×1.90
  (Jika bet Over Rp 300k → dapat Rp 570.000)

*Cara pasang:*
  !bet LV12 ou o 300000  → Bet Over
  !bet LV12 ou u 300000  → Bet Under

💡 Tim ofensif (PSG, Liverpool) → cenderung Over
   Tim defensive (Atletico) → cenderung Under

↩️ Balik: *!menu bola*`
        );
    }

    if (sub === 'parlayajar') {
        return msg.reply(
`🎰 *MIX PARLAY — PANDUAN*
${'━'.repeat(30)}

Gabung banyak taruhan → odds semua leg DIKALI.
✅ Semua harus benar  |  ❌ Satu salah = semua hangus

*Contoh 3 leg:*
  Match 1: Man City H  | odds 1.75
  Match 2: Over 2.5    | odds 1.90
  Match 3: Real Madrid H | odds 1.80
  Total odds = 1.75 × 1.90 × 1.80 = *5.985*
  Modal Rp 100.000 → dapat *Rp 598.500*!

*Potensi 5 leg (odds rata 1.85):*
  1.85⁵ = 22× → Modal 100k → Rp 2.218.000

*Step-by-step:*
  1. !bola                 → Lihat match
  2. !parlay AB12 1x2 h   → Tambah leg 1
  3. !parlay CD34 ou o    → Tambah leg 2
  4. !parlaylihat          → Cek total odds
  5. !parlaybet 100000     → Pasang!
  6. !parlaybatal          → Batal

*Aturan:*
  Min 2 leg — Maks 8 leg
  Satu match hanya 1 kali
  Leg draw = dihapus, odds recalculate

💡 Tips: 2–4 leg = keseimbangan terbaik.
   8 leg hampir mustahil semua benar!

↩️ Balik: *!menu bola*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu farming
    // ══════════════════════════════════════════════════════════════
    if (['farming','tani','pertanian','pabrik'].includes(sub)) {
        return msg.reply(
`🌾 *FARMING & INDUSTRI — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Tanaman tumbuh otomatis berdasarkan waktu nyata.
Harga jual berfluktuasi setiap saat (cek !pasar).
Mesin pabrik mengolah hasil mentah → harga naik drastis!
Event *Musim Panen*: harga jual ×3 dari normal!
Event *Borong Pasar*: diskon beli mesin/benih 50%!

${'─'.repeat(30)}
🌱 *DATA TANAMAN (AKURAT)*
┌──────────────────────────────────────────┐
│ PADI    │ Modal: 2jt  │ Waktu: 20 mnt   │
│         │ Jual mentah: 2.2–2.5 jt        │
├──────────────────────────────────────────┤
│ JAGUNG  │ Modal: 5jt  │ Waktu: 1 jam    │
│         │ Jual mentah: 6–7 jt            │
├──────────────────────────────────────────┤
│ BAWANG  │ Modal: 10jt │ Waktu: 2 jam    │
│         │ Jual mentah: 13–15 jt          │
├──────────────────────────────────────────┤
│ KOPI    │ Modal: 25jt │ Waktu: 4 jam    │
│         │ Jual mentah: 32–38 jt          │
├──────────────────────────────────────────┤
│ SAWIT   │ Modal: 50jt │ Waktu: 8 jam    │
│         │ Jual mentah: 75–90 jt          │
└──────────────────────────────────────────┘

🏭 *MESIN PABRIK — NILAI TAMBAH PRODUK*
┌──────────────────────────────────────────┐
│ gilingan     │ Padi → Beras              │
│              │ Jual: Rp 6 jt (dari 2.5jt)│
│              │ Waktu olah: 25 mnt/item   │
├──────────────────────────────────────────┤
│ popcorn_maker│ Jagung → Popcorn          │
│              │ Jual: Rp 18 jt (dari 7jt) │
│              │ Waktu: 30 mnt/item        │
├──────────────────────────────────────────┤
│ penggorengan │ Bawang → Bawang Goreng    │
│              │ Jual: Rp 40 jt (dari 15jt)│
│              │ Waktu: 45 mnt/item        │
├──────────────────────────────────────────┤
│ roaster      │ Kopi → Kopi Bubuk         │
│              │ Jual: Rp 100 jt (dari 38jt│
│              │ Waktu: 1 jam/item         │
├──────────────────────────────────────────┤
│ pabrik_minyak│ Sawit → Minyak Goreng     │
│              │ Jual: Rp 250 jt (dari 90jt│
│              │ Waktu: 2 jam/item         │
└──────────────────────────────────────────┘

⌨️ *COMMAND & USAGE*

!farming / !tani / !farmer
  → Panduan farming + status ladang saat ini

!tanam <nama>
  → Mulai menanam. Contoh: !tanam sawit

!ladang
  → Cek status semua tanaman + waktu panen

!panen
  → Ambil semua hasil yang sudah matang

!pasar
  → Cek harga jual komoditas hari ini

!jual <nama> <jumlah>
  → Jual hasil panen / olahan
  → Contoh: !jual beras 10

!toko
  → Lihat daftar mesin pabrik + harga

!beli <mesin>
  → Beli mesin pabrik (event Borong Pasar = -50%)
  → Contoh: !beli pabrik_minyak

!olah / !produksi <mesin> <jumlah>
  → Masukkan bahan ke mesin
  → Contoh: !olah roaster 5

!pabrik
  → Cek status mesin + ambil hasil olahan

${'─'.repeat(30)}
🏭 *INDUSTRI BERSAMA (PABRIK MULTIPLAYER)*

!pabrikhelp / !panduanpabrik / !pabrik help
  → Panduan sistem industri bersama

Bos pabrik: !bangunpabrik | !hire | !fire
            !gudang | !jualproduk | !service
Karyawan: !craft <bahan> <jml> | !ngopi | !resign

${'─'.repeat(30)}
💡 *PRO-TIPS FARMING*

🏆 *Strategi paling profit:*
1. Tanam SAWIT → olah ke pabrik_minyak
   Modal 50jt → Jual 250jt = *profit 5x* per 10 jam!
2. Jual SAAT event Musim Panen → harga ×3
   250jt × 3 = *Rp 750 juta* per harvest!
3. Beli mesin saat event Borong Pasar → diskon 50%

📈 *Strategi efisien waktu:*
• Pagi hari: tanam sawit (8 jam jalan sendiri)
• Siang: ambil sawit, masuk pabrik minyak
• Sore: ambil minyak, jual. Tanam lagi!
• Cek !pasar sebelum jual — naik turun tiap saat

🌾 *Bonus Petani:*
• Pakai !skill sebagai Petani → panen -3 jam
  Sawit selesai dalam 5 jam, bukan 8 jam!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu ternak
    // ══════════════════════════════════════════════════════════════
    if (['ternak','ranch','hewan','kandang'].includes(sub)) {
        return msg.reply(
`🐄 *PETERNAKAN — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Hewan tumbuh berdasarkan seberapa sering diberi makan.
Jenis pakan menentukan kecepatan tumbuh (growth rate).
Hewan tidak makan > 24 jam → MATI (bangkai laku murah).
Jual saat berat MAKSIMAL + kondisi SEHAT → bonus +10%.
Event *Musim Panen*: jual hewan ×3 harga normal!
Event *Borong Pasar*: beli hewan diskon 50%!

${'─'.repeat(30)}
🐾 *DATA HEWAN TERNAK (AKURAT)*
┌──────────────────────────────────────────┐
│ 🐔 AYAM     │ Beli: 50rb   │ Max: 3 kg  │
│             │ Jual: ~Rp 180rb (60rb/kg)  │
│             │ Lapar: tiap 1 jam           │
├──────────────────────────────────────────┤
│ 🐟 GURAME   │ Beli: 200rb  │ Max: 5 kg  │
│             │ Jual: ~Rp 750rb (150rb/kg) │
│             │ Lapar: tiap 1.5 jam         │
├──────────────────────────────────────────┤
│ 🐐 KAMBING  │ Beli: 3 jt   │ Max: 60 kg │
│             │ Jual: ~Rp 6 jt (100rb/kg)  │
│             │ Lapar: tiap 3 jam           │
├──────────────────────────────────────────┤
│ 🐄 SAPI     │ Beli: 15 jt  │ Max: 700 kg│
│             │ Jual: ~Rp 35 jt (50rb/kg)  │
│             │ Lapar: tiap 6 jam           │
├──────────────────────────────────────────┤
│ 🐎 KUDA     │ Beli: 40 jt  │ Max: 500 kg│
│             │ Jual: ~Rp 100 jt (200rb/kg)│
│             │ Lapar: tiap 5 jam           │
├──────────────────────────────────────────┤
│ 🐫 UNTA     │ Beli: 80 jt  │ Max: 1 ton │
│             │ Jual: ~Rp 150 jt (150rb/kg)│
│             │ Lapar: tiap 8 jam           │
└──────────────────────────────────────────┘

🌿 *JENIS PAKAN*
  🌾 Dedak   (Rp 2.000) → Growth ×0.3 (lambat, murah)
  💊 Pelet   (Rp 10.000)→ Growth ×0.6 (standar)
  🥩 Premium (Rp 40.000)→ Growth ×1.2 (cepat, mahal)
  💉 Obat    (Rp 50.000)→ Sembuhkan hewan sakit

⌨️ *COMMAND & USAGE*

!ternak         → Panduan + status kandang

!kandang        → Lihat semua hewan (berat, lapar, sakit)

!belihewan      → Katalog hewan + harga
!belihewan <jenis>
  → Beli hewan. Contoh: !belihewan sapi

!tokopakan      → Lihat stok & harga pakan
!belipakan <jenis> <jumlah>
  → Beli stok pakan. Contoh: !belipakan premium 50

!pakan / !feed <no> <jenis>
  → Beri makan hewan nomor tertentu
  → Contoh: !pakan 1 premium

!obati <no>
  → Obati hewan sakit agar tumbuh lagi

!jualhewan <no>
  → Jual hewan (harga = berat × harga/kg)
  → Jual saat berat max + sehat = +10% bonus!

${'─'.repeat(30)}
💡 *PRO-TIPS PETERNAKAN*

🏆 *Strategi profit tertinggi:*
• SAPI adalah sweet spot: modal 15jt, jual 35jt,
  butuh pakan rutin tiap 6 jam → profit 2.3× modal
• Pakai pakan PREMIUM untuk percepat gemuk,
  tapi hitung biaya: 50× premium = Rp 2 juta
• Beli hewan saat event Borong Pasar (diskon 50%)
  → Sapi dari 15jt jadi 7.5jt!

🤠 *Bonus Peternak:*
• Pakai !skill sebagai Peternak → hewan langsung
  lapar lagi (bisa diberi pakan extra tanpa nunggu)
  = pertumbuhan lebih cepat!

⚠️ *Jangan lupa:*
• Set !remind tiap 6 jam untuk kasih makan sapi
• Hewan sakit tidak tumbuh — langsung !obati

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu mining
    // ══════════════════════════════════════════════════════════════
    if (['mining','tambang','btc','miner','crypto'].includes(sub)) {
        return msg.reply(
`⛏️ *MINING & CRYPTO — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Setiap hardware menghasilkan BTC berdasarkan hashrate.
Produksi BTC: *0.000481 BTC per MH/s per jam*.
Listrik: *Rp 15.000 per MH/s per jam* (auto-potong).
Offline maksimal diperhitungkan: *24 jam*.
Hardware illegal lebih kencang tapi berisiko razia!
Event *Rush Tambang*: hasil ×5, cooldown 0, listrik gratis!

${'─'.repeat(30)}
🖥️ *DATA HARDWARE MINING (AKURAT)*

⚙️ *LEGAL (dari !shopminer)*
  🟢 RTX 4070 Ti    → 160 MH/s | Rp 4 Miliar
  🔵 RTX 4090 OC    → 400 MH/s | Rp 9.5 Miliar
  🟣 Dual 4090       → 640 MH/s | Rp 15 Miliar
  🟠 Antminer S19   → 800 MH/s | Rp 18 Miliar

🏴‍☠️ *ILLEGAL (dari !blackmarket)*
  USB Miner Hack     → 100 MH/s | Rp 1.5 M | Risiko 10%
  Quantum Rig        → 1500 MH/s| Rp 25 M  | Risiko 25%

🔧 *UPGRADE RIG*
  🧊 Cooling  → Kurangi overheat
  ⚡ PSU      → *Hemat listrik 30%* (wajib beli!)
  🛡️ Firewall → Kebal dari !hack user lain

⌨️ *COMMAND & USAGE*

!panduanminer / !rulesminer / !guide
  → Baca panduan mining WAJIB sebelum mulai!

!mining / !miner
  → Dashboard rig: hashrate, listrik, BTC terkumpul

!claimmining
  → Panen BTC (listrik dipotong otomatis saat ini)

!shopminer
  → Toko VGA legal (harga naik-turun tiap jam!)

!belivga / !buyvga <kode>
  → Beli hardware. Contoh: !belivga rtx4090

!bm / !blackmarket
  → Hardware illegal (lebih kencang, ada risiko razia)

!upgrade <jenis>
  → Contoh: !upgrade psu | !upgrade firewall

!hack @user
  → Curi BTC user lain (butuh Firewall agar kebal balik)

!topminer   → Ranking BTC terbanyak
!tophash    → Ranking hashrate tertinggi

💹 *TRADING CRYPTO*
!market / !crypto         → Harga live semua koin
!buycrypto <koin> <Rp>   → Beli. Fee: 0.1%
!sellcrypto <koin> <jml>  → Jual. Fee: 1% + pajak 0.2%
!pf / !porto              → Portofolio + unrealized P/L
!margin                   → Pinjam leverage (hati-hati!)
!paydebt                  → Bayar margin debt

${'─'.repeat(30)}
💡 *PRO-TIPS MINING*

🏆 *Setup ideal:*
1. Beli PSU upgrade PERTAMA → hemat listrik 30%
   Tanpa PSU: 400 MH/s × 15.000 = 6 jt/jam listrik
   Dengan PSU: hanya 4.2 jt/jam → hemat 1.8 jt/jam!
2. Beli Firewall setelah modal BTC terkumpul banyak
3. RTX 4090 = best legal ratio hashrate/harga

📈 *Kalkulasi profit RTX 4090:*
  Hashrate: 400 MH/s
  BTC/jam : 400 × 0.000481 = 0.192 BTC/jam
  Listrik : 400 × 15.000 × 0.7 (PSU) = 4.2 jt/jam
  → Pastikan harga BTC cukup untuk nutup listrik!

⚠️ *Hindari:*
• Jangan !claimmining saat saldo kurang dari tagihan listrik
• Quantum Rig: 25% risiko razia = alat disita polisi!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu investasi
    // ══════════════════════════════════════════════════════════════
    if (['investasi','saham','valas','forex'].includes(sub)) {
        return msg.reply(
`📈 *INVESTASI — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Harga saham diambil *real-time dari Yahoo Finance*.
Saham tersedia: BBCA, BBRI, BMRI, TLKM, ASII,
                UNTR, GOTO, ANTM, ADRO, BREN
Crypto: harga real dari CoinGecko API.
Kurs valas: update berkala dari API eksternal.
Trading crypto fee beli: 0.1% | fee jual: 1% + pajak 0.2%.

${'─'.repeat(30)}
⌨️ *COMMAND & USAGE*

📊 *SAHAM BEI*
!saham / !stock / !market
  → Cek semua harga saham real-time

!belisaham / !buystock <kode> <jumlah>
  → Beli saham. Contoh: !belisaham BBCA 100

!jualsaham / !sellstock <kode> <jumlah>
  → Jual saham. Contoh: !jualsaham BBCA 50

!chart / !grafik <kode>
  → Grafik harga 1 bulan. Contoh: !chart BBCA

!pf / !porto
  → Portofolio semua aset + unrealized P/L

!dividen
  → Klaim dividen (jika periode aktif)

💱 *VALAS & EMAS*
!kurs / !valas    → Kurs live: USD, EUR, JPY, Emas
!kurspro / !kursupdate → Kurs lengkap + tren 7 hari
!dollar           → Kurs USD/IDR hari ini
!beliemas <gram>  → Beli emas
!jualemas <gram>  → Jual emas
!beliusd <Rp>     → Beli Dollar
!belieur <Rp>     → Beli Euro
!belijpy <Rp>     → Beli Yen
!jualusd / !jualeur / !jualjpy → Jual kembali ke IDR
!aset / !porto / !portofolio → Lihat semua aset valas

₿ *CRYPTO*
!market / !crypto    → Harga 20 kripto teratas
!btc / !bitcoin      → Harga BTC terkini
!buycrypto <koin> <Rp> → Beli crypto
!sellcrypto <koin> <jml> → Jual crypto

${'─'.repeat(30)}
💡 *PRO-TIPS INVESTASI*

📊 *Strategi Saham:*
• Beli saat harga rendah (market turun), jual saat naik
• Diversifikasi: jangan taruh semua di satu saham
• BBCA & BBRI cenderung stabil vs GOTO yang volatil

🥇 *Strategi Emas:*
• Emas = safe haven — naik saat ekonomi global lesu
• Beli emas sebagai "asuransi" portofolio

💱 *Strategi Valas:*
• USD cenderung menguat saat kondisi global tidak menentu
• !kurspro untuk lihat tren 7 hari sebelum beli

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu properti
    // ══════════════════════════════════════════════════════════════
    if (['properti','property','bisnis','usaha','passive'].includes(sub)) {
        return msg.reply(
`🏢 *PROPERTI & BISNIS PASIF — PANDUAN*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Bisnis menghasilkan pendapatan pasif setiap jam.
Tiap bisnis punya *cap pendapatan* (batas maksimal).
Kamu harus !collect secara berkala agar cap tidak penuh.
Cap penuh = bisnis berhenti menghasilkan!

${'─'.repeat(30)}
🏪 *DAFTAR BISNIS (SEMUA TIER)*

Tier 1 — Pedagang (Jutaan)
  🍡 Gerobak Cilok     │ Beli: 5 jt  │ +25rb/jam   │ Cap 500rb
  📱 Kios Pulsa         │ Beli: 20 jt │ +120rb/jam  │ Cap 2.5jt
  🧺 Laundry Kiloan     │ Beli: 50 jt │ +350rb/jam  │ Cap 7jt

Tier 2 — Juragan (Ratusan Juta)
  💻 Warnet Gaming      │ Beli: 150jt │ +1.2jt/jam  │ Cap 25jt
  ☕ Coffee Shop Hits   │ Beli: 400jt │ +3.5jt/jam  │ Cap 80jt
  🏪 Minimarket 24 Jam  │ Beli: 850jt │ +8jt/jam    │ Cap 200jt

Tier 3 — Boss Besar (Miliaran)
  🏭 Pabrik Tekstil     │ Beli: 2.5M  │ +25jt/jam   │ Cap 600jt
  ⛽ SPBU Pom Bensin    │ Beli: 7M    │ +80jt/jam   │ Cap 2M
  🏨 Hotel Bintang 5    │ Beli: 15M   │ +180jt/jam  │ Cap 5M

Tier 4 — Konglomerat (Puluhan Miliar)
  🏙️ Mall Grand Indonesia│ Beli: 50M  │ +650jt/jam  │ Cap 15M
  ✈️ Maskapai Penerbangan│ Beli: 200M │ +3M/jam     │ Cap 80M
  🛰️ Stasiun Luar Angkasa│ Beli: 1T  │ +15M/jam    │ Cap ∞

⌨️ *COMMAND & USAGE*

!properti / !property
  → Lihat semua bisnis yang kamu miliki + pendapatan

!beliusaha / !buybusiness <id>
  → Beli bisnis. Contoh: !beliusaha hotel

!collect / !tagih / !panen
  → Ambil semua pendapatan dari semua bisnis

${'─'.repeat(30)}
💡 *PRO-TIPS PROPERTI*

• Set !remind untuk !collect tiap beberapa jam
  → Cap penuh = bisnis berhenti menghasilkan!
• Hotel Bintang 5 = best bang for buck di Tier 3
  (modal 15M, +180jt/jam, cap 5M → penuh ~28 jam)
• Mulai dari Kios Pulsa → Warnet → Coffee Shop
  sambil menabung untuk tier lebih tinggi

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu negara
    // ══════════════════════════════════════════════════════════════
    if (['negara','war','perang','nation'].includes(sub)) {
        return msg.reply(
`🏳️ *NEGARA & PERANG — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Negara adalah entitas strategis jangka panjang.
Infrastruktur menentukan kekuatan pajak & pertahanan.
Perang ditentukan kekuatan tentara + bangunan + riset.
Kalah perang → kas negara dirampas musuh!
Spionase berisiko gagal — agen bisa ketahuan.

${'─'.repeat(30)}
🌏 *MULAI NEGARA*
!buatnegara <nama>  → Buat negara (Biaya: Rp 5 Miliar!)
!negara / !nation   → Dashboard negaramu
!sensus             → Data kependudukan & kekuatan
!statsnegara        → Statistik detail
!topnegara / !listnegara → Ranking semua negara
!renamekan <nama>   → Ganti nama negara

${'─'.repeat(30)}
🏗️ *INFRASTRUKTUR (HARGA PER LEVEL)*
  🏦 Bank Sentral      → Rp 10 M/lv | Pajak +15%/lv
  🏰 Benteng           → Rp 25 M/lv | Defense +25%/lv
  🏥 Rumah Sakit       → Rp 5 M/lv  | Kurangi korban perang
  🕵️ Markas Intelijen → Rp 15 M/lv | Buka misi spionase
  🚀 Silo Rudal        → Rp 50 M    | Produksi & simpan rudal
  📡 Radar             → Rp 30 M/lv | Tangkis rudal 15%/lv
  ☢️ Lab Nuklir        → Rp 80 M    | Produksi bom nuklir
  🏭 Kilang Industri   → Rp 20 M/lv | Pajak +10%/lv
  ⚓ Dermaga Militer   → Rp 35 M    | Blokade lebih efektif
  🎓 Universitas Riset → Rp 12 M    | Buka riset teknologi
  🌿 Kebun Rakyat      → Rp 3 M/lv  | Stabilitas +1/jam
  ⛓️ Penjara Negara   → Rp 8 M     | Tangkap agen +20%

!bangun / !build <kode>  → Bangun infrastruktur
  Contoh: !bangun bank | !bangun benteng
!demolish <kode>         → Bongkar bangunan (refund 50%)

${'─'.repeat(30)}
🔬 *RISET TEKNOLOGI*
  !riset rudal_pintar  → Rp 10M | Rudal 30% lebih akurat
  !riset agen_elite    → Rp 15M | Misi spy +15% sukses
  !riset ekonomi_maju  → Rp 20M | Pajak +25% bonus
  !riset armor_baja    → Rp 25M | Defense +15% pasif
  !riset drone_serang  → Rp 30M | Serangan -20% kerugian

${'─'.repeat(30)}
⚔️ *MILITER & PERANG*
!rekrut <jml>          → Beli tentara (Rp 50 jt/orang)
!demobilisasi <jml>    → Kurangi tentara (refund 40%)
!serang / !war @target → Serangan militer konvensional
!serangangudara @target→ Serangan udara (butuh silo+rudal)
!bangunrudal <jml>     → Produksi rudal
!bangunbom <jml>       → Produksi bom nuklir (butuh lab nuklir)
!perisai               → Aktifkan perisai 2 jam
!blokade @target       → Blokade ekonomi tanpa perang
!gencatan @target      → Tawarkan gencatan senjata
!terimagencatan        → Terima gencatan dari musuh

${'─'.repeat(30)}
🤝 *DIPLOMASI & ALIANSI*
!aliansi @target       → Ajukan pakta aliansi
!terimaliansi          → Terima tawaran aliansi
!tolaklansi            → Tolak tawaran aliansi
!bubaraliansi          → Bubarkan aliansi
!listaliansi           → Daftar semua aliansi

${'─'.repeat(30)}
💰 *EKONOMI NEGARA*
!pajaknegara           → Pungut pajak dari rakyat
!subsidi <jml/all>     → Transfer pribadi → kas negara
!tarikkas <jml>        → Ambil uang dari kas
!korupsi <jml>         → ⚠️ Korupsi berlebihan = kudeta!
!propaganda            → Naikkan loyalitas rakyat

${'─'.repeat(30)}
🕵️ *SPIONASE (Butuh Markas Intelijen)*
!identitasagen          → Cek identitas agenmu
!laporanmata            → Laporan terkini dari agen
!spionase @target       → Intai negara lain
!sadap @target          → Sadap komunikasi musuh
!sabotase @target       → Rusak bangunan (50% sukses)
!teror @target          → Semai kerusuhan (55%)
!kudeta @target         → Pemberontakan (30%)
!racun @target          → Eliminasi tentara (40%)
!suap @target           → Suap pejabat musuh
!curi @target           → Curi teknologi riset
!tarikagen              → Tarik agen dari lapangan

!resetmynation          → Reset negaramu (hati-hati!)

${'─'.repeat(30)}
💡 *PRO-TIPS NEGARA*

• Bangun Bank + Kilang dulu → naikkan pendapatan pajak
• Benteng level tinggi = susah dikalahkan
• Riset sebelum serangan besar → efek signifikan
• Jangan korupsi terlalu sering → risiko kudeta!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu event
    // ══════════════════════════════════════════════════════════════
    if (['event','abuse','adminabuse'].includes(sub)) {
        return msg.reply(
`🎉 *ADMIN ABUSE EVENT — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Admin grup mengaktifkan sesi event 30 menit.
Event berganti otomatis tiap ~1 menit (acak).
Semua grup whitelist mendapat event bersamaan.
Beberapa event perlu jawaban/ketikan tercepat.

${'─'.repeat(30)}
⚡ *KONTROL EVENT (Admin Grup)*
!adminabuseon  → 🟢 Mulai sesi event 30 menit
!adminabuseoff → 🔴 Matikan paksa event
!abuseinfo     → ℹ️ Status event yang aktif sekarang

${'─'.repeat(30)}
📋 *10 EVENT RANDOM — DETAIL MEKANIK*

 1. 🌧️ *Hujan Uang*
    Bot kirim koin gratis ke semua user aktif

 2. 🎰 *Jackpot Bersama*
    Taruh 50rb → bot kumpulkan → 1 orang menang semua
    Makin banyak peserta = jackpot makin besar!

 3. 🛒 *Borong Pasar*
    Semua item toko, benih, hewan diskon 50%
    Waktu terbatas — borong sekarang!

 4. ☄️ *Meteor Langka*
    Bot kirim pesan, ketik "KLAIM" pertama = menang
    Reward berbeda tiap meteor (common → mythical)

 5. 🌾 *Musim Panen*
    Harga jual pertanian & ternak ×3 dari normal
    Segera !panen dan !jualhewan saat event ini!

 6. ⛏️ *Rush Tambang*
    Hasil BTC ×5 | Cooldown 0 | Listrik GRATIS
    Terbaik: langsung !claimmining berkali-kali!

 7. 🎲 *Winrate Gila*
    Casino/Slot/Rolet/Mines winrate naik ke 85%!
    Slot: selalu jackpot 3 sama. Mines: hanya 1 bom!

 8. ⚔️ *Duel Berhadiah*
    Menang !duel → bonus +Rp 2 Juta ekstra
    Cari lawan dan tantang sekarang!

 9. 🧠 *Tebak Berhadiah*
    Bot kirim soal, jawab PERTAMA dan BENAR = menang
    Soal di-restart setelah ada pemenang

10. ⚡ *Balapan Klik*
    Bot kirim kata acak → ketik PERTAMA = menang
    Event ini tentang kecepatan jari!

${'─'.repeat(30)}
💡 *PRO-TIPS EVENT*

• 🏆 Prioritas saat event aktif:
  - Rush Tambang   → Spam !claimmining terus!
  - Winrate Gila   → Pasang casino/slot besar
  - Musim Panen    → Segera !panen dan !jualhewan
  - Borong Pasar   → Beli mesin pabrik/hewan premium
  - Meteor Langka  → Siapkan jari untuk "KLAIM"!

• Event berganti tiap ~1 menit — selalu pantau chat!

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu ai
    // ══════════════════════════════════════════════════════════════
    if (['ai','chatai','robot','gpt'].includes(sub)) {
        return msg.reply(
`🤖 *AI & KECERDASAN BUATAN — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA (MEKANIK)*
Bot menyediakan 4 tier AI dengan model berbeda.
Setiap tier punya kecepatan dan kedalaman jawaban
yang berbeda. Persona mempengaruhi gaya berbicara AI.
Memori AI per-user (reset dengan !resetai).

${'─'.repeat(30)}
💬 *TIER AI*

!ai <pesan>     → General AI (cepat, gratis, semua tujuan)
!ai0 <pesan>    → Premium (Gemini/GPT-4/DeepSeek — terbaik)
!ai1 <pesan>    → Smart — jawaban mendalam, analitis
!ai2 <pesan>    → Creative — nulis kreatif, ekspresif
!ai3 <pesan>    → Fast — singkat padat, cepat

Contoh: !ai1 Jelaskan cara kerja blockchain
Contoh: !ai2 Tulis puisi tentang hujan Jakarta
Contoh: !ai0 Analisa strategi bisnis ini: ...

${'─'.repeat(30)}
🎭 *PERSONA AI*
!persona / !aimode         → Lihat semua persona tersedia
!persona <nama>            → Ganti karakter AI
  Contoh: !persona guru
  Contoh: !persona chef
  Contoh: !persona dokter

${'─'.repeat(30)}
📊 *STATISTIK & MEMORI*
!aistat                    → Statistik chat AI kamu
!resetai / !clearai        → Reset memori & riwayat AI
!sharechat / !history      → Share riwayat percakapan

${'─'.repeat(30)}
🖼️ *ANALISIS GAMBAR*
!aianalysis + kirim/reply gambar
  → AI analisis isi gambar secara detail

${'─'.repeat(30)}
🔧 *AI TOOLS LENGKAP*

!summarize / !ringkas <link/teks>
  → Ringkas artikel/teks panjang otomatis
  → Contoh: !summarize https://...

!translate / !terjemah <lang> <teks>
  → Terjemah teks ke bahasa target
  → Contoh: !translate en Halo semuanya
  → Contoh: !translate id Hello world

!ocr / !baca + reply/kirim gambar
  → Baca & ekstrak teks dari foto/screenshot

!codereview / !review <kode>
  → Review kode program + saran perbaikan

!improve / !perbaiki <teks>
  → Perbaiki tulisan/essay menjadi lebih baik

!grammar <teks>
  → Koreksi grammar bahasa Inggris/Indonesia

!sentiment / !analisis <teks>
  → Analisis sentimen: positif/negatif/netral

!explain / !jelaskan <topik>
  → Jelaskan topik dengan bahasa sederhana
  → Contoh: !jelaskan fotosintesis

!keywords / !katakunci <teks>
  → Ekstrak kata kunci penting dari teks

!fakta / !faktaunik <klaim/topik>
  → Cek fakta atau dapatkan fakta unik menarik

📚 *PENGETAHUAN*
!wiki / !wikiknow / !whatis <topik>
  → Cari info dari Wikipedia
  → Contoh: !wiki Albert Einstein

!sholat / !jadwal <kota>
  → Jadwal sholat hari ini
  → Contoh: !sholat Surabaya

${'─'.repeat(30)}
💡 *PRO-TIPS AI*

• !ai2 untuk konten kreatif (puisi, cerpen, caption)
• !ai1 untuk pertanyaan teknis & analisis mendalam
• !ai0 untuk tugas paling penting (gunakan bijak)
• Gunakan !persona guru saat belajar materi baru
• !ocr sangat berguna untuk konversi nota/struk ke teks

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu kreatif
    // ══════════════════════════════════════════════════════════════
    if (['kreatif','gambar','meme','cerita','lirik','image'].includes(sub)) {
        return msg.reply(
`🎨 *KREATIF — PANDUAN LENGKAP*
${'━'.repeat(30)}

🖼️ *IMAGE GENERATOR (AI)*

!img / !image / !gambar / !lukis <deskripsi>
  → Generate gambar AI dari deskripsi teks
  → Contoh: !img sunset over futuristic Tokyo city
  → Contoh: !lukis pemandangan sawah pagi hari

!imgstyle <style> <deskripsi>
  → Generate dengan gaya visual tertentu
  → Style: anime | realistic | cartoon | painting
           cyberpunk | watercolor | sketch
  → Contoh: !imgstyle anime girl with white hair
  → Contoh: !imgstyle cyberpunk motorcycle rider Tokyo

!imgvariasi <deskripsi>
  → Generate 3 gambar variasi sekaligus
  → Contoh: !imgvariasi futuristic car design

!imghelp
  → Bantuan tips menulis prompt gambar terbaik

💡 *Tip:* Gunakan bahasa Inggris untuk hasil terbaik!
   Semakin detail deskripsi = gambar makin sesuai.

${'─'.repeat(30)}
😂 *MEME GENERATOR*

!meme <template> | <teks atas> | <teks bawah>
  → Buat meme dari ratusan template populer
  → Contoh: !meme drake | Ngerjain PR sendiri | Nyontek
  → Contoh: !meme doge | Wow | Such coding | Very bug

${'─'.repeat(30)}
📖 *CERITA INTERAKTIF (AI Story)*

!cerita / !story <tema>
  → Mulai cerita interaktif bergaya novel
  → Contoh: !cerita petualangan di hutan terlarang
  → Contoh: !story romance SMA Jakarta

!lanjut / !ceritalanjut
  → Lanjutkan narasi cerita

!stopcerita
  → Akhiri sesi cerita interaktif

${'─'.repeat(30)}
🎵 *LIRIK LAGU*

!lirik / !lyrics <judul lagu>
  → Cari lirik + terjemahan otomatis
  → Contoh: !lirik Riptide Vance Joy
  → Contoh: !lirik Berapa Selamanya - Raisa
  → Contoh: !lyrics Shape of You

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu tools
    // ══════════════════════════════════════════════════════════════
    if (['tools','alat','stiker','pdf','tts','multimedia'].includes(sub)) {
        return msg.reply(
`🛠️ *TOOLS MULTIMEDIA — PANDUAN LENGKAP*
${'━'.repeat(30)}

🎨 *STIKER*
!s / !sticker
  → Gambar/GIF → stiker WhatsApp
  → Cara: kirim/reply gambar lalu ketik !s
  → Video pendek → stiker animasi (GIF)!

!toimg
  → Stiker → gambar balik (kebalikan !s)
  → Cara: reply stiker lalu ketik !toimg

${'─'.repeat(30)}
🔊 *TEXT TO SPEECH (TTS)*
!tts <teks>
  → Teks → pesan suara (default: Indonesia)
  → Contoh: !tts Halo semuanya, selamat datang!

!tts en <teks>   → TTS bahasa Inggris
!tts id <teks>   → TTS bahasa Indonesia eksplisit

${'─'.repeat(30)}
📄 *PDF TOOLS*
!topdf / !pdf + kirim/reply dokumen
  → Baca & ekstrak teks dari file PDF

!scan + kirim dokumen
  → Mode hitam-putih (lebih jelas untuk scan fisik)

!pdfdone / !donepdf  → Selesaikan sesi PDF
!pdfcancel           → Batalkan sesi PDF

${'─'.repeat(30)}
🔍 *TOOLS GAMBAR*
!bg / !removebg / !rmbg + gambar
  → Hapus background foto otomatis (AI)
  → Cara: kirim/reply gambar + ketik !bg

!compress / !kompres [kualitas] + gambar
  → Kompres ukuran file foto
  → Kualitas: 1–100 (default: 60)
  → Contoh: reply gambar + !compress 40

!enhance / !perjelas + gambar
  → Auto-perbaiki brightness, contrast, sharpness

${'─'.repeat(30)}
🎬 *DOWNLOADER*
!tiktok / !tt / !ttdl / !dl <link>
  → Download video TikTok tanpa watermark
  → Contoh: !tiktok https://vm.tiktok.com/xxxxx

!ytmp3 <url YouTube>
  → Download audio YouTube sebagai MP3
  → Contoh: !ytmp3 https://youtube.com/watch?v=...

${'─'.repeat(30)}
💡 *PRO-TIPS TOOLS*

• !s + video pendek = stiker GIF animasi keren!
• !removebg + logo perusahaan = hasil professional
• !compress sebelum kirim gambar besar ke grup
• !tts berguna untuk pengumuman voice note otomatis

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu utilitas
    // ══════════════════════════════════════════════════════════════
    if (['utilitas','utility','qr','password','tools2'].includes(sub)) {
        return msg.reply(
`📱 *UTILITAS DIGITAL — PANDUAN LENGKAP*
${'━'.repeat(30)}

📱 *QR CODE & LINK*
!qr / !qrcode <teks/link>
  → Generate QR code instan
  → Contoh: !qr https://wa.me/628xxxxxx

!short / !shorten / !pendekkan <url>
  → Perpendek URL panjang
  → Contoh: !short https://very-long-url.com/...

!unshort / !reveal_link <url>
  → Lihat URL asli dari link pendek

!mylinks / !linkku
  → Lihat semua link pendek yang kamu buat

${'─'.repeat(30)}
🔐 *PASSWORD & KEAMANAN*
!password / !passgen 16 strong
  → Generate password 16 karakter kuat
  → Campuran huruf besar/kecil, angka, simbol

!password 6 pin
  → Generate PIN 6 digit acak

!uuid
  → Generate UUID/GUID unik (untuk developer)

${'─'.repeat(30)}
🔒 *ENKRIPSI & HASH*
!base64 / !encode encode <teks>
  → Encode teks ke format Base64

!base64 / !decode decode <hash>
  → Decode Base64 kembali ke teks asli

!md5 / !hash <teks>
  → Hasilkan hash MD5 dari teks

${'─'.repeat(30)}
🌐 *JARINGAN & IP*
!ip / !ipinfo [alamat IP]
  → Cek IP publik kamu / info IP tertentu
  → Contoh: !ip 8.8.8.8

!ping <url>
  → Cek latensi / apakah website online
  → Contoh: !ping google.com

${'─'.repeat(30)}
⏰ *WAKTU & TIMER*
!waktu / !time / !timezone
  → Waktu saat ini di berbagai zona waktu dunia

!countdown / !timer <tanggal>
  → Hitung mundur ke tanggal tertentu
  → Contoh: !countdown 25/12/2025

${'─'.repeat(30)}
💡 _Semua utilitas gratis, tidak kurangi saldo_
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu mood
    // ══════════════════════════════════════════════════════════════
    if (['mood','zodiak','zodiac','horoscope','ramalan','shio'].includes(sub)) {
        return msg.reply(
`🔮 *MOOD, ZODIAK & RAMALAN — PANDUAN*
${'━'.repeat(30)}

😊 *MOOD TRACKER*
!mood
  → AI analisis dan tampilkan mood kamu hari ini

!mood <perasaan>
  → Set mood secara manual
  → Contoh: !mood happy | !mood sad | !mood marah

!moodstat / !moodstats
  → Statistik dan tren mood minggu ini

!moodhistory
  → Riwayat lengkap mood kamu

${'─'.repeat(30)}
⭐ *ZODIAK & HOROSKOP*
!zodiak / !horoscope / !horoskop
  → Horoskop hari ini (perlu input tanggal/zodiak)

!zodiak <tanggal>
  → Dari tanggal lahir → cek zodiak & horoskop
  → Contoh: !zodiak 25/03

!zodiak <tanda zodiak>
  → Horoskop zodiak tertentu
  → Contoh: !zodiak scorpio | !zodiak aries

!cocokan / !cocok @user
  → Cek kecocokan zodiak dengan user lain

*12 Zodiak:* Aries • Taurus • Gemini • Cancer
             Leo • Virgo • Libra • Scorpio
             Sagittarius • Capricorn • Aquarius • Pisces

${'─'.repeat(30)}
🐉 *SHIO TIONGHOA*
!shio
  → Ramalan shio berdasarkan tahun kelahiran
  → Tikus • Kerbau • Harimau • Kelinci • Naga
    Ular  • Kuda   • Kambing  • Monyet  • Ayam
    Anjing• Babi

${'─'.repeat(30)}
💡 *Info:* Horoskop dan ramalan bersifat hiburan,
dibuat oleh AI berdasarkan tradisi zodiak/shio.

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu reminder
    // ══════════════════════════════════════════════════════════════
    if (['reminder','remind','pengingat'].includes(sub)) {
        return msg.reply(
`⏰ *REMINDER OTOMATIS — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA*
Bot menyimpan pengingat dan kirim pesan WA otomatis
pada waktu yang kamu tentukan. Berbasis WIB (UTC+7).
Berguna untuk: minum obat, bayar tagihan, jadwal kerja,
               kasih makan ternak, claim bisnis, dll.

${'─'.repeat(30)}
⌨️ *FORMAT & CONTOH LENGKAP*

!remind / !reminder / !pengingat <waktu> <pesan>

Format waktu yang didukung:
  30m  = 30 menit dari sekarang
  2h   = 2 jam dari sekarang
  1d   = 1 hari dari sekarang
  1w   = 1 minggu dari sekarang
  HH:MM = jam spesifik hari ini (WIB)
  DD/MM = tanggal bulan ini

Contoh penggunaan:
  !remind 30m Minum obat
  !remind 2h Meeting online penting
  !remind 08:30 Sarapan dan ambil gaji !kerja
  !remind 1d Bayar tagihan listrik
  !remind 1w Bayar iuran bulanan
  !remind 25/12 Ucapkan selamat hari raya
  !remind 6h Kasih makan sapi di !kandang

${'─'.repeat(30)}
📋 *KELOLA REMINDER*
!remindlist
  → Lihat semua reminder aktif (+ ID 6 digit)

!reminddel <ID>
  → Hapus 1 reminder berdasarkan ID
  → Contoh: !reminddel AB1234

!remindclear
  → Hapus SEMUA remindermu sekaligus

${'─'.repeat(30)}
💡 *PRO-TIPS REMINDER*

• Set reminder untuk aktivitas game rutin:
  !remind 6h Kasih makan sapi (!pakan 1 premium)
  !remind 4h Ambil gaji polisi (!kerja)
  !remind 2h Ambil hasil pabrik kopi (!pabrik)
  !remind 1h Claim bisnis warnet (!collect)

• Reminder bisa dipakai bersamaan — tidak ada batas!

${'─'.repeat(30)}
⚠️ Waktu berdasarkan WIB (UTC+7)
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu group
    // ══════════════════════════════════════════════════════════════
    if (['group','grup','manajemen','admin'].includes(sub)) {
        return msg.reply(
`👥 *MANAJEMEN GRUP — PANDUAN LENGKAP*
${'━'.repeat(30)}

📖 *CARA KERJA*
Sebagian command butuh bot menjadi admin grup.
Antilink memantau semua pesan masuk secara otomatis.
Welcome/goodbye dikirim otomatis saat member berubah.

${'─'.repeat(30)}
👑 *TAG & INFO ANGGOTA*
!tagall
  → Tag semua anggota grup sekaligus
  → Berguna untuk pengumuman penting

!hidetag <pesan>
  → Tag tersembunyi (notif masuk tapi tidak terlihat tagnya)
  → Contoh: !hidetag Jangan lupa meeting jam 8!

!listadmin
  → Tampilkan daftar semua admin grup

!groupinfo
  → Info lengkap grup (jumlah member, admin, deskripsi)

${'─'.repeat(30)}
🚶 *KELOLA ANGGOTA (Admin Only)*
!kick @user
  → Keluarkan anggota dari grup
  → Contoh: !kick @spammer

!add 628xxxxxxxxxx
  → Tambahkan nomor ke grup
  → Contoh: !add 6281234567890

!promote @user    → Jadikan admin
!demote @user     → Turunkan dari admin
  → Contoh: !promote @teman

${'─'.repeat(30)}
🔒 *KEAMANAN GRUP (Admin Only)*
!antilink on / off
  → Aktif: semua link yang dikirim member dihapus otomatis
  → Contoh: !antilink on

!antispam on / off
  → Proteksi spam pesan berulang
  → Contoh: !antispam on

!mute
  → Bisukan grup (hanya admin yang bisa chat)

!unmute
  → Buka mute, semua member bisa chat lagi

${'─'.repeat(30)}
💬 *PESAN OTOMATIS (Admin Only)*
!welcome <pesan>
  → Set pesan sambutan otomatis saat member baru masuk
  → Gunakan {name} untuk sebut nama member
  → Contoh: !welcome Selamat datang {name}! 🎉

!goodbye <pesan>
  → Set pesan perpisahan saat member keluar
  → Contoh: !goodbye Sampai jumpa, {name} 👋

!setrules <peraturan>
  → Set peraturan grup
  → Contoh: !setrules 1. No spam 2. No SARA 3. Sopan

!rules
  → Tampilkan peraturan grup

!setdesc <deskripsi>
  → Ubah deskripsi grup

${'─'.repeat(30)}
🧹 *ADMIN BOT*
!cleandb / !prune
  → Bersihkan database user tidak aktif (hemat memori)

${'─'.repeat(30)}
⚠️ Bot harus jadi admin untuk: kick, add, mute,
   antilink, welcome, setdesc!
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu kalkulator
    // ══════════════════════════════════════════════════════════════
    if (['kalkulator','kalk','hitung','kalkulasi','konversi'].includes(sub)) {
        return msg.reply(
`🧮 *KALKULATOR & KONVERSI — PANDUAN LENGKAP*
${'━'.repeat(30)}

🔢 *KALKULATOR EKSPRESI*
!kalk / !calc / !hitung / !kalkulasi <ekspresi>
  Mendukung: +, -, *, /, ^, sqrt, sin, cos, tan, log, %
  Contoh: !kalk 2+2*10          → 22
  Contoh: !kalk sqrt(144)        → 12
  Contoh: !kalk sin(30)          → 0.5
  Contoh: !kalk 2^10             → 1024
  Contoh: !kalk 15% * 500000     → 75000
  Contoh: !kalk (25 + 75) / 2    → 50

${'─'.repeat(30)}
💹 *PERSENTASE*
!persen / !percent <angka> dari <total>
  → Contoh: !persen 20 dari 500000  → 100.000
  → Contoh: !persen 7.5 dari 800000 → 60.000

${'─'.repeat(30)}
🏋️ *KESEHATAN*
!bmi <berat_kg> <tinggi_cm>
  → Hitung Body Mass Index
  → Contoh: !bmi 70 175
  → Hasil: BMI + kategori (kurus/normal/gemuk/obesitas)

${'─'.repeat(30)}
🏦 *KEUANGAN*
!cicilan / !kredit <pokok> <bunga%/tahun> <tenor_bulan>
  → Simulasi cicilan KPR, kredit motor, dll
  → Contoh: !cicilan 100000000 12 24
    (Pinjam 100jt, bunga 12%/tahun, 24 bulan)

!zakat <total_harta>
  → Hitung zakat maal (2.5% dari harta)
  → Contoh: !zakat 5000000

!suhu / !celsius / !fahrenheit <angka>
  → Konversi suhu Celsius ↔ Fahrenheit
  → Contoh: !celsius 100 | !fahrenheit 212

${'─'.repeat(30)}
📏 *KONVERSI SATUAN LENGKAP*
!konversi / !convert <nilai> <dari> ke <ke>

Panjang/Jarak:
  !konversi 5 km ke mile
  !konversi 100 meter ke feet

Berat:
  !konversi 70 kg ke lbs
  !konversi 5 ons ke gram

Suhu:
  !konversi 100 c ke f    (Celsius ke Fahrenheit)
  !konversi 32 f ke c     (Fahrenheit ke Celsius)

Data Digital:
  !konversi 1 gb ke mb
  !konversi 500 mb ke kb

Waktu:
  !konversi 1 jam ke detik
  !konversi 2 hari ke menit

Mata Uang (real-time):
  !konversi 100 usd ke idr
  !konversi 50 eur ke idr

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu info
    // ══════════════════════════════════════════════════════════════
    if (['info','berita','news','cuaca','weather'].includes(sub)) {
        return msg.reply(
`📰 *INFO, BERITA & CUACA — PANDUAN*
${'━'.repeat(30)}

📰 *BERITA TERKINI*
!berita / !news
  → Berita terpopuler hari ini (semua kategori)

!berita <kategori>
  → Kategori: teknologi | ekonomi | olahraga
               hiburan  | sains
  → Contoh: !berita teknologi
  → Contoh: !berita olahraga

${'─'.repeat(30)}
💱 *KURS & MATA UANG*
!kurs / !valas     → Kurs semua mata uang vs IDR
!kurspro / !kursupdate → Kurs lengkap + tren 7 hari
!dollar            → Kurs USD/IDR hari ini spesifik

${'─'.repeat(30)}
₿ *CRYPTO REAL-TIME*
!btc / !bitcoin    → Harga Bitcoin terkini (IDR & USD)
!market / !crypto  → Harga 20 kripto teratas
  Tersedia: BTC, ETH, BNB, SOL, ADA, XRP, dll

${'─'.repeat(30)}
🌤️ *CUACA & KUALITAS UDARA*
!cuaca / !weather / !aqi <nama_kota>
  → Cuaca saat ini + AQI (kualitas udara)
  → Contoh: !cuaca Surabaya
  → Contoh: !cuaca Jakarta | !weather Bandung

!prakiraan <nama_kota>
  → Prakiraan cuaca 5 hari ke depan
  → Contoh: !prakiraan Surabaya

${'─'.repeat(30)}
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu analitik
    // ══════════════════════════════════════════════════════════════
    if (['analitik','analytic','statistik','stats'].includes(sub)) {
        return msg.reply(
`📊 *ANALITIK BOT — PANDUAN*
${'━'.repeat(30)}

📈 *STATISTIK PENGGUNAAN*
!statbot
  → Statistik penggunaan bot secara keseluruhan
  → Total command, user aktif, command terpopuler

!topcmd
  → Ranking command yang paling sering digunakan

!topuser
  → Ranking user paling aktif menggunakan bot

!resetanalitik
  → Reset semua data analitik (admin only)

${'─'.repeat(30)}
_Data analitik diperbarui secara real-time_
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  !menu developer
    // ══════════════════════════════════════════════════════════════
    if (['developer','dev','godmode','owner'].includes(sub)) {
        return msg.reply(
`🔧 *DEVELOPER & ADMIN TOOLS*
${'━'.repeat(30)}

⚠️ _Fitur ini HANYA untuk developer / owner bot!_
_Penyalahgunaan menyebabkan ketidakseimbangan game._

${'─'.repeat(30)}
🛠️ *GOD MODE*
!dev / !godmode
  → Tampilkan panel kontrol developer lengkap

!timeskip / !time <jam>
  → Skip waktu (untuk testing mekanik game)
  → Contoh: !timeskip 8

${'─'.repeat(30)}
💰 *MANAJEMEN SALDO USER*
!add / !tambah / !addmoney @user <jumlah>
  → Tambah saldo user tertentu
  → Contoh: !addmoney @user 1000000000

!set / !setuang / !setmoney @user <jumlah>
  → Set saldo user ke nilai tertentu
  → Contoh: !setmoney @user 0

${'─'.repeat(30)}
🎁 *SPAWN ITEM*
!give / !spawn <kategori> <item> <jumlah> [target]
  → Spawn item langsung ke inventory
  → Kategori: pakan | mesin | inv
  → Contoh: !give pakan premium 100

!setharga <item> <harga>
  → Set harga item di toko
  → Contoh: !setharga premium 1000

${'─'.repeat(30)}
📢 *BROADCAST*
!godsay / !bc <pesan>
  → Kirim pesan ke semua grup aktif

${'─'.repeat(30)}
👤 *MANAJEMEN USER*
!resetuser @user
  → Reset data user tertentu ke awal
  → Contoh: !resetuser @user

!resetall confirm
  → ⚠️ DANGER: Reset SEMUA user ke kondisi awal!
  → Tidak bisa diundo!

!cleandb / !prune
  → Bersihkan database user tidak aktif

${'─'.repeat(30)}
⚠️ Semua aksi developer bersifat PERMANEN.
   Gunakan dengan sangat bijak dan hati-hati!
↩️ Balik: *!menu*`
        );
    }

    // ══════════════════════════════════════════════════════════════
    //  Kategori tidak ditemukan
    // ══════════════════════════════════════════════════════════════
    return msg.reply(
`❓ Kategori *"${sub}"* tidak ditemukan.

📋 *Kategori tersedia:*
nyawa • bank • jobs • game • minigame
bola (+ bolaajar, odds, 1x2, hdp, ou, parlayajar)
farming • ternak • mining • investasi • properti
negara • event • ai • kreatif • tools
utilitas • mood • reminder • group
kalkulator • info • analitik • developer

Ketik *!menu* untuk tampilan lengkap.`
    );
};
