// ╔══════════════════════════════════════════════════════════════╗
// ║           ALGOJO BOT WA v2.0 — index.js                    ║
// ║           Berdasarkan: Bot-WA-Termutakhir + Upgrade v2.0   ║
// ╚══════════════════════════════════════════════════════════════╝

// --- 1. IMPORT MODUL UTAMA (BAILEYS) ---
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    downloadMediaMessage,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const pino  = require('pino');
const fs    = require('fs');
const path  = require('path');
const { exec } = require('child_process');

// Database & Helpers
const { connectToCloud, loadDB, saveDB, addQuestProgress } = require('./helpers/database');
const { connectToDB }  = require('./helpers/mongodb');
const { MongoClient }  = require('mongodb');

// FFmpeg
const ffmpegStatic = require('ffmpeg-static');
process.env.FFMPEG_PATH = ffmpegStatic;

// ─── IMPORT COMMANDS ────────────────────────────────────────────────
const timeMachineCmd = require('./commands/timemachine');
const lifeCmd        = require('./commands/life');
const bankCmd        = require('./commands/bank');
const adminAbuseCmd  = require('./commands/adminabuse');
const jobsCmd        = require('./commands/jobs');
const chartCmd       = require('./commands/chart');
const economyCmd    = require('./commands/economy');
const propertyCmd    = require('./commands/property');
const pabrikCommand  = require('./commands/pabrik');
const valasCmd       = require('./commands/valas');
const stocksCmd      = require('./commands/stocks');
const farmingCmd     = require('./commands/farming');
const ternakCmd      = require('./commands/ternak');
const miningCmd      = require('./commands/mining');
const devCmd         = require('./commands/developer');
const cryptoCmd      = require('./commands/crypto');
const bolaCmd        = require('./commands/bola');
const profileCmd     = require('./commands/profile');
const battleCmd      = require('./commands/battle');
const ttsCmd         = require('./commands/tts');
const gameTebakCmd   = require('./commands/gameTebak');
const nationCmd      = require('./commands/nation');
const rouletteCmd    = require('./commands/roulette');
const pdfCmd         = require('./commands/pdf');
const wikiKnowCmd    = require('./commands/WikiKnow');
const adminCmd       = require('./commands/admin');
const aiCmd          = require('./commands/ai');
const slitherCmd     = require('./commands/slither_bridge');
const rpgCmd         = require('./commands/rpg_bridge');
const minesCmd       = require('./commands/mines');
const duelCmd        = require('./commands/duel');
const toolsCmd       = require('./commands/tools');
const caturCmd       = require('./commands/catur');
const imageCmd       = require('./commands/image');
const menuCmd        = require('./commands/menu');

// ─── IMPORT FITUR ORIGINAL (Tambahan) ────────────────────────────────
const aiToolsCmd   = require('./commands/aitools');
const moodCmd      = require('./commands/mood');
const triviaCmd    = require('./commands/trivia');
const wordleCmd    = require('./commands/wordle');
const akinatorCmd  = require('./commands/akinator');
const portoCmd     = require('./commands/portofolio');
const perkiraanCmd = require('./commands/prakiraan');
const bgToolsCmd   = require('./commands/bgtools');
const shortlinkCmd = require('./commands/shortlink');
const zodiakCmd    = require('./commands/zodiak');
const kreatifCmd   = require('./commands/kreatif');
const analitikCmd  = require('./commands/analitik');
const { trackCommand } = require('./commands/analitik');

// ─── IMPORT FITUR BARU v2.0 ───────────────────────────────────────────
const reminderCmd   = require('./commands/reminder');
const groupCmd      = require('./commands/group');
const kalkulatorCmd = require('./commands/kalkulator');
const beritaCmd     = require('./commands/berita');
const tiktokCmd     = require('./commands/tiktok');
const utilitasCmd   = require('./commands/utilitas');

// ─── CRON (Reminder Scheduler v2.0) ──────────────────────────────────
let cron;
try { cron = require('node-cron'); } catch(e) { cron = null; }

// ══════════════════════════════════════════════════════════════════════
// KONFIGURASI
// ══════════════════════════════════════════════════════════════════════
const ALLOWED_GROUPS = (process.env.ALLOWED_GROUPS || '')
    .split(',').map(g => g.trim()).filter(Boolean);

const LOGGING_GROUPS = (process.env.LOGGING_GROUPS || '')
    .split(',').map(g => g.trim()).filter(Boolean);

if (!fs.existsSync('./temp')) fs.mkdirSync('./temp', { recursive: true });

// ══════════════════════════════════════════════════════════════════════
// EXPRESS SERVER (Health Check & API Catur)
// ══════════════════════════════════════════════════════════════════════
const express = require('express');
const cors    = require('cors');
const app     = express();
const port    = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/game', express.static(path.join(__dirname, 'public_catur')));

app.post('/api/catur-finish', async (req, res) => {
    const { user, result, bet, level } = req.body;

    const db = global.db;
    if (!db || !db.users) return res.status(503).json({ status: 'error', message: 'Database bot belum siap.' });
    if (!db.users[user])  return res.status(404).json({ status: 'error', message: 'User tidak ditemukan' });

    const userData   = db.users[user];
    const taruhan    = parseInt(bet)   || 0;
    const difficulty = parseInt(level) || 2;
    let prize = 0, text = '';

    if (result === 'win') {
        const multiplier = difficulty === 3 ? 1.3 : 1.2;
        prize = Math.floor(taruhan * multiplier);
        text  = `🎉 MENANG (${difficulty === 3 ? 'Hard' : 'Medium'})!\n💰 Total: ${prize.toLocaleString('id-ID')}\n📈 Profit: ${(prize - taruhan).toLocaleString('id-ID')}`;
    } else if (result === 'draw') {
        prize = taruhan;
        text  = `🤝 Seri! ${prize.toLocaleString('id-ID')} dikembalikan.`;
    } else {
        text = `💀 Kalah. ${taruhan.toLocaleString('id-ID')} hangus.`;
    }

    userData.balance = (userData.balance || 0) + prize;
    if (typeof saveDB === 'function') await saveDB(global.db);

    res.json({ status: 'ok', message: text, newBalance: userData.balance });
    console.log(`[CATUR] ${user} → ${result} (Level:${difficulty}, Bet:${taruhan}, Prize:${prize})`);
});

app.get('/', (req, res) => res.json({
    status: 'running', bot: 'Algojo Bot WA v2.0',
    uptime: Math.floor(process.uptime()) + 's',
    users: global.db ? Object.keys(global.db.users || {}).length : 0,
}));
app.get('/health', (req, res) => res.send('OK'));

app.listen(port, () => console.log(`🌐 Server jalan di port ${port}`));

// ══════════════════════════════════════════════════════════════════════
// REMINDER SCHEDULER v2.0 — cek setiap menit
// ══════════════════════════════════════════════════════════════════════
function startReminderScheduler(sock) {
    const checkReminders = async () => {
        const db = global.db;
        if (!db || !db.reminders) return;
        const now = Date.now();
        let changed = false;
        for (const [id, r] of Object.entries(db.reminders)) {
            if (r.time > now) continue;
            try {
                await sock.sendMessage(r.jid, {
                    text: `⏰ *PENGINGAT!*\n\n📌 *${r.text}*\n\n_Diset: ${new Date(r.created).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}_`,
                    mentions: [r.sender]
                });
            } catch(e) { console.error('[Reminder]', e.message); }
            delete db.reminders[id];
            changed = true;
        }
        if (changed) saveDB(db);
    };

    if (cron) {
        cron.schedule('* * * * *', checkReminders);
        console.log('✅ Reminder scheduler aktif');
    } else {
        setInterval(checkReminders, 60000);
        console.log('⚠️  node-cron tidak ada, reminder pakai setInterval');
    }
}

// ══════════════════════════════════════════════════════════════════════
// ANTI-SPAM TRACKER v2.0
// ══════════════════════════════════════════════════════════════════════
const spamMap = new Map();
function cekSpam(senderJid, groupJid) {
    if (!global.db?.groups?.[groupJid]?.antispam) return false;
    const key = `${groupJid}_${senderJid}`, now = Date.now();
    const t   = spamMap.get(key) || { count: 0, lastTime: 0 };
    if (now - t.lastTime < 5000) { t.count++; if (t.count >= 7) { spamMap.set(key, t); return true; } }
    else t.count = 1;
    t.lastTime = now; spamMap.set(key, t); return false;
}

// ══════════════════════════════════════════════════════════════════════
// KONEKSI WHATSAPP
// ══════════════════════════════════════════════════════════════════════
async function startBot() {
    // 1. DATABASE
    try {
        console.log('🔄 Menghubungkan ke MongoDB Atlas...');
        await connectToCloud();
        global.db = await loadDB();
        if (!global.db.users)     global.db.users     = {};
        if (!global.db.groups)    global.db.groups     = {};
        if (!global.db.market)    global.db.market     = { commodities: {} };
        if (!global.db.settings)  global.db.settings   = {};
        if (!global.db.reminders) global.db.reminders  = {};
        if (!global.db.analytics) global.db.analytics  = { commands: {}, totalMessages: 0 };
        console.log('✅ Database Terhubung!');
    } catch(err) {
        console.error('⚠️ GAGAL KONEK DB:', err.message);
        global.db = { users: {}, groups: {}, market: {}, settings: {}, reminders: {}, analytics: { commands: {}, totalMessages: 0 } };
    }

    // 2. BAILEYS
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`🤖 WA Version: v${version.join('.')} (Latest: ${isLatest})`);

    const { state, saveCreds } = await useMultiFileAuthState('auth_baileys');

    const sock = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' }).child({ level: 'fatal' })),
        },
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        connectTimeoutMs: 60000, keepAliveIntervalMs: 10000,
        retryRequestDelayMs: 5000, syncFullHistory: false,
        generateHighQualityLinkPreview: true,
    });

    // ── Connection Update ──────────────────────────────────────
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n' + '═'.repeat(50));
            console.log('🔗 COPY TEKS DI BAWAH INI DAN PASTE DI goqr.me :');
            console.log(qr);
            console.log('═'.repeat(50) + '\n');
        }

        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            console.log(`❌ Koneksi terputus. Reason: ${reason}`);
            if (reason === DisconnectReason.loggedOut) {
                if (fs.existsSync('./auth_baileys')) fs.rmSync('./auth_baileys', { recursive: true, force: true });
                startBot();
            } else if (reason === 515) {
                setTimeout(() => startBot(), 2000);
            } else {
                setTimeout(() => startBot(), 5000);
            }
        } else if (connection === 'open') {
            console.log('\n' + '═'.repeat(50));
            console.log('✅ ALGOJO BOT v2.0 SIAP! 🚀');
            console.log('═'.repeat(50) + '\n');
            if (!global.abuseState) global.abuseState = { active: false };
            startReminderScheduler(sock);
        }
    });

    sock.ev.on('creds.update', saveCreds);

    // ── Welcome / Goodbye Handler v2.0 ────────────────────────
    sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
        try {
            const gs = global.db?.groups?.[id] || {};
            for (const p of participants) {
                const num = p.split('@')[0];
                if (action === 'add' && gs.welcome && gs.welcomeMsg)
                    await sock.sendMessage(id, { text: gs.welcomeMsg.replace(/{name}/g, `@${num}`), mentions: [p] });
                if (action === 'remove' && gs.goodbyeMsg)
                    await sock.sendMessage(id, { text: gs.goodbyeMsg.replace(/{name}/g, `@${num}`), mentions: [p] });
            }
        } catch(e) { console.error('[group-participants]', e.message); }
    });

    // ── MESSAGE HANDLER ────────────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;
        const m = messages[0];
        if (!m.message) return;

        try {
            const remoteJid = m.key.remoteJid;
            const isGroup   = remoteJid.endsWith('@g.us');
            const sender    = isGroup ? (m.key.participant || m.participant) : remoteJid;
            const pushName  = m.pushName || 'Tanpa Nama';
            const msgType   = Object.keys(m.message)[0];
            const body      = m.message.conversation
                           || m.message.extendedTextMessage?.text
                           || m.message.imageMessage?.caption
                           || m.message.videoMessage?.caption || '';

            // AdminAbuse Interactive
            if (isGroup && global.abuseState?.active) {
                await adminAbuseCmd.handleInteractive(body, sender, remoteJid, global.db)
                    .catch(e => console.error('[AdminAbuse Interactive]', e.message));
                if (global.abuseState.currentEvent === 'lomba_aktif' &&
                    global.abuseState.eventData?.lombaActive && body) {
                    const skor = global.abuseState.eventData.lombaSkor;
                    if (!skor[sender]) skor[sender] = 0;
                    skor[sender]++;
                }
            }

            if (body) console.log(`📨 ${pushName}: ${body.slice(0, 40)}`);

            const hasMedia = ['imageMessage','videoMessage','documentMessage'].includes(msgType);

            const chat = {
                id: { _serialized: remoteJid }, isGroup,
                sendMessage: async (content) => {
                    await sock.sendMessage(remoteJid, typeof content === 'string' ? { text: content } : content);
                }
            };

            const msg = {
                body, from: remoteJid, author: sender, pushName, hasMedia, type: msgType,
                getChat: async () => chat,
                react:   async (emoji) => await sock.sendMessage(remoteJid, { react: { text: emoji, key: m.key } }),
                reply:   async (text)  => await sock.sendMessage(remoteJid, { text: text + '' }, { quoted: m }),
                key: m.key, message: m.message, isGroup,
                extendedTextMessage: m.message.extendedTextMessage,
            };

            if (body === '!idgrup') return msg.reply(`🆔 *ID GRUP:* \`${remoteJid}\``);
            if (body === '!id' || body === '!cekid') return msg.reply(`🆔 Chat: \`${remoteJid}\`\nUser: \`${sender}\``);

            if (!isGroup) return;

            if (ALLOWED_GROUPS.length > 0 && !ALLOWED_GROUPS.includes(remoteJid)) return;

            // v2.0 Anti-Link
            if (global.db?.groups?.[remoteJid]?.antilink) {
                const hasLink = /(https?:\/\/|wa\.me\/|bit\.ly\/|t\.me\/|youtu\.be\/)/i.test(body);
                if (hasLink) {
                    let isAdmin = false;
                    try {
                        const meta = await sock.groupMetadata(remoteJid);
                        isAdmin = meta.participants.find(p => p.id === sender)?.admin != null;
                    } catch {}
                    if (!isAdmin) {
                        await sock.sendMessage(remoteJid, { delete: m.key }).catch(() => {});
                        await sock.sendMessage(remoteJid, { text: `🚫 @${sender.split('@')[0]} dilarang kirim link!`, mentions: [sender] });
                        return;
                    }
                }
            }

            // v2.0 Anti-Spam
            if (cekSpam(sender, remoteJid)) {
                await sock.sendMessage(remoteJid, { delete: m.key }).catch(() => {});
                await sock.groupParticipantsUpdate(remoteJid, [sender], 'remove').catch(() => {});
                await sock.sendMessage(remoteJid, { text: `⚠️ @${sender.split('@')[0]} di-kick karena spam!`, mentions: [sender] });
                return;
            }

            // ══════════════════════════════════════════════════
            // DATABASE & USER SETUP
            // ══════════════════════════════════════════════════
            const db = global.db;
            if (!db.users)  db.users  = {};
            if (!db.market) db.market = {};

            const today = new Date().toISOString().split('T')[0];
            const defaultQuest = {
                daily: [
                    { id: 'chat',    name: 'Ngobrol Aktif', progress: 0, target: 10, reward: 200,  claimed: false },
                    { id: 'game',    name: 'Main Casino',   progress: 0, target: 3,  reward: 300,  claimed: false },
                    { id: 'sticker', name: 'Bikin Stiker',  progress: 0, target: 2,  reward: 150,  claimed: false },
                ],
                weekly: { id: 'weekly', name: 'Weekly Warrior', progress: 0, target: 100, reward: 2000, claimed: false },
                lastReset: today,
            };

            // Register User Baru
            if (!db.users[sender]) {
                const totalUsers = Object.keys(db.users).length;
                db.users[sender] = {
                    id: totalUsers + 1, name: pushName || 'User',
                    balance: 15000000, bank: 0, debt: 0, xp: 0, level: 1,
                    hp: 100, hunger: 100, energy: 100,
                    lastLifeUpdate: Date.now(), isDead: false,
                    isSleeping: false, sleepEndTime: 0,
                    inv: [], buffs: {}, lastDaily: 0,
                    bolaWin: 0, bolaTotal: 0, bolaProfit: 0,
                    crypto: {}, quest: JSON.parse(JSON.stringify(defaultQuest)),
                    forex: { usd: 0, eur: 0, jpy: 0, emas: 0 },
                    ternak: [], ternak_inv: { dedak: 0, pelet: 0, premium: 0, obat: 0 },
                    farm: { plants: [], inventory: {}, machines: [], processing: [] },
                    job: null, lastWork: 0, lastSkill: 0,
                    dailyIncome: 0, dailyUsage: 0,
                    aiMemory: [], aiFullHistory: [], aiPersona: 'default',
                    aiStats: { totalMessages: 0, totalChars: 0, firstChatDate: null },
                };
                console.log(`[NEW USER] ${pushName} registered`);
            }

            const user = db.users[sender];
            if (!user) return;

            user.lastSeen = Date.now();
            user.name     = pushName || user.name || 'User';

            // Auto-fix field
            if (!user.id)           user.id          = Object.keys(db.users).indexOf(sender) + 1;
            if (!user.balance)      user.balance      = 0;
            if (!user.bank)         user.bank         = 0;
            if (!user.debt)         user.debt         = 0;
            if (!user.crypto)       user.crypto       = {};
            if (!user.quest)        user.quest        = JSON.parse(JSON.stringify(defaultQuest));
            if (!user.forex)        user.forex        = { usd: 0, eur: 0, jpy: 0, emas: 0 };
            if (!user.ternak)       user.ternak       = [];
            if (!user.ternak_inv)   user.ternak_inv   = { dedak: 0, pelet: 0, premium: 0, obat: 0 };
            if (!user.farm)         user.farm         = { plants: [], inventory: {}, machines: [], processing: [] };
            if (!user.mining)       user.mining       = { racks: [], lastClaim: 0, totalHash: 0 };
            if (!user.job)          user.job          = null;
            if (!user.lastWork)     user.lastWork     = 0;
            if (!user.aiMemory)     user.aiMemory     = [];
            if (!user.aiPersona)    user.aiPersona    = 'default';
            if (!user.aiStats)      user.aiStats      = { totalMessages: 0, totalChars: 0, firstChatDate: null };
            // Field life system baru
            if (typeof user.isSleeping  === 'undefined') user.isSleeping  = false;
            if (typeof user.sleepEndTime=== 'undefined') user.sleepEndTime= 0;
            if (typeof user.dailyIncome === 'undefined') user.dailyIncome  = 0;
            if (typeof user.dailyUsage  === 'undefined') user.dailyUsage   = 0;

            // ══════════════════════════════════════════════════
            // ⚡ LIFE SYSTEM — update decay dihandle penuh oleh life.js
            // (Blok decay lama di index.js DIHAPUS agar tidak konflik)
            // ══════════════════════════════════════════════════

            // Anti Toxic
            const toxicWords = ['anjing','kontol','memek','goblok','idiot','babi','tolol','ppq','jembut'];
            if (toxicWords.some(k => body.toLowerCase().includes(k)))
                return msg.reply('⚠️ Jaga ketikan bro, jangan toxic!');

            // Daily Reset
            if (user.quest?.lastReset !== today) {
                user.quest.daily.forEach(q => { q.progress = 0; q.claimed = false; });
                user.quest.lastReset = today;
                user.dailyIncome = 0;
                user.dailyUsage  = 0;
            }
            if (user.buffs) {
                for (const k in user.buffs)
                    if (user.buffs[k].active && Date.now() >= user.buffs[k].until)
                        user.buffs[k].active = false;
            }

            // XP & Leveling
            user.xp += user.buffs?.xp?.active ? 5 : 2;
            if (user.quest.weekly && !user.quest.weekly.claimed) user.quest.weekly.progress++;
            const nextLvl = Math.floor(user.xp / 100) + 1;
            if (nextLvl > user.level) {
                user.level = nextLvl;
                msg.reply(`🎊 *LEVEL UP!* Sekarang Level *${user.level}*`);
            }
            addQuestProgress(user, 'chat');

            // Analytics v2.0
            if (db.analytics) {
                db.analytics.totalMessages = (db.analytics.totalMessages || 0) + 1;
            }

            // TimeMachine Logger
            if (LOGGING_GROUPS.includes(remoteJid) && body && !body.startsWith('!') && !body.startsWith('.')) {
                if (!db.chatLogs) db.chatLogs = {};
                if (!db.chatLogs[remoteJid]) db.chatLogs[remoteJid] = [];
                db.chatLogs[remoteJid].push({ t: Date.now(), u: pushName, m: body });
            }

            // ══════════════════════════════════════════════════
            // PARSE COMMAND
            // ══════════════════════════════════════════════════
            const isCommand = body.startsWith('!');
            const args      = isCommand ? body.slice(1).trim().split(/ +/) : [];
            const command   = isCommand ? args.shift().toLowerCase() : '';

            if (command && db.analytics) {
                try { trackCommand(command, sender, db); } catch(e) {}
                if (!db.analytics.commands) db.analytics.commands = {};
                db.analytics.commands[command] = (db.analytics.commands[command] || 0) + 1;
            }

            // ══════════════════════════════════════════════════
            // NON-PREFIX MODULES
            // ══════════════════════════════════════════════════
            await pdfCmd(command, args, msg, sender, sock)
                .catch(e => console.error('[PDF]', e.message));
            await gameTebakCmd(command, args, msg, user, db, body)
                .catch(e => console.error('[GameTebak]', e.message));

            if (!isCommand) return;

            // ══════════════════════════════════════════════════
            // MENU
            // ══════════════════════════════════════════════════
            if (await menuCmd(command, args, msg, user)) return;

            // ══════════════════════════════════════════════════
            // DISPATCH SEMUA COMMAND MODULE
            // ══════════════════════════════════════════════════

            // ── 🫀 LIFE SYSTEM  ───────────────────────
            // Commands: me, status, profile, makan, tidur, bangun,
            //           revive, rs, matistatus, hidupstatus
            await lifeCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Life]', e.message));

            // ── 🏦 EKONOMI  ───────────────────────────
            // Commands: bank, atm, dompet, depo, deposit, tarik,
            //           withdraw, transfer, tf, pinjam, loan,
            //           bayar, pay, rob, maling, top, leaderboard
            await bankCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Bank]', e.message));

            // ── Original Commands ──────────────────────────────
            await ternakCmd(command, args, msg, user, db)
                .catch(e => console.error('[Ternak]', e.message));
            await adminAbuseCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[AdminAbuse]', e.message));
            await toolsCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Tools]', e.message));
            await timeMachineCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[TimeMachine]', e.message));
            await devCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Dev]', e.message));
            await pabrikCommand(command, args, msg, user, db, sock)
                .catch(e => console.error('[Pabrik]', e.message));
            await chartCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Chart]', e.message));
            await stocksCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Stocks]', e.message));
            await cryptoCmd(command, args, msg, user, db)
                .catch(e => console.error('[Crypto]', e.message));
            await propertyCmd(command, args, msg, user, db)
                .catch(e => console.error('[Property]', e.message));
            await minesCmd(command, args, msg, user, db)
                .catch(e => console.error('[Mines]', e.message));
            await miningCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Mining]', e.message));
            await duelCmd(command, args, msg, user, db)
                .catch(e => console.error('[Duel]', e.message));
            await bolaCmd(command, args, msg, user, db, sender)
                .catch(e => console.error('[Bola]', e.message));
            await nationCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Nation]', e.message));
            await valasCmd(command, args, msg, user, db)
                .catch(e => console.error('[Valas]', e.message));
            await farmingCmd(command, args, msg, user, db)
                .catch(e => console.error('[Farming]', e.message));
            await jobsCmd(command, args, msg, user, db)
                .catch(e => console.error('[Jobs]', e.message));
            await rouletteCmd(command, args, msg, user, db)
                .catch(e => console.error('[Roulette]', e.message));
            await battleCmd(command, args, msg, user, db)
                .catch(e => console.error('[Battle]', e.message));
            await ttsCmd(command, args, msg)
                .catch(e => console.error('[TTS]', e.message));
            await wikiKnowCmd(command, args, msg)
                .catch(e => console.error('[WikiKnow]', e.message));
            await adminCmd(command, args, msg, user, db)
                .catch(e => console.error('[Admin]', e.message));
            await rpgCmd(command, args, msg, user, db)
                .catch(e => console.error('[RPG]', e.message));
            await slitherCmd(command, args, msg, user, db)
                .catch(e => console.error('[Slither]', e.message));
            await aiCmd(command, args, msg, user, db)
                .catch(e => console.error('[AI]', e.message));
            await caturCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Catur]', e.message));
            await imageCmd(command, args, msg, user, db, sock)
                .catch(e => console.error('[Image]', e.message));

            // ── Fitur Original Tambahan ────────────────────────
            await aiToolsCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[AITools]', e.message));
            await moodCmd(command, args, msg, user, db)
                .catch(e => console.error('[Mood]', e.message));
            await triviaCmd(command, args, msg, user, db, body)
                .catch(e => console.error('[Trivia]', e.message));
            await wordleCmd(command, args, msg, user, db)
                .catch(e => console.error('[Wordle]', e.message));
            await akinatorCmd(command, args, msg, user, db)
                .catch(e => console.error('[Akinator]', e.message));
            await portoCmd(command, args, msg, user, db)
                .catch(e => console.error('[Porto]', e.message));
            await perkiraanCmd(command, args, msg, user, db)
                .catch(e => console.error('[Prakiraan]', e.message));
            await bgToolsCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[BGTools]', e.message));
            await shortlinkCmd(command, args, msg, user, db)
                .catch(e => console.error('[Shortlink]', e.message));
            await zodiakCmd(command, args, msg, user, db)
                .catch(e => console.error('[Zodiak]', e.message));
            await kreatifCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Kreatif]', e.message));
            await analitikCmd(command, args, msg, user, db)
                .catch(e => console.error('[Analitik]', e.message));
            await profileCmd(command, args, msg, user, db, chat, sock)
                .catch(e => console.error('[Profile]', e.message));

            // ── FITUR BARU v2.0 ────────────────────────────────
            await reminderCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Reminder]', e.message));
            await groupCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Group]', e.message));
            await kalkulatorCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Kalkulator]', e.message));
            await beritaCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Berita]', e.message));
            await tiktokCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[TikTok]', e.message));
            await utilitasCmd(command, args, msg, user, db, sock, m)
                .catch(e => console.error('[Utilitas]', e.message));

        } catch(e) {
            console.error('[Critical Error]', e.message);
        }
    });

    // AUTO SAVE setiap 60 detik
    setInterval(() => { if (global.db) saveDB(global.db); }, 60000);
}

startBot();

// ══════════════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ══════════════════════════════════════════════════════════════════════
async function handleExit(signal) {
    console.log(`\n🛑 Sinyal ${signal}. Mematikan bot...`);
    if (global.db && typeof saveDB === 'function') await saveDB(global.db);
    console.log('✅ Shutdown selesai. Bye!'); process.exit(0);
}
process.on('SIGINT',  () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
process.on('uncaughtException',  (e) => console.error('[uncaughtException]',  e.message));
process.on('unhandledRejection', (e) => console.error('[unhandledRejection]', e));