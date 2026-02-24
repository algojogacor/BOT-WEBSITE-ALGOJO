# ⚔️ AlgojoGacor Web Platform

Migrasi penuh dari WA Bot ke platform web modern. Berbasis Node.js + Express + Socket.IO + MongoDB (database yang **sama** dengan WA Bot lama).

---

## 📁 Struktur Folder (Modular)

```
algojo-web/
│
├── server.js                  ← Entry point utama
├── .env.example               ← Template environment variables
├── package.json
│
├── config/
│   └── database.js            ← Koneksi MongoDB (same DB as WA Bot!)
│
├── middleware/
│   ├── auth.js                ← JWT auth guard (requireAuth/requireAdmin/requireDeveloper)
│   ├── rateLimiter.js         ← Anti brute-force & spam
│   └── validate.js            ← Validasi input (express-validator)
│
├── utils/
│   ├── constants.js           ← SEMUA konstanta game (harga, config) — edit di sini!
│   └── helpers.js             ← Fungsi pembantu (fmt, parseBet, dll)
│
├── controllers/
│   ├── authController.js      ← Login, register, link WA
│   ├── userController.js      ← Profil, leaderboard
│   ├── economyController.js   ← Daily, casino, bank, kerja, survival
│   ├── adminController.js     ← Panel admin & developer
│   ├── chatController.js      ← Room chat & DM (REST)
│   └── features/
│       ├── farmingController.js
│       ├── ternakController.js
│       ├── miningController.js
│       ├── propertyController.js
│       ├── aiController.js    ← OpenRouter AI
│       ├── ttsController.js   ← ElevenLabs TTS
│       └── toolsController.js ← Remove BG, cuaca, berita
│
├── routes/
│   ├── index.js               ← Agregator semua route
│   ├── auth.js
│   ├── user.js
│   ├── economy.js
│   ├── admin.js
│   ├── chat.js
│   └── features.js
│
├── socket/
│   └── index.js               ← Socket.IO (live chat real-time)
│
├── services/
│   └── lifeService.js         ← Cron HP/Lapar/Energi (setiap 1 menit)
│
├── scripts/
│   └── migrateWaData.js       ← Cek status data WA Bot lama
│
└── public/                    ← Frontend (HTML + CSS + JS)
    ├── index.html             ← Halaman Login/Register
    ├── dashboard.html         ← Dashboard utama
    ├── chat.html              ← Live Chat
    ├── css/
    │   ├── main.css           ← Global styles (dark theme)
    │   ├── dashboard.css      ← Layout sidebar + main
    │   └── chat.css           ← Chat UI
    ├── js/
    │   ├── api.js             ← Helper fetch + token + toast
    │   ├── auth.js            ← Login/register logic
    │   ├── dashboard.js       ← Dashboard logic
    │   ├── chat.js            ← Socket.IO chat client
    │   └── admin.js           ← Admin panel logic
    └── pages/                 ← Halaman fitur individual
        ├── economy.html
        ├── games.html
        ├── farming.html
        ├── ternak.html
        ├── mining.html
        ├── property.html
        ├── jobs.html
        ├── ai.html
        ├── tools.html
        ├── leaderboard.html
        ├── admin.html
        └── profile.html
```

---

## 🚀 Cara Install & Jalankan

### 1. Persiapan
```bash
# Clone / extract project ini ke folder
cd algojo-web

# Install dependencies
npm install

# Salin file env
cp .env.example .env
```

### 2. Konfigurasi `.env`
```env
PORT=3000
JWT_SECRET=GANTI_DENGAN_STRING_RANDOM_PANJANG_MINIMAL_32_KARAKTER
MONGODB_URI=mongodb+srv://aryarizky04:...@wabot.nsoro0p.mongodb.net/?appName=WAbot
APP_URL=http://localhost:3000

# API Keys (sama dengan WA Bot)
ELEVENLABS_API_KEY=...
OPENROUTER_API_KEY=...
REMOVE_BG_API_KEY=...
VOICERSS_API_KEY=...

# ID WA Developer (untuk akses tertinggi)
DEVELOPER_IDS=244203384742140@lid
```

### 3. Cek Data WA Bot Lama (Opsional)
```bash
node scripts/migrateWaData.js
```
Ini akan menampilkan data user WA yang ada di database, lengkap dengan WA ID yang perlu diinput saat Register web.

### 4. Jalankan
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Buka browser: `http://localhost:3000`

---

## 🔒 Sistem Keamanan

| Fitur | Implementasi |
|-------|-------------|
| Brute Force Login | Rate limiter: maks 10 percobaan / 15 menit |
| XSS | `xss-clean` middleware + sanitasi manual |
| NoSQL Injection | `express-mongo-sanitize` middleware |
| HTTPS Headers | `helmet` middleware |
| Token Auth | JWT (expire 7 hari) |
| Ban System | Check ban di setiap request (middleware auth) |
| Input Validation | `express-validator` di semua endpoint |

---

## 👥 Sistem Role

| Role | Kemampuan |
|------|-----------|
| `developer` | Akses semua. Promote/demote admin. Role tertinggi. |
| `admin` | Ban/unban user, add/set uang, reset data, event, harga |
| `user` | Semua fitur game, chat, ekonomi |

**Cara jadi Developer:** Isi `DEVELOPER_IDS` di `.env` dengan WA ID kamu, lalu saat register masukkan WA ID tersebut di field "ID WA Lama".

---

## 💬 Live Chat

- **10 Room** publik atau berpassword
- **DM** (Direct Message) antar user terdaftar
- Real-time via **Socket.IO**
- Pesan otomatis tersimpan di MongoDB (100 pesan/room, 200 pesan/DM)

---

## 🔄 Migrasi Data WA Bot

Data WA Bot lama tersimpan di MongoDB dengan struktur:
```
database: bot_data → collection: bot_data → document._id: 'main_data' → .data.users
```

Web ini menggunakan **database yang sama**. Cara link data:
1. Saat daftar, isi field **"ID WA Lama"** dengan WA ID kamu (format: `628xxx@s.whatsapp.net`)
2. Sistem otomatis membaca aset (saldo, properti, ternak, dll) dari data WA lama

---

## ✏️ Cara Modifikasi (Untuk Developer)

**Ubah harga game:** Edit `utils/constants.js`

**Tambah fitur baru:**
1. Buat controller di `controllers/features/namaFeature.js`
2. Tambahkan route di `routes/features.js`
3. Buat halaman HTML di `public/pages/namaFeature.html`

**Ubah tampilan:** Edit file CSS di `public/css/`

**Tambah route baru:** Daftarkan di `routes/index.js`
