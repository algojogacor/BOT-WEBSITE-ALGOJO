/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         ANALITIK BOT — Fitur 38                             ║
 * ║  !analitik         — Dashboard statistik bot (admin)        ║
 * ║  !topcmd           — Command paling sering dipakai          ║
 * ║  !topuser          — User paling aktif                      ║
 * ║  !statbot          — Ringkasan cepat status bot             ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 *  Tracking command usage otomatis disimpan di db.analytics
 *  Tambahkan trackCommand(command, sender, db) di index.js
 */

const { saveDB } = require('../helpers/database');

// ─── Track command usage (dipanggil dari index.js) ─────────────
function trackCommand(command, sender, db) {
    if (!command || !sender) return;
    if (!db.analytics) db.analytics = { commands: {}, users: {}, hourly: {}, daily: {}, startTime: Date.now() };

    const now = new Date();
    const jam = now.getHours();
    const hari = now.toISOString().split('T')[0];

    // Track per command
    db.analytics.commands[command] = (db.analytics.commands[command] || 0) + 1;

    // Track per user
    const userId = sender.replace('@s.whatsapp.net', '').substring(0, 12) + '...';
    if (!db.analytics.users[sender]) db.analytics.users[sender] = { count: 0, lastSeen: null };
    db.analytics.users[sender].count++;
    db.analytics.users[sender].lastSeen = now.toISOString();

    // Track jam aktif
    db.analytics.hourly[jam] = (db.analytics.hourly[jam] || 0) + 1;

    // Track hari
    if (!db.analytics.daily[hari]) db.analytics.daily[hari] = 0;
    db.analytics.daily[hari]++;

    // Total pesan
    db.analytics.totalMessages = (db.analytics.totalMessages || 0) + 1;
}

// ─── Render grafik jam aktif ──────────────────────────────────
function renderHourlyChart(hourly) {
    const max = Math.max(...Object.values(hourly), 1);
    let chart = '';
    for (let h = 0; h < 24; h += 2) {
        const val = (hourly[h] || 0) + (hourly[h + 1] || 0);
        const pct = val / max;
        const bars = Math.round(pct * 8);
        const label = `${String(h).padStart(2, '0')}-${String(h + 2).padStart(2, '0')}`;
        chart += `${label}: ${'█'.repeat(bars)}${'░'.repeat(8 - bars)} ${val}\n`;
    }
    return chart;
}

// ─── Render grafik 7 hari ─────────────────────────────────────
function renderDailyChart(daily) {
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];
        last7.push({ hari, val: daily[key] || 0 });
    }
    const max = Math.max(...last7.map(d => d.val), 1);
    return last7.map(d => {
        const bars = Math.round((d.val / max) * 6);
        return `${d.hari}: ${'▓'.repeat(bars)}${'░'.repeat(6 - bars)} ${d.val}`;
    }).join('\n');
}

// ─── Uptime formatter ────────────────────────────────────────
function formatUptime(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}h ${h % 24}j ${m % 60}m`;
    if (h > 0) return `${h}j ${m % 60}m`;
    return `${m}m ${s % 60}d`;
}

// ─── Admin checker (simpel) ───────────────────────────────────
const ADMIN_NUMBERS = (process.env.ADMIN_NUMBERS || '').split(',').map(n => n.trim()).filter(Boolean);

function isAdmin(sender) {
    if (ADMIN_NUMBERS.length === 0) return true; // Jika tidak ada konfigurasi, izinkan semua
    const num = sender.replace('@s.whatsapp.net', '').replace(/[^0-9]/g, '');
    return ADMIN_NUMBERS.some(a => a.replace(/[^0-9]/g, '') === num);
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['analitik', 'analytics', 'topcmd', 'topuser', 'statbot', 'resetanalitik'];
    if (!validCommands.includes(command)) return;

    const sender = msg.author || msg.from;
    const a = db.analytics || {};

    // ══════════════════════════════════════════════════════════
    // !statbot — Ringkasan cepat (semua user bisa akses)
    // ══════════════════════════════════════════════════════════
    if (command === 'statbot') {
        const totalUser = Object.keys(db.users || {}).length;
        const totalMsg = a.totalMessages || 0;
        const totalCmd = Object.values(a.commands || {}).reduce((s, v) => s + v, 0);
        const uptime = a.startTime ? formatUptime(Date.now() - a.startTime) : '-';
        const today = new Date().toISOString().split('T')[0];
        const msgHariIni = (a.daily || {})[today] || 0;

        // Top 3 command
        const topCmds = Object.entries(a.commands || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([c, v], i) => `${i + 1}. !${c} (${v}x)`)
            .join('\n');

        return msg.reply(
            `📊 *STATUS BOT*\n` +
            `${'─'.repeat(25)}\n\n` +
            `👥 Total Pengguna: *${totalUser}*\n` +
            `💬 Total Pesan: *${totalMsg.toLocaleString('id-ID')}*\n` +
            `⌨️ Command Dipakai: *${totalCmd.toLocaleString('id-ID')}*\n` +
            `📅 Pesan Hari Ini: *${msgHariIni}*\n` +
            `⏱️ Uptime: *${uptime}*\n\n` +
            `🏆 Top Command:\n${topCmds || 'Belum ada data'}\n\n` +
            `_Update: ${new Date().toLocaleString('id-ID')}_`
        );
    }

    // ══════════════════════════════════════════════════════════
    // !analitik — Dashboard lengkap (admin only)
    // ══════════════════════════════════════════════════════════
    if (['analitik', 'analytics'].includes(command)) {
        if (!isAdmin(sender)) {
            return msg.reply('❌ Fitur ini hanya untuk admin. Atur ADMIN_NUMBERS di .env');
        }

        if (!a.commands) {
            return msg.reply('📊 Belum ada data analitik. Bot perlu diintegrasikan dengan trackCommand(). Lihat README_INSTALL.md');
        }

        const totalUser = Object.keys(db.users || {}).length;
        const totalMsg = a.totalMessages || 0;
        const uptime = a.startTime ? formatUptime(Date.now() - a.startTime) : '-';

        // Top 10 commands
        const topCmds = Object.entries(a.commands)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        const maxCmd = topCmds[0]?.[1] || 1;

        let cmdChart = '';
        topCmds.forEach(([c, v], i) => {
            const bars = Math.round((v / maxCmd) * 10);
            cmdChart += `${String(i + 1).padStart(2)}. !${c.padEnd(15)} ${'▓'.repeat(bars)}${'░'.repeat(10 - bars)} ${v}x\n`;
        });

        // Top 5 users
        const topUsers = Object.entries(a.users || {})
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 5)
            .map(([id, u], i) => {
                const nama = db.users?.[id]?.name || id.replace('@s.whatsapp.net', '').substring(0, 10) + '...';
                return `${i + 1}. ${nama}: ${u.count} pesan`;
            })
            .join('\n');

        // Jam paling aktif
        const jamTersibuk = Object.entries(a.hourly || {})
            .sort((a, b) => b[1] - a[1])[0];
        const jamStr = jamTersibuk ? `Jam ${jamTersibuk[0]}:00 (${jamTersibuk[1]} pesan)` : '-';

        return msg.reply(
            `📊 *DASHBOARD ANALITIK BOT*\n` +
            `${'═'.repeat(30)}\n\n` +

            `📈 *RINGKASAN UMUM:*\n` +
            `👥 Total User: *${totalUser}*\n` +
            `💬 Total Pesan: *${totalMsg.toLocaleString('id-ID')}*\n` +
            `⏱️ Uptime: *${uptime}*\n` +
            `⏰ Jam Tersibuk: *${jamStr}*\n\n` +

            `${'─'.repeat(25)}\n` +
            `⌨️ *TOP 10 COMMAND:*\n` +
            `\`\`\`\n${cmdChart}\`\`\`\n\n` +

            `${'─'.repeat(25)}\n` +
            `👑 *TOP 5 USER AKTIF:*\n` +
            `${topUsers || 'Belum ada data'}\n\n` +

            `${'─'.repeat(25)}\n` +
            `📅 *AKTIVITAS 7 HARI:*\n` +
            `\`\`\`\n${renderDailyChart(a.daily || {})}\`\`\`\n\n` +

            `${'─'.repeat(25)}\n` +
            `🕐 *GRAFIK JAM AKTIF:*\n` +
            `\`\`\`\n${renderHourlyChart(a.hourly || {})}\`\`\`\n` +
            `_Update: ${new Date().toLocaleString('id-ID')}_`
        );
    }

    // ══════════════════════════════════════════════════════════
    // !topcmd — Top command
    // ══════════════════════════════════════════════════════════
    if (command === 'topcmd') {
        const topCmds = Object.entries(a.commands || {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15);

        if (topCmds.length === 0) return msg.reply('📊 Belum ada data command.');

        const medals = ['🥇', '🥈', '🥉'];
        let list = `⌨️ *TOP COMMAND*\n${'─'.repeat(25)}\n\n`;
        topCmds.forEach(([c, v], i) => {
            const m = medals[i] || `${i + 1}.`;
            list += `${m} \`!${c}\` — *${v.toLocaleString('id-ID')}x* dipakai\n`;
        });

        const total = Object.values(a.commands).reduce((s, v) => s + v, 0);
        list += `\n${'─'.repeat(20)}\n_Total: ${total.toLocaleString('id-ID')} penggunaan command_`;
        return msg.reply(list);
    }

    // ══════════════════════════════════════════════════════════
    // !topuser — Top user aktif
    // ══════════════════════════════════════════════════════════
    if (command === 'topuser') {
        const topUsers = Object.entries(a.users || {})
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);

        if (topUsers.length === 0) return msg.reply('📊 Belum ada data user.');

        const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
        let list = `👑 *TOP USER AKTIF*\n${'─'.repeat(25)}\n\n`;
        topUsers.forEach(([id, u], i) => {
            const nama = db.users?.[id]?.name || id.replace('@s.whatsapp.net', '').substring(0, 12) + '...';
            const lastSeen = u.lastSeen ? new Date(u.lastSeen).toLocaleDateString('id-ID') : '-';
            list += `${medals[i]} *${nama}*\n   💬 ${u.count.toLocaleString('id-ID')} pesan | Terakhir: ${lastSeen}\n\n`;
        });

        list += `${'─'.repeat(20)}\n_Posisimu: No. ${Object.entries(a.users || {}).sort((a, b) => b[1].count - a[1].count).findIndex(([id]) => id === sender) + 1 || '-'}_`;
        return msg.reply(list);
    }

    // !resetanalitik (admin only)
    if (command === 'resetanalitik') {
        if (!isAdmin(sender)) return msg.reply('❌ Hanya admin!');
        db.analytics = { commands: {}, users: {}, hourly: {}, daily: {}, startTime: Date.now(), totalMessages: 0 };
        saveDB(db);
        return msg.reply('✅ Data analitik berhasil di-reset!');
    }
};

// Export juga fungsi trackCommand untuk dipanggil dari index.js
module.exports.trackCommand = trackCommand;
