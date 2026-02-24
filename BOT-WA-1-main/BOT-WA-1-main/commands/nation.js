/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║            🌍 SISTEM NATION TERMUTAKHIR v3.0 🌍              ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  COMMAND PUBLIK (Grup):                                     ║
 * ║  !negara / !nation         Dashboard negara                 ║
 * ║  !buatnegara <nama>        Dirikan negara (5 Miliar)        ║
 * ║  !topnegara / !listnegara  Peta kekuatan dunia              ║
 * ║  !statsnegara @user        Intel publik terbatas            ║
 * ║  !bangun [kode]            Bangun infrastruktur             ║
 * ║  !demolish [kode]          Bongkar bangunan (refund 50%)    ║
 * ║  !rekrut <jml>             Rekrut tentara                   ║
 * ║  !demobilisasi <jml>       Bubarkan tentara (refund 40%)    ║
 * ║  !pajaknegara              Pungut pajak rakyat              ║
 * ║  !subsidi <nominal/all>    Transfer pribadi → kas negara    ║
 * ║  !tarikkas <nominal/all>   Tarik kas negara → pribadi       ║
 * ║  !korupsi <nominal/all>    Korupsi diam-diam (risiko!)      ║
 * ║  !serang @user             Serangan militer terbuka         ║
 * ║  !serangangudara @user     Serangan udara (pakai rudal)     ║
 * ║  !blokade @user            Blokade ekonomi (tanpa perang)   ║
 * ║  !aliansi @user            Ajukan pakta aliansi             ║
 * ║  !terimaliansi @user       Terima tawaran aliansi           ║
 * ║  !tolaklansi @user         Tolak tawaran aliansi            ║
 * ║  !listaliansi              Lihat sekutu aktif               ║
 * ║  !bubaraliansi @user       Putuskan aliansi                 ║
 * ║  !bangunrudal              Produksi rudal (butuh silo)      ║
 * ║  !bangunbom                Produksi bom nuklir (butuh lab)  ║
 * ║  !perisai                  Aktifkan perisai 2 jam           ║
 * ║  !gencatan @user           Tawarkan gencatan senjata        ║
 * ║  !terimagencatan @user     Terima gencatan senjata          ║
 * ║  !riset [kode]             Lakukan penelitian teknologi     ║
 * ║  !propaganda               Sebarkan propaganda (stabilitas) ║
 * ║  !sensus                   Laporan statistik negara         ║
 * ║  !renamekan <nama>         Ganti nama negara                ║
 * ║  !resetmynation            Reset data negara sendiri        ║
 * ╠══════════════════════════════════════════════════════════════╣
 * ║  COMMAND RAHASIA (Chat Pribadi ke Bot SAJA!):               ║
 * ║  !spionase @user           Intai detail musuh (75%)        ║
 * ║  !sadap @user              Sadap komunikasi musuh (60%)    ║
 * ║  !sabotase @user           Rusak bangunan musuh (50%)      ║
 * ║  !teror @user              Semai kerusuhan (55%)           ║
 * ║  !kudeta @user             Picu pemberontakan (30%)        ║
 * ║  !racun @user              Bunuh tentara (tanpa perang 40%) ║
 * ║  !suap @user               Suap jenderal musuh (35%)       ║
 * ║  !curi @user               Curi dari kas musuh (45%)       ║
 * ║  !laporanmata              Lihat log semua misi rahasia     ║
 * ║  !tarikagen                Hentikan semua operasi aktif     ║
 * ║  !identitasagen            Lihat profil agen aktif          ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

'use strict';
const { saveDB } = require('../helpers/database');

// ═══════════════════════════════════════════════════════════════
// ⚙️  KONFIGURASI LENGKAP
// ═══════════════════════════════════════════════════════════════
const CFG = {
    // Biaya dasar
    BIAYA_BERDIRI:    5_000_000_000,
    BIAYA_TENTARA:    50_000_000,
    PAJAK_DASAR:      100_000,
    BIAYA_PROPAGANDA: 500_000_000,
    BIAYA_PERISAI:    5_000_000_000,
    BIAYA_SENSUS:     100_000_000,
    BIAYA_BLOKADE:    2_000_000_000,
    BIAYA_GENCATAN:   1_000_000_000,

    // Cooldown (ms)
    CD_PAJAK:         60 * 60 * 1000,    // 1 jam
    CD_SERANG:        30 * 60 * 1000,    // 30 menit
    CD_SPY:           15 * 60 * 1000,    // 15 menit
    CD_BLOKADE:       2 * 60 * 60 * 1000,// 2 jam
    CD_PROPAGANDA:    3 * 60 * 60 * 1000,// 3 jam
    CD_GENCATAN:      24 * 60 * 60 * 1000,// 24 jam
    PERISAI_DURASI:   2 * 60 * 60 * 1000, // 2 jam
    BLOKADE_DURASI:   4 * 60 * 60 * 1000, // 4 jam

    // Batasan
    MAX_ALIANSI:      3,
    MAX_RUDAL:        20,
    MAX_BOM_NUKLIR:   3,

    // INFRASTRUKTUR
    BANGUNAN: {
        bank:     { nama: '🏦 Bank Sentral',        harga: 10_000_000_000, efek: 'Pajak +15%/lv | Max Lv.5' },
        benteng:  { nama: '🏰 Benteng',             harga: 25_000_000_000, efek: 'Defense +25%/lv | Max Lv.5' },
        rs:       { nama: '🏥 Rumah Sakit',         harga:  5_000_000_000, efek: 'Populasi +2%/lv | Kurangi korban perang' },
        intel:    { nama: '🕵️ Markas Intelijen',   harga: 15_000_000_000, efek: 'Buka misi rahasia | Counter-intel +10%/lv' },
        silo:     { nama: '🚀 Silo Rudal',          harga: 50_000_000_000, efek: 'Produksi & simpan rudal' },
        radar:    { nama: '📡 Radar & Pertahanan',  harga: 30_000_000_000, efek: 'Tangkis rudal 15%/lv | Kurangi sabotase' },
        nuklir:   { nama: '☢️  Lab Nuklir',         harga: 80_000_000_000, efek: 'Produksi bom nuklir | Rudal +50% damage' },
        kilang:   { nama: '🏭 Kilang Industri',     harga: 20_000_000_000, efek: 'Pajak +10%/lv | Populasi tumbuh lebih cepat' },
        dermaga:  { nama: '⚓ Dermaga Militer',     harga: 35_000_000_000, efek: 'Blokade lebih efektif | Bonus serangan 10%' },
        univ:     { nama: '🎓 Universitas Riset',   harga: 12_000_000_000, efek: 'Buka riset teknologi | Unlock bonus spesial' },
        kebun:    { nama: '🌿 Kebun Rakyat',        harga:  3_000_000_000, efek: 'Stabilitas +1/jam | Populasi hepi' },
        penjara:  { nama: '⛓️  Penjara Negara',     harga:  8_000_000_000, efek: 'Tangkap agen musuh +20% | Kurangi teror' },
    },
    MAX_BANGUNAN: { bank: 5, benteng: 5, rs: 5, intel: 3, silo: 2, radar: 3, nuklir: 1, kilang: 3, dermaga: 2, univ: 2, kebun: 5, penjara: 2 },

    // RISET TEKNOLOGI
    RISET: {
        rudal_pintar:  { nama: '🎯 Rudal Pintar',      biaya: 10_000_000_000, efek: 'Rudal 30% lebih akurat', univ_min: 1 },
        agen_elite:    { nama: '🕵️‍♂️ Agen Elite',     biaya: 15_000_000_000, efek: 'Misi spy +15% sukses', univ_min: 1 },
        ekonomi_maju:  { nama: '💹 Ekonomi Maju',      biaya: 20_000_000_000, efek: 'Pajak +25% bonus', univ_min: 1 },
        armor_baja:    { nama: '🛡️ Armor Baja',        biaya: 25_000_000_000, efek: 'Def +15% pasif', univ_min: 2 },
        drone_serang:  { nama: '🛸 Drone Serang',       biaya: 30_000_000_000, efek: 'Serangan -20% kerugian', univ_min: 2 },
        bioweapon:     { nama: '🧬 Bio-weapon',         biaya: 50_000_000_000, efek: 'Racun 2x lebih mematikan', univ_min: 2 },
    },

    // MISI SPIONASE
    MISI_SPY: {
        spionase:  { biaya: 500_000_000,   sukses: 0.75, intel_min: 1, nama: '🔍 Spionase' },
        sadap:     { biaya: 800_000_000,   sukses: 0.60, intel_min: 1, nama: '📡 Penyadapan' },
        sabotase:  { biaya: 1_500_000_000, sukses: 0.50, intel_min: 1, nama: '💣 Sabotase' },
        teror:     { biaya: 1_000_000_000, sukses: 0.55, intel_min: 1, nama: '💥 Operasi Teror' },
        kudeta:    { biaya: 3_000_000_000, sukses: 0.30, intel_min: 2, nama: '👑 Kudeta' },
        racun:     { biaya: 2_000_000_000, sukses: 0.40, intel_min: 2, nama: '☠️  Racun' },
        suap:      { biaya: 2_500_000_000, sukses: 0.35, intel_min: 2, nama: '💰 Suap Jenderal' },
        curi:      { biaya: 1_200_000_000, sukses: 0.45, intel_min: 1, nama: '💸 Curi Kas' },
    },
};

// ═══════════════════════════════════════════════════════════════
// 🔧 HELPERS
// ═══════════════════════════════════════════════════════════════
const fmt    = (n)  => Math.floor(Number(n) || 0).toLocaleString('id-ID');
const fmtBTC = (n)  => (Number(n) || 0).toFixed(6);
const jamStr = (ms) => ms <= 0 ? 'sekarang' : ms < 60000 ? `${Math.ceil(ms/1000)} detik` : `${Math.ceil(ms/60000)} menit`;
const bar    = (v, max = 100, len = 10) => { const f = Math.round((Math.min(v,max)/max)*len); return '█'.repeat(Math.max(0,f)) + '░'.repeat(Math.max(0,len-f)); };

const hitungPower = (n) => {
    if (!n) return 0;
    const defB = 1 + ((n.buildings?.benteng || 0) * 0.25) + ((n.riset?.armor_baja ? 0.15 : 0));
    const drmg = 1 + ((n.buildings?.dermaga || 0) * 0.10);
    return Math.floor((n.defense || 0) * defB * drmg);
};

const hitungPajak = (n) => {
    if (!n) return 0;
    const bankB   = 1 + ((n.buildings?.bank || 0) * 0.15);
    const kilangB = 1 + ((n.buildings?.kilang || 0) * 0.10);
    const risetB  = n.riset?.ekonomi_maju ? 1.25 : 1;
    return Math.floor((n.population || 0) * CFG.PAJAK_DASAR * bankB * kilangB * risetB);
};

const statusStab = (s) => {
    if (s >= 90) return '🟢 Sangat Stabil';
    if (s >= 70) return '🟢 Stabil';
    if (s >= 50) return '🟡 Bergejolak';
    if (s >= 30) return '🟠 Rusuh';
    if (s >= 10) return '🔴 ANARKI';
    return '💀 KOLAPS';
};

const statusMiliter = (d) => {
    if (d >= 10000) return '💀 Angkatan Besar';
    if (d >= 5000)  return '⚔️ Militer Kuat';
    if (d >= 1000)  return '🛡️ Sedang';
    if (d >= 100)   return '🏹 Lemah';
    return '🪶 Hampir Tanpa Militer';
};

const getMentionTarget = (msg, args) => {
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid
                  || msg.mentionedIds || [];
    let id = mentions[0];
    if (!id && args[0]) {
        const n = args[0].replace(/[^0-9]/g, '');
        if (n) id = n + '@s.whatsapp.net';
    }
    return id;
};

const sanitize = (n) => {
    if (!n) return n;
    if (!n.buildings)   n.buildings   = {};
    if (!n.riset)       n.riset       = {};
    if (!n.aliansi)     n.aliansi     = [];
    if (!n.spyLog)      n.spyLog      = [];
    if (!n.agenAktif)   n.agenAktif   = {};
    if (!n.warLog)      n.warLog      = [];
    if (!n.blokade)     n.blokade     = {};
    if (!n.gencatan)    n.gencatan    = [];
    Object.keys(CFG.BANGUNAN).forEach(k => { if (!n.buildings[k]) n.buildings[k] = 0; });
    const def = {
        stability: 100, treasury: 0, defense: 50, population: 1000,
        lastTax: 0, lastAttack: 0, lastSpy: 0, lastBlokade: 0,
        lastPropaganda: 0, lastGencatan: 0,
        rudal: 0, bomNuklir: 0, perisai: 0, diblokade: 0,
        totalPajak: 0, totalPerang: 0, totalMenang: 0, totalKalah: 0,
    };
    Object.entries(def).forEach(([k,v]) => { if (typeof n[k] === 'undefined') n[k] = v; });
    return n;
};

// ═══════════════════════════════════════════════════════════════
// DAFTAR COMMAND
// ═══════════════════════════════════════════════════════════════
const CMD_PUBLIK = [
    'negara','nation','buatnegara','topnegara','listnegara','statsnegara',
    'bangun','build','demolish','rekrut','demobilisasi',
    'pajaknegara','subsidi','tarikkas','korupsi',
    'serang','war','serangangudara','blokade',
    'aliansi','terimaliansi','tolaklansi','listaliansi','bubaraliansi',
    'bangunrudal','bangunbom','perisai',
    'gencatan','terimagencatan',
    'riset','propaganda','sensus','renamekan','resetmynation',
];
const CMD_RAHASIA = [
    'spionase','sadap','sabotase','teror','kudeta','racun','suap','curi',
    'laporanmata','tarikagen','identitasagen',
];

// ═══════════════════════════════════════════════════════════════
// 🚀 MODULE EXPORT
// ═══════════════════════════════════════════════════════════════
module.exports = async (command, args, msg, user, db, sock) => {
    if (![...CMD_PUBLIK, ...CMD_RAHASIA].includes(command)) return;

    if (!db.nations)  db.nations  = {};
    if (!db.pending)  db.pending  = {};
    if (!db.pending.aliansi)  db.pending.aliansi  = {};
    if (!db.pending.gencatan) db.pending.gencatan = {};

    const senderId  = msg.author || msg.key?.participant || msg.key?.remoteJid;
    const remoteJid = msg.key?.remoteJid || msg.from;
    const isGroup   = remoteJid?.endsWith('@g.us');
    const now       = Date.now();

    const sendDM = async (jid, text) => {
        if (!sock) return;
        try { await sock.sendMessage(jid, { text }); } catch (e) {}
    };

    // ── BLOKIR COMMAND RAHASIA DI GRUP ──
    if (CMD_RAHASIA.includes(command)) {
        if (isGroup) {
            return msg.reply(
                '🔒 *PERINTAH RAHASIA — JANGAN DI SINI!*\n\n' +
                '⚠️ Mengetik command spionase di grup akan memperlihatkan aktivitasmu kepada lawan!\n\n' +
                '📱 Chat langsung ke *nomor bot* secara pribadi:\n\n' +
                '🔍 `!spionase @user`    — Intai kekuatan musuh\n' +
                '📡 `!sadap @user`       — Sadap komunikasi musuh\n' +
                '💣 `!sabotase @user`    — Hancurkan bangunan musuh\n' +
                '💥 `!teror @user`       — Semai kerusuhan\n' +
                '👑 `!kudeta @user`      — Picu pemberontakan\n' +
                '☠️  `!racun @user`      — Bunuh tentara diam-diam\n' +
                '💰 `!suap @user`        — Suap jenderal musuh\n' +
                '💸 `!curi @user`        — Curi dari kas negara musuh\n' +
                '📋 `!laporanmata`       — Laporan semua misi\n\n' +
                '_Semua misi di atas hanya bisa dijalankan via DM ke bot._'
            );
        }
        return handleSpionase(command, args, msg, user, db, sock, senderId, sendDM, now);
    }

    // Stabilitas otomatis tumbuh dari kebun
    const myNation = db.nations[senderId];
    if (myNation && myNation.buildings?.kebun > 0) {
        const kebunTick = Math.floor(((now - (myNation.lastKebun || now)) / 3600000) * myNation.buildings.kebun);
        if (kebunTick > 0) {
            myNation.stability = Math.min(100, (myNation.stability || 100) + kebunTick);
            myNation.lastKebun = now;
        }
    }

    const nation = sanitize(db.nations[senderId]);

    // ════════════════════════════════════════════════════════
    // 📊  DASHBOARD !negara / !nation
    // ════════════════════════════════════════════════════════
    if (command === 'negara' || command === 'nation') {
        if (!nation) return msg.reply(
            '🌍 *SISTEM NATION v3.0*\n\n' +
            'Kamu belum punya negara!\n' +
            `💸 Modal berdiri: Rp ${fmt(CFG.BIAYA_BERDIRI)}\n\n` +
            '📋 Ketik: `!buatnegara <nama_negara>`\n' +
            '🗺️ Lihat peta: `!topnegara`\n' +
            '📖 Panduan: `!menu negara`'
        );

        const power     = hitungPower(nation);
        const pajak     = hitungPajak(nation);
        const defBonus  = nation.buildings.benteng * 25;
        const paj0      = nation.buildings.bank * 15 + nation.buildings.kilang * 10;
        const perisaiOn = nation.perisai > now;
        const diblokOn  = nation.diblokade > now;
        const sekutu    = nation.aliansi.map(id => db.nations[id]?.name || '❓').join(', ') || 'Tidak ada';
        const winRate   = nation.totalPerang > 0 ? Math.round((nation.totalMenang / nation.totalPerang) * 100) : 0;

        let txt = `🌍 ╔══ *REPUBLIK ${nation.name.toUpperCase()}* ══╗\n`;
        txt += `👤 Presiden: ${msg.pushName}\n\n`;

        txt += `📊 *STATUS NEGARA*\n`;
        txt += `⭐ Power Rating: *${fmt(power)}*\n`;
        txt += `📈 Stabilitas: [${bar(nation.stability)}] ${nation.stability}% ${statusStab(nation.stability)}\n`;
        if (perisaiOn) txt += `🛡️ Perisai: 🔒 Aktif s/d ${new Date(nation.perisai).toLocaleTimeString('id-ID')}\n`;
        if (diblokOn)  txt += `⛔ DIBLOKADE: Aktif s/d ${new Date(nation.diblokade).toLocaleTimeString('id-ID')}\n`;
        txt += `\n`;

        txt += `👥 *KEPENDUDUKAN*\n`;
        txt += `• Penduduk: ${fmt(nation.population)} jiwa\n`;
        txt += `• Status Mil: ${statusMiliter(nation.defense)}\n\n`;

        txt += `💰 *KEUANGAN*\n`;
        txt += `• Kas Negara: Rp ${fmt(nation.treasury)}\n`;
        txt += `• Est. Pajak/sesi: Rp ${fmt(pajak)}\n`;
        txt += `• Bonus Pajak: +${paj0}%\n\n`;

        txt += `⚔️ *KEKUATAN MILITER*\n`;
        txt += `• Tentara: ${fmt(nation.defense)} personil\n`;
        txt += `• Bonus Defense: +${defBonus}%\n`;
        txt += `• Rudal: ${nation.rudal} unit\n`;
        txt += `• Bom Nuklir: ${nation.bomNuklir} unit\n`;
        txt += `• Rekam Perang: ${nation.totalMenang}M/${nation.totalKalah}K (WR ${winRate}%)\n\n`;

        txt += `🏗️ *INFRASTRUKTUR*\n`;
        const aktivBangun = Object.entries(CFG.BANGUNAN).filter(([k]) => (nation.buildings[k] || 0) > 0);
        if (aktivBangun.length === 0) {
            txt += `• Belum ada bangunan\n`;
        } else {
            aktivBangun.forEach(([k, v]) => {
                txt += `• ${v.nama} Lv.${nation.buildings[k]}\n`;
            });
        }
        txt += `\n`;

        const aktivRiset = Object.keys(nation.riset || {}).filter(k => nation.riset[k]);
        if (aktivRiset.length > 0) {
            txt += `🔬 *TEKNOLOGI AKTIF*\n`;
            aktivRiset.forEach(k => txt += `• ${CFG.RISET[k]?.nama || k}\n`);
            txt += `\n`;
        }

        txt += `🤝 *SEKUTU:* ${sekutu}\n\n`;
        txt += `💡 \`!bangun\` · \`!rekrut\` · \`!serang\` · \`!riset\`\n`;
        txt += `🔒 _Misi rahasia → chat pribadi ke nomor bot_`;

        return msg.reply(txt);
    }

    // ════════════════════════════════════════════════════════
    // 📋  SENSUS LENGKAP
    // ════════════════════════════════════════════════════════
    if (command === 'sensus') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (nation.treasury < CFG.BIAYA_SENSUS) return msg.reply(`❌ Sensus butuh Rp ${fmt(CFG.BIAYA_SENSUS)} dari kas.`);

        nation.treasury -= CFG.BIAYA_SENSUS;
        db.nations[senderId] = nation;
        saveDB(db);

        const power = hitungPower(nation);
        const pajak = hitungPajak(nation);
        const rank  = Object.values(db.nations).sort((a,b) => hitungPower(b)-hitungPower(a)).findIndex(n => n.name === nation.name) + 1;
        const total = Object.keys(db.nations).length;

        let txt = `📊 *LAPORAN SENSUS NEGARA: ${nation.name.toUpperCase()}*\n`;
        txt += `📅 ${new Date(now).toLocaleString('id-ID')}\n`;
        txt += `${'─'.repeat(32)}\n\n`;

        txt += `🏆 *RANKING: #${rank} dari ${total} negara*\n\n`;

        txt += `👥 *DEMOGRAFI*\n`;
        txt += `• Total Penduduk: ${fmt(nation.population)} jiwa\n`;
        txt += `• Tentara Aktif: ${fmt(nation.defense)} personil\n`;
        txt += `• Rasio Militer: ${((nation.defense/nation.population)*100).toFixed(2)}%\n\n`;

        txt += `💰 *EKONOMI*\n`;
        txt += `• Kas Negara: Rp ${fmt(nation.treasury)}\n`;
        txt += `• Potensi Pajak/sesi: Rp ${fmt(pajak)}\n`;
        txt += `• Total Pajak Terkumpul: Rp ${fmt(nation.totalPajak || 0)}\n\n`;

        txt += `⚔️ *MILITER*\n`;
        txt += `• Power Rating: ${fmt(power)}\n`;
        txt += `• Rudal: ${nation.rudal} unit | Bom Nuklir: ${nation.bomNuklir} unit\n`;
        txt += `• Total Perang: ${nation.totalPerang} | Menang: ${nation.totalMenang} | Kalah: ${nation.totalKalah}\n\n`;

        txt += `🏗️ *INFRASTRUKTUR* (${Object.values(nation.buildings).reduce((s,v)=>s+v,0)} level total)\n`;
        Object.entries(CFG.BANGUNAN).forEach(([k,v]) => {
            const lv = nation.buildings[k] || 0;
            if (lv > 0) txt += `  ${v.nama}: Lv.${lv}\n`;
        });

        txt += `\n🔬 *RISET:* ${Object.keys(nation.riset||{}).filter(k=>nation.riset[k]).length} teknologi aktif\n`;
        txt += `🤝 *ALIANSI:* ${nation.aliansi.length} sekutu aktif\n`;

        return msg.reply(txt);
    }

    // ════════════════════════════════════════════════════════
    // 🏛️  BUAT NEGARA
    // ════════════════════════════════════════════════════════
    if (command === 'buatnegara') {
        if (nation) return msg.reply('❌ Kamu sudah menjabat Presiden. Gunakan `!negara` untuk dashboard.');
        if (user.balance < CFG.BIAYA_BERDIRI) return msg.reply(`❌ Modal kurang! Perlu Rp ${fmt(CFG.BIAYA_BERDIRI)}.`);
        const nama = args.join(' ').trim();
        if (!nama) return msg.reply('❌ Masukkan nama negara!\nContoh: `!buatnegara Nusantara`');
        if (nama.length > 25) return msg.reply('❌ Nama negara maksimal 25 karakter!');
        if (Object.values(db.nations).some(n => n.name?.toLowerCase() === nama.toLowerCase())) {
            return msg.reply('❌ Nama negara sudah dipakai orang lain!');
        }

        user.balance -= CFG.BIAYA_BERDIRI;
        db.nations[senderId] = sanitize({
            name: nama, population: 1000, defense: 50,
            treasury: 2_000_000_000, stability: 100,
            lastTax: 0, lastAttack: 0, lastSpy: 0, lastBlokade: 0,
            lastPropaganda: 0, lastKebun: now,
            aliansi: [], rudal: 0, bomNuklir: 0,
            spyLog: [], agenAktif: {}, warLog: [],
            perisai: 0, diblokade: 0, blokade: {}, gencatan: [],
            riset: {}, buildings: {},
            totalPajak: 0, totalPerang: 0, totalMenang: 0, totalKalah: 0,
        });
        saveDB(db);

        return msg.reply(
            `🎉 *DEKLARASI KEMERDEKAAN!* 🎉\n\n` +
            `Selamat Presiden ${msg.pushName}!\n` +
            `Negara *${nama}* resmi berdiri di peta dunia!\n\n` +
            `🎁 Modal awal kas: Rp 2.000.000.000\n\n` +
            `📋 *ROADMAP AWAL:*\n` +
            `1️⃣ \`!subsidi 1000000000\` — Perkuat kas negara\n` +
            `2️⃣ \`!bangun bank\` — Tingkatkan pendapatan pajak\n` +
            `3️⃣ \`!rekrut 100\` — Perkuat militer\n` +
            `4️⃣ \`!bangun intel\` — Aktifkan unit spionase\n` +
            `5️⃣ \`!bangun kebun\` — Jaga stabilitas rakyat\n` +
            `6️⃣ \`!topnegara\` — Pantau posisi di peta dunia\n\n` +
            `🔒 _Ketik \`!menu negara\` untuk panduan lengkap_\n` +
            `🔒 _Chat bot secara pribadi untuk misi rahasia!_`
        );
    }

    // ════════════════════════════════════════════════════════
    // 🏗️  BANGUN INFRASTRUKTUR
    // ════════════════════════════════════════════════════════
    if (command === 'bangun' || command === 'build') {
        if (!nation) return msg.reply('❌ Belum punya negara. Ketik `!buatnegara <nama>`.');
        const kode = args[0]?.toLowerCase();
        const b = CFG.BANGUNAN[kode];

        if (!b) {
            let txt = `🏗️ *KATALOG INFRASTRUKTUR NEGARA*\n`;
            txt += `💰 Kas: Rp ${fmt(nation.treasury)}\n\n`;
            for (const [k, v] of Object.entries(CFG.BANGUNAN)) {
                const lv   = nation.buildings[k] || 0;
                const maxLv = CFG.MAX_BANGUNAN[k] || 5;
                const harga = v.harga * (lv + 1); // Biaya naik tiap level
                const status = lv >= maxLv ? '✅ MAX' : `Lv.${lv} → Lv.${lv+1}: Rp ${fmt(harga)}`;
                txt += `${v.nama} [\`${k}\`]\n  📌 ${v.efek}\n  💳 ${status}\n\n`;
            }
            txt += `Cara bangun: \`!bangun bank\`\nCara bongkar: \`!demolish bank\``;
            return msg.reply(txt);
        }

        const curLv  = nation.buildings[kode] || 0;
        const maxLv  = CFG.MAX_BANGUNAN[kode] || 5;
        if (curLv >= maxLv) return msg.reply(`❌ ${b.nama} sudah Level MAX (${maxLv})!`);

        const harga = b.harga * (curLv + 1); // Harga naik tiap level
        if (nation.treasury < harga) return msg.reply(`❌ Kas kurang! Perlu Rp ${fmt(harga)}, punya Rp ${fmt(nation.treasury)}.`);

        nation.treasury -= harga;
        nation.buildings[kode] = curLv + 1;
        db.nations[senderId] = nation;
        saveDB(db);

        let extra = '';
        if (kode === 'intel') extra = '\n\n🔒 _Markas Intelijen aktif! Chat bot secara PRIBADI untuk misi spionase._';
        if (kode === 'univ')  extra = '\n\n🔬 _Universitas aktif! Gunakan `!riset` untuk membuka teknologi._';
        if (kode === 'kebun') extra = '\n\n🌿 _Kebun aktif! Stabilitas rakyat akan tumbuh otomatis setiap jam._';

        return msg.reply(
            `🏗️ *PEMBANGUNAN SELESAI!*\n` +
            `${b.nama} → *Level ${nation.buildings[kode]}/${maxLv}*\n` +
            `✅ Efek: ${b.efek}\n` +
            `💰 Biaya: Rp ${fmt(harga)}${extra}`
        );
    }

    // ════════════════════════════════════════════════════════
    // 🔨  DEMOLISH BANGUNAN
    // ════════════════════════════════════════════════════════
    if (command === 'demolish') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const kode = args[0]?.toLowerCase();
        if (!CFG.BANGUNAN[kode]) return msg.reply('❌ Kode bangunan salah. Cek `!bangun` untuk daftar kode.');
        if (!nation.buildings[kode]) return msg.reply(`❌ Kamu tidak punya ${CFG.BANGUNAN[kode].nama}.`);

        const curLv  = nation.buildings[kode];
        const refund = Math.floor(CFG.BANGUNAN[kode].harga * curLv * 0.5);
        nation.treasury += refund;
        nation.buildings[kode] = Math.max(0, curLv - 1);
        db.nations[senderId] = nation;
        saveDB(db);

        return msg.reply(
            `🔨 *BANGUNAN DIBONGKAR*\n` +
            `${CFG.BANGUNAN[kode].nama}: Lv.${curLv} → Lv.${nation.buildings[kode]}\n` +
            `💰 Refund 50%: +Rp ${fmt(refund)}`
        );
    }

    // ════════════════════════════════════════════════════════
    // 🔬  RISET TEKNOLOGI
    // ════════════════════════════════════════════════════════
    if (command === 'riset') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.buildings.univ) return msg.reply('❌ Bangun *Universitas Riset* dulu! (`!bangun univ`)');

        const kode = args[0]?.toLowerCase();
        if (!kode) {
            let txt = `🔬 *KATALOG RISET TEKNOLOGI*\n`;
            txt += `🎓 Univ Level: ${nation.buildings.univ}\n\n`;
            for (const [k, v] of Object.entries(CFG.RISET)) {
                const sudah  = nation.riset[k] ? '✅' : '🔹';
                const terkunci = nation.buildings.univ < v.univ_min ? `🔒 Butuh Univ Lv.${v.univ_min}` : `Rp ${fmt(v.biaya)}`;
                txt += `${sudah} ${v.nama} [\`${k}\`]\n  📌 ${v.efek}\n  💳 ${nation.riset[k] ? 'SUDAH DIRISET' : terkunci}\n\n`;
            }
            txt += '`!riset <kode>` untuk meneliti';
            return msg.reply(txt);
        }

        const r = CFG.RISET[kode];
        if (!r) return msg.reply('❌ Kode riset tidak ditemukan. Cek `!riset` untuk daftar.');
        if (nation.riset[kode]) return msg.reply(`✅ *${r.nama}* sudah diriset sebelumnya!`);
        if (nation.buildings.univ < r.univ_min) return msg.reply(`❌ Butuh Universitas Level ${r.univ_min}+.`);
        if (nation.treasury < r.biaya) return msg.reply(`❌ Kas kurang! Perlu Rp ${fmt(r.biaya)}.`);

        nation.treasury -= r.biaya;
        nation.riset[kode] = true;
        db.nations[senderId] = nation;
        saveDB(db);

        return msg.reply(`🔬 *RISET BERHASIL!*\n${r.nama} telah dikuasai!\n✅ Efek aktif: ${r.efek}`);
    }

    // ════════════════════════════════════════════════════════
    // 💰  PAJAK
    // ════════════════════════════════════════════════════════
    if (command === 'pajaknegara') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const sisa = CFG.CD_PAJAK - (now - nation.lastTax);
        if (sisa > 0) return msg.reply(`⏳ Pajak baru bisa dipungut dalam ${jamStr(sisa)}.`);
        if (nation.stability < 20) return msg.reply('❌ Rakyat dalam kondisi ANARKI! Stabilkan dulu dengan `!propaganda` atau `!subsidi`.');

        // Cek blokade
        const blokadePenalti = nation.diblokade > now ? 0.5 : 1;
        const pendapatan = Math.floor(hitungPajak(nation) * blokadePenalti);
        const growthBase = 0.05 + (nation.buildings.rs * 0.02) + (nation.buildings.kilang * 0.01);
        const populasiBaru = Math.floor(nation.population * growthBase);

        nation.treasury  += pendapatan;
        nation.population += populasiBaru;
        nation.lastTax    = now;
        nation.totalPajak = (nation.totalPajak || 0) + pendapatan;
        db.nations[senderId] = nation;
        saveDB(db);

        let txt = `💰 *PENDAPATAN NEGARA*\n`;
        txt += `Pajak Terkumpul: +Rp ${fmt(pendapatan)}\n`;
        if (blokadePenalti < 1) txt += `⚠️ Diblokade! Pajak -50%\n`;
        txt += `Kelahiran Rakyat: +${fmt(populasiBaru)} jiwa\n`;
        txt += `🏛️ Kas Total: Rp ${fmt(nation.treasury)}`;
        return msg.reply(txt);
    }

    // ════════════════════════════════════════════════════════
    // 🪖  REKRUT & DEMOBILISASI
    // ════════════════════════════════════════════════════════
    if (command === 'rekrut') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const qty = parseInt(args[0]);
        if (isNaN(qty) || qty < 1) return msg.reply('❌ Format: `!rekrut <jumlah>` | Contoh: `!rekrut 100`');
        const biaya = qty * CFG.BIAYA_TENTARA;
        if (nation.treasury < biaya) return msg.reply(`❌ Kas kurang Rp ${fmt(biaya)}. Punya: Rp ${fmt(nation.treasury)}.`);

        nation.treasury -= biaya;
        nation.defense  += qty;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`🪖 *REKRUTMEN SELESAI*\n+${fmt(qty)} personil! Total: ${fmt(nation.defense)} tentara`);
    }

    if (command === 'demobilisasi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const qty = parseInt(args[0]);
        if (isNaN(qty) || qty < 1) return msg.reply('❌ Format: `!demobilisasi <jumlah>`');
        if (qty > nation.defense) return msg.reply(`❌ Tentara hanya ${fmt(nation.defense)} orang.`);

        const refund = Math.floor(qty * CFG.BIAYA_TENTARA * 0.4);
        nation.defense  -= qty;
        nation.treasury += refund;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`✅ *DEMOBILISASI*\n${fmt(qty)} tentara dipulangkan.\n💰 Refund 40%: +Rp ${fmt(refund)}\nSisa pasukan: ${fmt(nation.defense)}`);
    }

    // ════════════════════════════════════════════════════════
    // 💸  KEUANGAN
    // ════════════════════════════════════════════════════════
    if (command === 'subsidi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        let amount = args[0] === 'all' ? user.balance : parseInt(args[0]);
        if (isNaN(amount) || amount < 1000) return msg.reply('❌ Nominal tidak valid. Contoh: `!subsidi 1000000000`');
        if (user.balance < amount) return msg.reply('❌ Saldo pribadi kurang.');

        user.balance    -= amount;
        nation.treasury += amount;
        nation.stability = Math.min(100, nation.stability + 3);
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`💸 *SUBSIDI NEGARA*\n+Rp ${fmt(amount)} masuk kas.\nStabilitas rakyat: ${nation.stability}%\nKas total: Rp ${fmt(nation.treasury)}`);
    }

    if (command === 'tarikkas') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        let amount = args[0] === 'all' ? nation.treasury : parseInt(args[0]);
        if (isNaN(amount) || amount < 1000) return msg.reply('❌ Nominal tidak valid.');
        if (nation.treasury < amount) return msg.reply('❌ Kas negara tidak cukup.');

        // Pajak penarikan 10%
        const pajak_tarik = Math.floor(amount * 0.10);
        const net = amount - pajak_tarik;

        nation.treasury -= amount;
        user.balance    += net;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`💰 *KAS DITARIK*\nNominal: Rp ${fmt(amount)}\nPajak penarikan 10%: -Rp ${fmt(pajak_tarik)}\nDiterima: +Rp ${fmt(net)}`);
    }

    if (command === 'korupsi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        let amount = args[0] === 'all' ? nation.treasury : parseInt(args[0]);
        if (isNaN(amount) || amount < 1000) return msg.reply('❌ Nominal tidak valid.');
        if (nation.treasury < amount) return msg.reply('❌ Kas kosong.');

        nation.treasury -= amount;
        user.balance    += amount;
        const drop = Math.floor(Math.random() * 20) + 5;
        nation.stability = Math.max(0, nation.stability - drop);

        let txt = `😈 *KORUPSI BERHASIL*\nRp ${fmt(amount)} masuk kantong pribadi.\n📉 Stabilitas: -${drop}% → ${nation.stability}%\n⚠️ Rakyat mulai tidak percaya!`;

        if (nation.stability <= 0) {
            delete db.nations[senderId];
            txt += '\n\n🔥 *REVOLUSI RAKYAT!* Rakyat menggulingkanmu! Negaramu HANCUR!';
        } else {
            db.nations[senderId] = nation;
        }
        saveDB(db);
        return msg.reply(txt);
    }

    // ════════════════════════════════════════════════════════
    // 📣  PROPAGANDA
    // ════════════════════════════════════════════════════════
    if (command === 'propaganda') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const sisa = CFG.CD_PROPAGANDA - (now - (nation.lastPropaganda || 0));
        if (sisa > 0) return msg.reply(`⏳ Propaganda cooldown: ${jamStr(sisa)}.`);
        if (nation.treasury < CFG.BIAYA_PROPAGANDA) return msg.reply(`❌ Kas kurang Rp ${fmt(CFG.BIAYA_PROPAGANDA)}.`);

        nation.treasury      -= CFG.BIAYA_PROPAGANDA;
        const gain = Math.floor(Math.random() * 15) + 10;
        nation.stability      = Math.min(100, nation.stability + gain);
        nation.lastPropaganda = now;
        db.nations[senderId]  = nation;
        saveDB(db);

        return msg.reply(`📣 *KAMPANYE PROPAGANDA BERHASIL!*\nRakyat kembali percaya kepada pemerintah!\n📈 Stabilitas: +${gain}% → ${nation.stability}%`);
    }

    // ════════════════════════════════════════════════════════
    // 🚀  BANGUN RUDAL & BOM NUKLIR
    // ════════════════════════════════════════════════════════
    if (command === 'bangunrudal') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.buildings.silo) return msg.reply('❌ Bangun *Silo Rudal* dulu! (`!bangun silo`)');
        if (nation.rudal >= CFG.MAX_RUDAL) return msg.reply(`❌ Stok rudal penuh! Maksimal ${CFG.MAX_RUDAL} unit.`);
        const harga = 20_000_000_000;
        if (nation.treasury < harga) return msg.reply(`❌ Kas kurang Rp ${fmt(harga)}.`);

        nation.treasury -= harga;
        nation.rudal    = (nation.rudal || 0) + 1;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`🚀 *RUDAL DIPRODUKSI!*\nStok rudal: ${nation.rudal}/${CFG.MAX_RUDAL} unit\n_Gunakan \`!serangangudara\` untuk menembakkan rudal!_`);
    }

    if (command === 'bangunbom') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.buildings.nuklir) return msg.reply('❌ Bangun *Lab Nuklir* dulu! (`!bangun nuklir`)');
        if (!nation.buildings.silo)   return msg.reply('❌ Bangun *Silo Rudal* dulu! (`!bangun silo`)');
        if ((nation.bomNuklir||0) >= CFG.MAX_BOM_NUKLIR) return msg.reply(`❌ Maks ${CFG.MAX_BOM_NUKLIR} bom nuklir!`);
        const harga = 100_000_000_000;
        if (nation.treasury < harga) return msg.reply(`❌ Kas kurang Rp ${fmt(harga)}.`);

        nation.treasury  -= harga;
        nation.bomNuklir  = (nation.bomNuklir || 0) + 1;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`☢️ *BOM NUKLIR SELESAI DIPRODUKSI!*\nStok bom nuklir: ${nation.bomNuklir}/${CFG.MAX_BOM_NUKLIR}\n⚠️ _Gunakan dengan bijak. Ini senjata pemusnah massal!_`);
    }

    // ════════════════════════════════════════════════════════
    // 🛡️  PERISAI
    // ════════════════════════════════════════════════════════
    if (command === 'perisai') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (nation.perisai > now) return msg.reply(`🛡️ Perisai masih aktif s/d ${new Date(nation.perisai).toLocaleTimeString('id-ID')}.`);
        if (nation.treasury < CFG.BIAYA_PERISAI) return msg.reply(`❌ Kas kurang Rp ${fmt(CFG.BIAYA_PERISAI)}.`);

        nation.treasury -= CFG.BIAYA_PERISAI;
        nation.perisai   = now + CFG.PERISAI_DURASI;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`🛡️ *PERISAI DIAKTIFKAN!*\nKebal dari:\n• Serangan militer\n• Sabotase & teror\n• Blokade\n\nAktif 2 jam s/d ${new Date(nation.perisai).toLocaleTimeString('id-ID')}.`);
    }

    // ════════════════════════════════════════════════════════
    // ⚔️  SERANG (DARAT)
    // ════════════════════════════════════════════════════════
    if (command === 'serang' || command === 'war') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const sisTunggu = CFG.CD_SERANG - (now - (nation.lastAttack || 0));
        if (sisTunggu > 0) return msg.reply(`⏳ Cooldown perang: ${jamStr(sisTunggu)}.`);

        const targetId = getMentionTarget(msg, args);
        if (!targetId) return msg.reply('❌ Tag target! `!serang @user`');
        if (targetId === senderId) return msg.reply('❌ Tidak bisa serang diri sendiri!');

        const musuh = sanitize(db.nations[targetId]);
        if (!musuh) return msg.reply('❌ Target tidak punya negara.');
        if (musuh.perisai > now) return msg.reply(`🛡️ *DITANGKIS!* ${musuh.name} dilindungi perisai aktif!`);
        if (nation.aliansi.includes(targetId)) return msg.reply(`🤝 *${musuh.name}* adalah SEKUTUMU! Putuskan aliansi dulu: \`!bubaraliansi @user\``);

        // Gencatan senjata aktif?
        if (nation.gencatan?.includes(targetId) && musuh.gencatan?.includes(senderId)) {
            return msg.reply(`🕊️ Kamu dalam *gencatan senjata* dengan *${musuh.name}*!\nBatalkan dulu: \`!bubaraliansi @user\` atau tunggu habis masa berlaku.`);
        }

        // Kalkulasi kekuatan
        const risetDroneAtk  = nation.riset?.drone_serang ? 0.8 : 1;
        const myRudalBonus   = nation.rudal > 0 ? (nation.buildings.nuklir ? 1.5 : 1.2) : 1;
        const myPower        = (nation.defense * (1 + (nation.buildings.benteng||0)*0.25 + (nation.buildings.dermaga||0)*0.10)) * (0.85 + Math.random()*0.3) * myRudalBonus;

        const enPenjinaRadar = 1 - ((musuh.buildings.radar||0) * 0.05);
        const enDefBonus     = 1 + (musuh.buildings.benteng||0)*0.25 + (musuh.riset?.armor_baja ? 0.15 : 0);
        const alBoost        = (musuh.aliansi||[]).reduce((s, id) => s + hitungPower(db.nations[id]) * 0.2, 0);
        const enPower        = (musuh.defense * enDefBonus * enPenjinaRadar) * (0.85 + Math.random()*0.3) + alBoost;

        nation.lastAttack   = now;
        nation.totalPerang  = (nation.totalPerang||0) + 1;
        musuh.totalPerang   = (musuh.totalPerang||0) + 1;

        // Pakai rudal
        const pakaRudal = nation.rudal > 0;
        if (pakaRudal) nation.rudal -= 1;

        let txt = `⚔️ *LAPORAN PERANG DARAT* ⚔️\n`;
        txt += `🚩 *${nation.name}* vs 🏴 *${musuh.name}*\n`;
        txt += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        if (pakaRudal) txt += `🚀 Rudal dilancarkan!\n`;

        if (myPower > enPower) {
            const jarahan      = Math.floor(musuh.treasury * (0.30 + Math.random()*0.20));
            const korban       = Math.floor(musuh.population * (0.05 + Math.random()*0.10));
            const myLoss       = Math.floor(nation.defense * (0.05 + Math.random()*0.10) * risetDroneAtk);
            const enLoss       = Math.floor(musuh.defense * (0.25 + Math.random()*0.20));
            const stabLoss     = Math.floor(15 + Math.random()*20);

            nation.treasury   += jarahan;
            nation.defense    -= myLoss;
            nation.totalMenang = (nation.totalMenang||0) + 1;
            musuh.treasury    -= jarahan;
            musuh.population  -= korban;
            musuh.defense     -= enLoss;
            musuh.stability    = Math.max(0, musuh.stability - stabLoss);
            musuh.totalKalah   = (musuh.totalKalah||0) + 1;

            // Kemungkinan hancurkan bangunan
            let bHancur = '';
            const bList = Object.keys(musuh.buildings).filter(k => (musuh.buildings[k]||0) > 0);
            if (bList.length && Math.random() < 0.35) {
                const tgt = bList[Math.floor(Math.random()*bList.length)];
                musuh.buildings[tgt] = Math.max(0, musuh.buildings[tgt]-1);
                bHancur = `\n💣 ${CFG.BANGUNAN[tgt]?.nama || tgt} musuh rusak!`;
            }

            txt += `\n🏆 *KEMENANGAN!*\n`;
            txt += `💰 Jarahan: +Rp ${fmt(jarahan)}\n`;
            txt += `💀 Korban sipil musuh: ${fmt(korban)} jiwa\n`;
            txt += `📉 Tentara musuh gugur: ${fmt(enLoss)}\n`;
            txt += `📉 Tentaramu gugur: ${fmt(myLoss)}${bHancur}\n`;
            txt += `📊 Stabilitas musuh: -${stabLoss}%`;
            if (alBoost > 0) txt += `\n🤝 Musuh dibantu sekutu (+${fmt(Math.floor(alBoost))} power)`;

            await sendDM(targetId,
                `🚨 *NEGARAMU DISERANG!*\n\n` +
                `*${nation.name}* menyerbu *${musuh.name}*!\n` +
                `💸 Jarahan: -Rp ${fmt(jarahan)}\n` +
                `💀 Korban sipil: ${fmt(korban)}\n` +
                `⚔️ Tentara gugur: ${fmt(enLoss)}\n` +
                `📊 Stabilitas: ${musuh.stability}%\n\n` +
                `_Segera perkuat pertahananmu! Gunakan \`!perisai\` untuk perlindungan._`
            );
        } else {
            const rugi         = Math.floor(nation.treasury * (0.05 + Math.random()*0.08));
            const myLoss       = Math.floor(nation.defense * (0.25 + Math.random()*0.20) * risetDroneAtk);
            const enLoss       = Math.floor(musuh.defense * (0.05 + Math.random()*0.05));
            nation.treasury   -= rugi;
            nation.defense    -= myLoss;
            musuh.defense     -= enLoss;
            nation.stability   = Math.max(0, nation.stability - 10);
            nation.totalKalah  = (nation.totalKalah||0) + 1;
            musuh.totalMenang  = (musuh.totalMenang||0) + 1;

            txt += `\n🏳️ *SERANGAN GAGAL!*\n`;
            txt += `Pertahanan *${musuh.name}* terlalu kuat!\n`;
            txt += `💸 Rugi Logistik: -Rp ${fmt(rugi)}\n`;
            txt += `📉 Tentaramu gugur: ${fmt(myLoss)}`;
            if (alBoost > 0) txt += `\n🤝 Musuh dibantu sekutu! (+${fmt(Math.floor(alBoost))} power)`;
        }

        // Clamp ke 0
        const clamp = (obj) => ['treasury','population','defense','stability'].forEach(k => { if ((obj[k]||0) < 0) obj[k] = 0; });
        clamp(nation); clamp(musuh);

        // Simpan war log
        if (!nation.warLog) nation.warLog = [];
        nation.warLog.push({ vs: musuh.name, time: now, result: myPower > enPower ? 'MENANG' : 'KALAH' });
        if (nation.warLog.length > 10) nation.warLog = nation.warLog.slice(-10);

        db.nations[senderId] = nation;
        db.nations[targetId] = musuh;
        saveDB(db);

        return msg.reply(txt, null, { mentions: [targetId] });
    }

    // ════════════════════════════════════════════════════════
    // ✈️  SERANGAN UDARA (RUDAL / BOM NUKLIR)
    // ════════════════════════════════════════════════════════
    if (command === 'serangangudara') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.buildings.silo) return msg.reply('❌ Butuh Silo Rudal! (`!bangun silo`)');

        const useNuklir = args.includes('nuklir') || args.includes('bom');
        if (useNuklir && !nation.bomNuklir) return msg.reply('❌ Tidak punya bom nuklir! (`!bangunbom`)');
        if (!useNuklir && !nation.rudal) return msg.reply('❌ Tidak punya rudal! (`!bangunrudal`)');

        const sisTunggu = CFG.CD_SERANG - (now - (nation.lastAttack || 0));
        if (sisTunggu > 0) return msg.reply(`⏳ Cooldown serangan: ${jamStr(sisTunggu)}.`);

        const targetId = getMentionTarget(msg, args.filter(a => !['nuklir','bom'].includes(a)));
        if (!targetId) return msg.reply('❌ Tag target! `!serangangudara @user` atau `!serangangudara @user nuklir`');

        const musuh = sanitize(db.nations[targetId]);
        if (!musuh) return msg.reply('❌ Target tidak punya negara.');

        // Radar musuh tangkis rudal
        const radarChance = (musuh.buildings.radar || 0) * 0.15;
        const ditangkis   = !useNuklir && Math.random() < radarChance;
        if (musuh.perisai > now) return msg.reply(`🛡️ Perisai musuh menangkis serangan udara!`);

        nation.lastAttack = now;
        if (useNuklir) nation.bomNuklir -= 1;
        else           nation.rudal     -= 1;

        if (ditangkis) {
            db.nations[senderId] = nation;
            saveDB(db);
            return msg.reply(
                `📡 *RUDAL DITANGKIS!*\n` +
                `Radar *${musuh.name}* berhasil menangkis rudalmu!\n` +
                `1 rudal hangus tanpa efek.\n\n` +
                `💡 _Tingkatkan rudal atau gunakan bom nuklir untuk bypass radar!_`
            );
        }

        const dmgMultiplier = useNuklir ? 3.0 : (nation.riset?.rudal_pintar ? 1.45 : 1.2);
        const jarahan       = Math.floor(musuh.treasury * (0.15 + Math.random()*0.15) * dmgMultiplier);
        const enLoss        = Math.floor(musuh.defense * (0.20 + Math.random()*0.20) * dmgMultiplier);
        const stabLoss      = Math.floor(20 + Math.random()*30);
        let   bHancur       = '';

        musuh.treasury  -= jarahan;
        musuh.defense   -= enLoss;
        musuh.stability  = Math.max(0, musuh.stability - stabLoss);

        // Hancurkan bangunan acak (50% chance, nuklir 80%)
        const bList = Object.keys(musuh.buildings).filter(k => (musuh.buildings[k]||0) > 0);
        if (bList.length && Math.random() < (useNuklir ? 0.80 : 0.50)) {
            const tgt = bList[Math.floor(Math.random()*bList.length)];
            const hancurLv = useNuklir ? Math.min(2, musuh.buildings[tgt]) : 1;
            musuh.buildings[tgt] = Math.max(0, musuh.buildings[tgt] - hancurLv);
            bHancur = `\n💣 ${CFG.BANGUNAN[tgt]?.nama || tgt} -${hancurLv} level!`;
        }

        const clamp = (obj) => ['treasury','population','defense','stability'].forEach(k => { if ((obj[k]||0) < 0) obj[k] = 0; });
        clamp(musuh);

        db.nations[senderId] = nation;
        db.nations[targetId] = musuh;
        saveDB(db);

        const tipeSerangan = useNuklir ? '☢️ *BOM NUKLIR DIJATUHKAN!* ☢️' : '✈️ *SERANGAN UDARA!*';
        await sendDM(targetId,
            `🚨 *SERANGAN UDARA!*\n\n` +
            `${useNuklir ? '☢️ BOM NUKLIR dijatuhkan di' : '🚀 Rudal menghantam'} *${musuh.name}*!\n` +
            `💸 Jarahan: -Rp ${fmt(jarahan)}\n` +
            `⚔️ Tentara gugur: ${fmt(enLoss)}\n` +
            `📊 Stabilitas: -${stabLoss}%${bHancur}`
        );

        return msg.reply(
            `${tipeSerangan}\n\n` +
            `🎯 Target: *${musuh.name}*\n\n` +
            `💰 Jarahan: +Rp ${fmt(jarahan)}\n` +
            `📉 Tentara musuh gugur: ${fmt(enLoss)}\n` +
            `📊 Stabilitas musuh: -${stabLoss}%${bHancur}`,
            null, { mentions: [targetId] }
        );
    }

    // ════════════════════════════════════════════════════════
    // ⛔  BLOKADE EKONOMI
    // ════════════════════════════════════════════════════════
    if (command === 'blokade') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.buildings.dermaga) return msg.reply('❌ Butuh Dermaga Militer! (`!bangun dermaga`)');
        const sisTunggu = CFG.CD_BLOKADE - (now - (nation.lastBlokade || 0));
        if (sisTunggu > 0) return msg.reply(`⏳ Blokade cooldown: ${jamStr(sisTunggu)}.`);
        if (nation.treasury < CFG.BIAYA_BLOKADE) return msg.reply(`❌ Kas kurang Rp ${fmt(CFG.BIAYA_BLOKADE)}.`);

        const targetId = getMentionTarget(msg, args);
        if (!targetId) return msg.reply('❌ Tag target! `!blokade @user`');

        const musuh = sanitize(db.nations[targetId]);
        if (!musuh) return msg.reply('❌ Target tidak punya negara.');
        if (musuh.perisai > now) return msg.reply('🛡️ Musuh dilindungi perisai! Blokade tidak efektif.');

        nation.treasury     -= CFG.BIAYA_BLOKADE;
        nation.lastBlokade   = now;
        musuh.diblokade      = now + CFG.BLOKADE_DURASI;
        musuh.stability      = Math.max(0, musuh.stability - 10);

        db.nations[senderId] = nation;
        db.nations[targetId] = musuh;
        saveDB(db);

        await sendDM(targetId,
            `⛔ *NEGARAMU DIBLOKADE!*\n\n` +
            `Jalur perdagangan *${musuh.name}* diblokade selama 4 jam!\n` +
            `📉 Pendapatan pajak -50%\n` +
            `📉 Stabilitas -10%\n\n` +
            `_Aktifkan \`!perisai\` untuk memutus blokade._`
        );

        return msg.reply(
            `⛔ *BLOKADE EKONOMI AKTIF!*\n` +
            `Target: *${musuh.name}*\n` +
            `Durasi: 4 jam\n` +
            `Efek: Pajak musuh -50%, Stabilitas -10%`,
            null, { mentions: [targetId] }
        );
    }

    // ════════════════════════════════════════════════════════
    // 🕊️  GENCATAN SENJATA
    // ════════════════════════════════════════════════════════
    if (command === 'gencatan') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (nation.treasury < CFG.BIAYA_GENCATAN) return msg.reply(`❌ Biaya gencatan: Rp ${fmt(CFG.BIAYA_GENCATAN)}.`);

        const targetId = getMentionTarget(msg, args);
        if (!targetId) return msg.reply('❌ Tag target! `!gencatan @user`');

        const musuh = sanitize(db.nations[targetId]);
        if (!musuh) return msg.reply('❌ Target tidak punya negara.');

        nation.treasury -= CFG.BIAYA_GENCATAN;
        if (!db.pending.gencatan) db.pending.gencatan = {};
        db.pending.gencatan[`${senderId}_${targetId}`] = { from: senderId, to: targetId, time: now };
        db.nations[senderId] = nation;
        saveDB(db);

        await sendDM(targetId,
            `🕊️ *TAWARAN GENCATAN SENJATA*\n\n` +
            `*${nation.name}* menawarkan gencatan senjata kepadamu.\n` +
            `Jika diterima, kalian tidak bisa saling menyerang 24 jam.\n\n` +
            `Balas di grup:\n` +
            `✅ \`!terimagencatan @${senderId.split('@')[0]}\`\n` +
            `❌ (Abaikan untuk menolak)`
        );

        return msg.reply(`🕊️ Tawaran gencatan dikirim ke *${musuh.name}*. Menunggu respons...`);
    }

    if (command === 'terimagencatan') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const fromId = getMentionTarget(msg, args);
        if (!fromId) return msg.reply('❌ Tag siapa yang menawarkan!');
        if (!db.pending.gencatan?.[`${fromId}_${senderId}`]) return msg.reply('❌ Tidak ada tawaran gencatan dari user itu.');

        const fromNation = sanitize(db.nations[fromId]);
        if (!nation.gencatan)     nation.gencatan     = [];
        if (!fromNation.gencatan) fromNation.gencatan = [];

        if (!nation.gencatan.includes(fromId))     nation.gencatan.push(fromId);
        if (!fromNation.gencatan.includes(senderId)) fromNation.gencatan.push(senderId);

        delete db.pending.gencatan[`${fromId}_${senderId}`];
        db.nations[senderId] = nation;
        db.nations[fromId]   = fromNation;
        saveDB(db);

        await sendDM(fromId, `🕊️ *${nation.name}* menerima gencatan senjata! Dilarang saling serang 24 jam.`);
        return msg.reply(`🕊️ *GENCATAN DITERIMA!*\n*${nation.name}* & *${fromNation.name}* kini dalam gencatan senjata 24 jam.`);
    }

    // ════════════════════════════════════════════════════════
    // 🤝  SISTEM ALIANSI
    // ════════════════════════════════════════════════════════
    if (command === 'aliansi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const targetId = getMentionTarget(msg, args);
        if (!targetId || targetId === senderId) return msg.reply('❌ Tag siapa yang mau diajak aliansi!');
        const tNation = db.nations[targetId];
        if (!tNation) return msg.reply('❌ Target tidak punya negara.');
        if (nation.aliansi.includes(targetId)) return msg.reply('❌ Sudah bersekutu.');
        if (nation.aliansi.length >= CFG.MAX_ALIANSI) return msg.reply(`❌ Maks ${CFG.MAX_ALIANSI} aliansi.`);

        db.pending.aliansi[`${senderId}_${targetId}`] = { from: senderId, to: targetId, time: now };
        db.nations[senderId] = nation;
        saveDB(db);

        await sendDM(targetId,
            `🤝 *TAWARAN ALIANSI!*\n\n` +
            `*${nation.name}* mengajak aliansi strategis!\n` +
            `Sekutu saling membantu saat diserang perang.\n\n` +
            `Balas di grup:\n` +
            `✅ \`!terimaliansi @${senderId.split('@')[0]}\`\n` +
            `❌ \`!tolaklansi @${senderId.split('@')[0]}\``
        );
        return msg.reply(`📬 Tawaran aliansi dikirim ke *${tNation.name}*. Menunggu konfirmasi...`);
    }

    if (command === 'terimaliansi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const fromId = getMentionTarget(msg, args);
        if (!fromId) return msg.reply('❌ Tag siapa yang mengajak!');
        if (!db.pending.aliansi?.[`${fromId}_${senderId}`]) return msg.reply('❌ Tidak ada tawaran dari user itu.');
        const fromNation = sanitize(db.nations[fromId]);
        if (!fromNation) return msg.reply('❌ Negara pengaju sudah tidak ada.');

        if (!nation.aliansi.includes(fromId))     nation.aliansi.push(fromId);
        if (!fromNation.aliansi.includes(senderId)) fromNation.aliansi.push(senderId);
        delete db.pending.aliansi[`${fromId}_${senderId}`];
        db.nations[senderId] = nation;
        db.nations[fromId]   = fromNation;
        saveDB(db);

        await sendDM(fromId, `🎉 *ALIANSI RESMI!*\n*${nation.name}* menerima aliansimu!\nKalian kini saling melindungi dalam perang!`);
        return msg.reply(`🤝 *ALIANSI TERBENTUK!*\n*${nation.name}* & *${fromNation.name}* kini bersekutu!\n_Sekutu menyumbang +20% kekuatan saat pertahanan._`);
    }

    if (command === 'tolaklansi') {
        const fromId = getMentionTarget(msg, args);
        if (fromId && db.pending.aliansi?.[`${fromId}_${senderId}`]) {
            delete db.pending.aliansi[`${fromId}_${senderId}`];
            saveDB(db);
            await sendDM(fromId, `❌ Tawaran aliansimu ditolak oleh *${nation?.name}*.`);
        }
        return msg.reply('❌ Tawaran aliansi ditolak.');
    }

    if (command === 'bubaraliansi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const targetId = getMentionTarget(msg, args);
        if (!targetId) return msg.reply('❌ Tag sekutu yang mau diputus!');
        const tNation = sanitize(db.nations[targetId]);
        nation.aliansi = nation.aliansi.filter(id => id !== targetId);
        if (tNation) tNation.aliansi = tNation.aliansi.filter(id => id !== senderId);
        db.nations[senderId] = nation;
        if (tNation) db.nations[targetId] = tNation;
        saveDB(db);
        if (tNation) await sendDM(targetId, `⚠️ *${nation.name}* memutuskan aliansi denganmu secara sepihak.`);
        return msg.reply(`✅ Aliansi dengan *${tNation?.name || '?'}* diputuskan.`);
    }

    if (command === 'listaliansi') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        if (!nation.aliansi.length) return msg.reply('😶 Kamu tidak punya sekutu saat ini.\nCari sekutu: `!aliansi @user`');
        let txt = `🤝 *DAFTAR SEKUTU AKTIF*\n\n`;
        nation.aliansi.forEach((id, i) => {
            const al = db.nations[id];
            txt += al ? `${i+1}. *${al.name}* — Power: ${fmt(hitungPower(al))} | 👥 ${fmt(al.population)} jiwa\n` : `${i+1}. @${id.split('@')[0]} (Negara sudah bubar)\n`;
        });
        return msg.reply(txt);
    }

    // ════════════════════════════════════════════════════════
    // 🌍  TOP NEGARA
    // ════════════════════════════════════════════════════════
    if (command === 'topnegara' || command === 'listnegara') {
        const list = Object.entries(db.nations)
            .map(([id, data]) => ({ id, ...sanitize(data), power: hitungPower(data) }))
            .sort((a, b) => b.power - a.power);

        let txt = `🌍 *PETA KEKUATAN DUNIA*\n`;
        txt += `📅 ${new Date(now).toLocaleTimeString('id-ID')} | ${list.length} negara terdaftar\n\n`;

        list.slice(0, 10).forEach((n, i) => {
            const medal  = ['🥇','🥈','🥉'][i] || `${i+1}.`;
            const isMe   = n.id === senderId ? ' 👈' : '';
            const shield = n.perisai > now ? '🛡️' : '';
            txt += `${medal} ${shield} *${n.name}*${isMe}\n`;
            txt += `   ⭐ ${fmt(n.power)} | 👥 ${fmt(n.population)} | 🏰 Lv.${n.buildings.benteng} | 🚀 ${n.rudal} rudal\n\n`;
        });
        txt += '💡 `!statsnegara @user` · `!serang @user` · `!aliansi @user`';

        return msg.reply(txt, null, { mentions: list.map(n => n.id) });
    }

    // ════════════════════════════════════════════════════════
    // 🔭  STATS NEGARA (publik, terbatas)
    // ════════════════════════════════════════════════════════
    if (command === 'statsnegara') {
        const targetId = getMentionTarget(msg, args);
        if (!targetId) return msg.reply('❌ Tag negaranya! `!statsnegara @user`');
        const target = sanitize(db.nations[targetId]);
        if (!target) return msg.reply('❌ Target tidak punya negara.');

        return msg.reply(
            `🔭 *INTEL PUBLIK: ${target.name.toUpperCase()}*\n\n` +
            `⭐ Power Rating: ${fmt(hitungPower(target))}\n` +
            `📊 Stabilitas: ${target.stability}% ${statusStab(target.stability)}\n` +
            `⚔️ Kekuatan: ${statusMiliter(target.defense)}\n` +
            `👥 Penduduk: ~${fmt(Math.round(target.population/1000)*1000)} jiwa\n` +
            `🛡️ Perisai: ${target.perisai > now ? '🔒 AKTIF' : '🔓 Tidak aktif'}\n` +
            `🤝 Sekutu: ${target.aliansi.length} negara\n\n` +
            `_Info detail & rahasia → \`!spionase\` via chat pribadi ke bot._`
        );
    }

    // ════════════════════════════════════════════════════════
    // ✏️  RENAME NEGARA
    // ════════════════════════════════════════════════════════
    if (command === 'renamekan') {
        if (!nation) return msg.reply('❌ Belum punya negara.');
        const biaya = 1_000_000_000;
        if (nation.treasury < biaya) return msg.reply(`❌ Biaya rename: Rp ${fmt(biaya)} dari kas.`);
        const nama = args.join(' ').trim();
        if (!nama || nama.length > 25) return msg.reply('❌ Nama tidak valid (maks 25 karakter).');
        if (Object.values(db.nations).some(n => n.name?.toLowerCase() === nama.toLowerCase())) return msg.reply('❌ Nama sudah dipakai!');

        const namaLama = nation.name;
        nation.treasury -= biaya;
        nation.name = nama;
        db.nations[senderId] = nation;
        saveDB(db);
        return msg.reply(`✅ Negara berhasil direname!\n*${namaLama}* → *${nama}*`);
    }

    // ════════════════════════════════════════════════════════
    // 🗑️  RESET
    // ════════════════════════════════════════════════════════
    if (command === 'resetmynation') {
        if (!db.nations[senderId]) return msg.reply('❌ Kamu tidak punya negara.');
        const nama = db.nations[senderId].name;
        delete db.nations[senderId];
        saveDB(db);
        return msg.reply(`✅ Negara *${nama}* telah dihapus. Buat ulang dengan \`!buatnegara\`.`);
    }
};


// ═══════════════════════════════════════════════════════════════
// 🔒  HANDLER SPIONASE — HANYA DI CHAT PRIBADI KE BOT
// ═══════════════════════════════════════════════════════════════
async function handleSpionase(command, args, msg, user, db, sock, senderId, sendDM, now) {
    if (!db.nations) db.nations = {};
    const fmt    = (n) => Math.floor(Number(n)||0).toLocaleString('id-ID');
    const jamStr = (ms) => ms <= 0 ? 'sekarang' : `${Math.ceil(ms/60000)} menit`;
    const reply  = (txt) => msg.reply(txt);

    const sanitizeLocal = (n) => {
        if (!n) return n;
        if (!n.buildings)  n.buildings  = {};
        if (!n.riset)      n.riset      = {};
        if (!n.aliansi)    n.aliansi    = [];
        if (!n.spyLog)     n.spyLog     = [];
        if (!n.agenAktif)  n.agenAktif  = {};
        Object.keys(CFG.BANGUNAN).forEach(k => { if (!n.buildings[k]) n.buildings[k] = 0; });
        ['stability','treasury','defense','population','rudal','bomNuklir','perisai','diblokade','lastSpy','totalPajak'].forEach(k => {
            if (typeof n[k] === 'undefined') n[k] = 0;
        });
        if (typeof n.stability === 'undefined') n.stability = 100;
        return n;
    };

    const nation = sanitizeLocal(db.nations[senderId]);

    // ─── LAPORAN MATA-MATA ───
    if (command === 'laporanmata') {
        if (!nation) return reply('❌ Kamu tidak punya negara.');
        if (!nation.spyLog?.length) return reply('📭 Belum ada laporan misi intelijen.');

        let txt = `🕵️ *LAPORAN INTELIJEN RAHASIA*\n`;
        txt += `_${nation.spyLog.length} misi tercatat (7 terakhir)_\n\n`;
        nation.spyLog.slice(-7).reverse().forEach((log, i) => {
            const icon = log.sukses ? '✅' : '❌';
            const misiNama = CFG.MISI_SPY[log.jenis]?.nama || log.jenis;
            txt += `${icon} *${i+1}. ${misiNama.toUpperCase()}*\n`;
            txt += `🎯 Target: ${log.targetName}\n`;
            txt += `📅 ${new Date(log.time).toLocaleString('id-ID')}\n`;
            txt += `📊 ${log.hasil}\n\n`;
        });
        txt += '_Laporan ini bersifat rahasia. Hanya kamu yang bisa melihatnya._';
        return reply(txt);
    }

    // ─── IDENTITAS AGEN ───
    if (command === 'identitasagen') {
        if (!nation) return reply('❌ Kamu tidak punya negara.');
        const totalMisi    = nation.spyLog?.length || 0;
        const totalSukses  = nation.spyLog?.filter(l => l.sukses).length || 0;
        const rate = totalMisi > 0 ? Math.round((totalSukses/totalMisi)*100) : 0;

        return reply(
            `🕵️ *PROFIL INTELIJEN RAHASIA*\n\n` +
            `👤 Presiden: ${msg.pushName}\n` +
            `🏛️ Negara: ${nation.name || '(belum punya)'}\n` +
            `🕵️ Markas Intel: Lv.${nation.buildings.intel || 0}\n\n` +
            `📊 *STATISTIK OPERASI*\n` +
            `• Total Misi: ${totalMisi}\n` +
            `• Berhasil: ${totalSukses}\n` +
            `• Tingkat Sukses: ${rate}%\n\n` +
            `🔐 _File ini terenkripsi. Hanya bisa dibaca di saluran aman (DM bot)._`
        );
    }

    // ─── TARIK AGEN ───
    if (command === 'tarikagen') {
        if (!nation) return reply('❌ Kamu tidak punya negara.');
        nation.agenAktif = {};
        db.nations[senderId] = nation;
        saveDB(db);
        return reply('✅ Semua agen berhasil ditarik dari lapangan. Operasi dihentikan.');
    }

    // ─── Ambil target ───
    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || msg.mentionedIds || [];
    let targetId   = mentions[0];
    if (!targetId && args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num) targetId = num + '@s.whatsapp.net';
    }

    if (!targetId) return reply(`❌ Sebutkan target:\n\`!${command} @user\` atau \`!${command} 628xxxxx\``);
    if (targetId === senderId) return reply('❌ Tidak bisa operasi ke diri sendiri.');
    if (!nation) return reply('❌ Kamu tidak punya negara. Buat dengan `!buatnegara`.');
    if (!nation.buildings.intel) return reply(
        '❌ Butuh *Markas Intelijen*!\n' +
        'Ketik di grup: `!bangun intel`\n' +
        '(Biaya: Rp 15.000.000.000)'
    );

    const misi = CFG.MISI_SPY[command];
    if (!misi) return reply('❌ Misi tidak dikenal.');
    if (nation.buildings.intel < misi.intel_min) {
        return reply(`❌ Misi *${misi.nama}* butuh Markas Intelijen Level ${misi.intel_min}+.`);
    }

    const sisaCd = CFG.CD_SPY - (now - (nation.lastSpy || 0));
    if (sisaCd > 0) return reply(`⏳ Agen masih dalam operasi. Siap lagi dalam ${jamStr(sisaCd)}.`);
    if (nation.treasury < misi.biaya) return reply(`❌ Kas negara kurang Rp ${fmt(misi.biaya)} untuk operasi ini.`);

    const targetNation = sanitizeLocal(db.nations[targetId]);
    if (!targetNation) return reply('❌ Target tidak punya negara.');

    // Blokir sabotase/teror jika target punya perisai
    if (!['spionase','sadap'].includes(command) && targetNation.perisai > now) {
        return reply(`🛡️ *OPERASI DIBLOKIR!*\nTarget mengaktifkan perisai pelindung.\nCoba lagi setelah ${new Date(targetNation.perisai).toLocaleTimeString('id-ID')}.`);
    }

    // Counter-Intel: target tangkap agen
    const counterBase   = (targetNation.buildings.intel || 0) * 0.08 + (targetNation.buildings.penjara || 0) * 0.10;
    const tertangkap    = Math.random() < counterBase;

    nation.treasury -= misi.biaya;
    nation.lastSpy   = now;

    if (tertangkap) {
        const denda = Math.floor(nation.treasury * 0.05);
        nation.treasury = Math.max(0, nation.treasury - denda);
        db.nations[senderId] = nation;
        saveDB(db);
        await sendDM(targetId,
            `🚨 *PERINGATAN INTELIJEN!*\n\n` +
            `Sistem keamanan *${targetNation.name}* mendeteksi penyusup!\n` +
            `Agen asing berhasil ditangkap & dieksekusi.\n` +
            `_(Identitas & asal negara penyerang tidak diketahui)_`
        );
        return reply(
            `❌ *OPERASI GAGAL — AGEN TERTANGKAP!*\n\n` +
            `Sistem kontra-intelijen target aktif.\n` +
            `Agenmu ditangkap & dieksekusi.\n` +
            `💸 Denda: -Rp ${fmt(denda)}\n\n` +
            `_Target hanya tahu ada penyusup, bukan identitasmu._`
        );
    }

    // Bonus riset
    let suksesRate = misi.sukses;
    if (nation.riset?.agen_elite) suksesRate = Math.min(0.95, suksesRate + 0.15);

    const sukses = Math.random() < suksesRate;
    let logHasil = '';
    let replyTxt = '';

    // ── SPIONASE ──
    if (command === 'spionase') {
        if (sukses) {
            logHasil =
                `Kas: Rp ${fmt(targetNation.treasury)} | ` +
                `Tentara: ${fmt(targetNation.defense)} | ` +
                `Stabilitas: ${targetNation.stability}% | ` +
                `Rudal: ${targetNation.rudal} | Bom: ${targetNation.bomNuklir}`;

            const risetTarget = Object.keys(targetNation.riset||{}).filter(k=>targetNation.riset[k]).map(k=>CFG.RISET[k]?.nama||k).join(', ') || 'Tidak ada';
            const aliansiTarget = (targetNation.aliansi||[]).map(id=>db.nations[id]?.name||'?').join(', ') || 'Tidak ada';

            replyTxt =
                `🕵️ *LAPORAN INTELIJEN LENGKAP*\n` +
                `🎯 Target: *${targetNation.name}*\n\n` +
                `💰 Kas Negara: Rp ${fmt(targetNation.treasury)}\n` +
                `⚔️ Jumlah Tentara: ${fmt(targetNation.defense)}\n` +
                `🏰 Benteng: Lv.${targetNation.buildings.benteng}\n` +
                `🏦 Bank: Lv.${targetNation.buildings.bank}\n` +
                `🕵️ Intel: Lv.${targetNation.buildings.intel}\n` +
                `📡 Radar: Lv.${targetNation.buildings.radar}\n` +
                `🚀 Rudal: ${targetNation.rudal} unit\n` +
                `☢️ Bom Nuklir: ${targetNation.bomNuklir} unit\n` +
                `📊 Stabilitas: ${targetNation.stability}%\n` +
                `🛡️ Perisai: ${targetNation.perisai > now ? `🔒 Aktif s/d ${new Date(targetNation.perisai).toLocaleTimeString('id-ID')}` : '🔓 Tidak aktif'}\n` +
                `🔬 Teknologi: ${risetTarget}\n` +
                `🤝 Sekutu: ${aliansiTarget}\n\n` +
                `_Data ini RAHASIA. Gunakan untuk rencanakan serangan!_`;
        } else {
            logHasil = 'Gagal menembus keamanan target.';
            replyTxt = `❌ *SPIONASE GAGAL*\nAgen tidak berhasil masuk sistem. Biaya hangus.`;
        }
    }

    // ── SADAP ──
    else if (command === 'sadap') {
        if (sukses) {
            const sekutuTarget = (targetNation.aliansi||[]).map(id => {
                const n = db.nations[id];
                return n ? `${n.name} (Power: ${fmt(hitungPower(n))})` : '?';
            }).join('\n  ') || 'Tidak punya sekutu';
            const lastAttack = targetNation.lastAttack > 0 ? new Date(targetNation.lastAttack).toLocaleString('id-ID') : 'Belum pernah menyerang';
            logHasil = `Sadap sukses: Aliansi & rencana target terungkap.`;
            replyTxt =
                `📡 *HASIL PENYADAPAN*\n` +
                `🎯 Target: *${targetNation.name}*\n\n` +
                `🤝 *JARINGAN ALIANSI:*\n  ${sekutuTarget}\n\n` +
                `⚔️ *AKTIVITAS MILITER:*\n` +
                `• Serangan terakhir: ${lastAttack}\n` +
                `• Total perang: ${targetNation.totalPerang || 0}\n` +
                `• Winrate: ${targetNation.totalPerang > 0 ? Math.round((targetNation.totalMenang||0)/targetNation.totalPerang*100) : 0}%\n\n` +
                `🏗️ *PEMBANGUNAN AKTIF:*\n` +
                `• ${Object.entries(targetNation.buildings).filter(([,v])=>v>0).map(([k,v])=>`${CFG.BANGUNAN[k]?.nama||k} Lv.${v}`).join('\n• ') || 'Tidak ada'}\n\n` +
                `_Informasi ini bersifat sangat rahasia._`;
        } else {
            logHasil = 'Penyadapan gagal, sinyal terdeteksi.';
            replyTxt = `❌ *SADAP GAGAL*\nSinyal penyadapan terdeteksi sistem target.`;
        }
    }

    // ── SABOTASE ──
    else if (command === 'sabotase') {
        if (sukses) {
            const bList = Object.keys(targetNation.buildings).filter(k => (targetNation.buildings[k]||0) > 0);
            if (!bList.length) {
                logHasil = 'Tidak ada bangunan untuk disabotase.';
                replyTxt = '❌ Target tidak punya bangunan apapun. Operasi sia-sia.';
            } else {
                const tgt = bList[Math.floor(Math.random()*bList.length)];
                targetNation.buildings[tgt] = Math.max(0, targetNation.buildings[tgt] - 1);
                db.nations[targetId] = targetNation;
                logHasil = `${CFG.BANGUNAN[tgt]?.nama||tgt} turun 1 level.`;
                replyTxt =
                    `💣 *SABOTASE BERHASIL!*\n\n` +
                    `Agen menghancurkan *${CFG.BANGUNAN[tgt]?.nama||tgt}*\n` +
                    `di negara *${targetNation.name}*!\n` +
                    `📉 Level turun 1\n\n` +
                    `_Target merasakan kerugian tanpa tahu penyebabnya._`;
                await sendDM(targetId, `⚠️ *INSIDEN INFRASTRUKTUR!*\n*${CFG.BANGUNAN[tgt]?.nama||tgt}* mengalami kerusakan misterius di *${targetNation.name}*!\nLevel turun 1. Kemungkinan ada sabotase...`);
            }
        } else {
            logHasil = 'Sabotase gagal, agen mundur tanpa jejak.';
            replyTxt = `❌ *SABOTASE GAGAL*\nAgen mundur tanpa hasil.`;
        }
    }

    // ── TEROR ──
    else if (command === 'teror') {
        if (sukses) {
            const drop = Math.floor(Math.random()*25) + 10;
            targetNation.stability = Math.max(0, targetNation.stability - drop);
            db.nations[targetId]   = targetNation;
            logHasil = `Stabilitas turun ${drop}% → ${targetNation.stability}%.`;
            replyTxt =
                `💥 *OPERASI TEROR BERHASIL!*\n\n` +
                `Agen berhasil menyebar propaganda & kerusuhan di *${targetNation.name}*!\n` +
                `📉 Stabilitas: -${drop}% → ${targetNation.stability}%\n\n` +
                `_Target merasakan dampaknya tanpa tahu siapa di baliknya._`;
            await sendDM(targetId, `🔥 *KERUSUHAN DALAM NEGERI!*\nRakyat *${targetNation.name}* bergejolak tanpa sebab yang jelas!\n📉 Stabilitas turun drastis!\n_Gunakan \`!propaganda\` untuk menenangkan rakyat._`);
        } else {
            logHasil = 'Propaganda tidak mempan pada rakyat target.';
            replyTxt = `❌ *OPERASI TEROR GAGAL*\nRakyat target tidak terpancing.`;
        }
    }

    // ── KUDETA ──
    else if (command === 'kudeta') {
        if (sukses) {
            const kehDef   = Math.floor(targetNation.defense * (0.20 + Math.random()*0.15));
            const kehKas   = Math.floor(targetNation.treasury * (0.15 + Math.random()*0.15));
            const stabDrop = Math.floor(Math.random()*35) + 20;

            targetNation.defense   = Math.max(0, targetNation.defense - kehDef);
            targetNation.treasury  = Math.max(0, targetNation.treasury - kehKas);
            targetNation.stability = Math.max(0, targetNation.stability - stabDrop);
            db.nations[targetId]   = targetNation;

            logHasil = `Kudeta sukses. Def -${fmt(kehDef)}, Kas -Rp ${fmt(kehKas)}, Stab -${stabDrop}%.`;
            replyTxt =
                `👑 *KUDETA BERHASIL!*\n\n` +
                `Agen menghasut jenderal-jenderal kunci di *${targetNation.name}*!\n` +
                `⚔️ Tentara membelot: -${fmt(kehDef)} personil\n` +
                `💸 Kas dijarah: -Rp ${fmt(kehKas)}\n` +
                `📉 Stabilitas: -${stabDrop}% → ${targetNation.stability}%\n\n` +
                `_Tidak ada jejak yang mengarah kepadamu._`;

            await sendDM(targetId,
                `🔥 *KUDETA!*\n\n` +
                `Sebagian besar jenderal *${targetNation.name}* memberontak!\n` +
                `Istana kepresidenan dalam kekacauan!\n` +
                `💰 Perbendaharaan negara dijarah!\n\n` +
                `_Ini bisa jadi serangan terorganisir dari luar..._`
            );

            if (targetNation.stability <= 0) {
                await sendDM(targetId, `🏴 *NEGARAMU RUNTUH!*\nKudeta berhasil menggulingkan *${targetNation.name}*!\nBuat negara baru dengan \`!buatnegara\`.`);
                delete db.nations[targetId];
            }
        } else {
            logHasil = 'Rencana kudeta bocor, agen kabur.';
            replyTxt = `❌ *KUDETA GAGAL*\nPasukan setia berhasil memadamkan pemberontakan. Agen kabur.`;
        }
    }

    // ── RACUN ──
    else if (command === 'racun') {
        if (sukses) {
            const racunMultiplier = nation.riset?.bioweapon ? 2.0 : 1.0;
            const kehDef = Math.floor(targetNation.defense * (0.10 + Math.random()*0.10) * racunMultiplier);
            targetNation.defense = Math.max(0, targetNation.defense - kehDef);
            db.nations[targetId] = targetNation;
            logHasil = `Racun membunuh ${fmt(kehDef)} tentara musuh.`;
            replyTxt =
                `☠️ *OPERASI RACUN BERHASIL!*\n\n` +
                `Agen menyebarkan racun di kamp militer *${targetNation.name}*!\n` +
                `💀 Tentara yang tewas: ${fmt(kehDef)} personil\n\n` +
                `_Kematian massal dianggap wabah penyakit biasa._`;
            await sendDM(targetId, `☠️ *WABAH DI BARAK MILITER!*\nSejumlah besar tentara *${targetNation.name}* tiba-tiba sakit & meninggal!\n💀 Korban: ${fmt(kehDef)} personil\n_Penyebab masih diselidiki..._`);
        } else {
            logHasil = 'Operasi racun gagal, antidot ditemukan target.';
            replyTxt = `❌ *OPERASI RACUN GAGAL*\nTarget punya sistem deteksi bio-ancaman.`;
        }
    }

    // ── SUAP JENDERAL ──
    else if (command === 'suap') {
        if (sukses) {
            // Jenderal yang disuap menyeberang dengan membawa sedikit tentara
            const jenderal = Math.floor(targetNation.defense * (0.05 + Math.random()*0.08));
            targetNation.defense = Math.max(0, targetNation.defense - jenderal);
            nation.defense = (nation.defense || 0) + Math.floor(jenderal * 0.5); // Sebagian ikut ke kita
            db.nations[targetId] = targetNation;
            logHasil = `${fmt(jenderal)} tentara musuh membelot. ${fmt(Math.floor(jenderal*0.5))} bergabung ke kita.`;
            replyTxt =
                `💰 *SUAP BERHASIL!*\n\n` +
                `Jenderal penting di *${targetNation.name}* berhasil disuap!\n` +
                `📉 Tentara musuh membelot: -${fmt(jenderal)}\n` +
                `📈 Bergabung ke negaramu: +${fmt(Math.floor(jenderal*0.5))} tentara\n\n` +
                `_Nama jenderal tidak akan terungkap._`;
            await sendDM(targetId, `⚠️ *DESERSI MASSAL!*\nSejumlah jenderal & tentara *${targetNation.name}* membelot tanpa alasan jelas!\nKemungkinan ada pengkhianat dalam tubuh militer...`);
        } else {
            logHasil = 'Suap ditolak, agen dalam bahaya.';
            replyTxt = `❌ *SUAP GAGAL*\nJenderal menolak & melaporkan ke atasan. Agen berhasil kabur.`;
        }
    }

    // ── CURI KAS ──
    else if (command === 'curi') {
        if (sukses) {
            const jumlahCuri = Math.floor(targetNation.treasury * (0.05 + Math.random()*0.08));
            targetNation.treasury = Math.max(0, targetNation.treasury - jumlahCuri);
            nation.treasury = (nation.treasury || 0) + jumlahCuri;
            db.nations[targetId] = targetNation;
            logHasil = `Mencuri Rp ${fmt(jumlahCuri)} dari kas musuh.`;
            replyTxt =
                `💸 *PENCURIAN KAS BERHASIL!*\n\n` +
                `Agen berhasil membobol perbendaharaan *${targetNation.name}*!\n` +
                `💰 Hasil: +Rp ${fmt(jumlahCuri)} ke kas negaramu!\n\n` +
                `_Catatan keuangan target akan terlihat normal selama beberapa saat._`;
            await sendDM(targetId, `⚠️ *ANOMALI KEUANGAN!*\nTim audit menemukan kejanggalan di perbendaharaan *${targetNation.name}*!\nSejumlah Rp ${fmt(jumlahCuri)} tidak dapat dipertanggungjawabkan.\n_Kemungkinan pencurian dari dalam atau luar..._`);
        } else {
            logHasil = 'Agen gagal menembus keamanan keuangan.';
            replyTxt = `❌ *PENCURIAN GAGAL*\nSistem keamanan bank negara target terlalu canggih.`;
        }
    }

    // Simpan log misi
    if (!nation.spyLog) nation.spyLog = [];
    nation.spyLog.push({
        jenis: command, targetName: targetNation.name,
        time: now, hasil: logHasil, sukses,
    });
    if (nation.spyLog.length > 20) nation.spyLog = nation.spyLog.slice(-20);

    db.nations[senderId] = nation;
    saveDB(db);

    return reply(replyTxt || '✅ Operasi selesai.');
}


