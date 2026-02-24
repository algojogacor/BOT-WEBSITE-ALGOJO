// ============================================================
//  controllers/chatController.js
//  Live Chat: 10 Room publik/private + DM antar user
// ============================================================

const db   = require('../config/database');
const { genId, sanitize } = require('../utils/helpers');
const { CHAT }            = require('../utils/constants');

// ─────────────────────────────────────────────────────────────
//  ROOM CHAT
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/chat/rooms — Daftar semua room
 */
async function getRooms(req, res) {
    const rooms = db.getChatRooms();
    const list  = Object.entries(rooms).map(([id, r]) => ({
        id,
        name:        r.name,
        isPrivate:   r.isPrivate,
        memberCount: (r.members || []).length,
        maxSlots:    10,
        createdBy:   r.createdBy,
        createdAt:   r.createdAt,
    }));
    res.json({ success: true, rooms: list, totalSlots: CHAT.MAX_ROOMS, usedSlots: list.length });
}

/**
 * POST /api/chat/rooms — Buat room baru
 * Body: { name, password? (opsional) }
 */
async function createRoom(req, res) {
    const { username } = req.user;
    const { name, password } = req.body;

    const rooms = db.getChatRooms();
    if (Object.keys(rooms).length >= CHAT.MAX_ROOMS)
        return res.status(400).json({ success: false, message: `❌ Slot room penuh (maks ${CHAT.MAX_ROOMS}).` });

    // Cek nama duplikat
    const duplicate = Object.values(rooms).find(r => r.name.toLowerCase() === name.toLowerCase());
    if (duplicate) return res.status(409).json({ success: false, message: '❌ Nama room sudah ada.' });

    const id = genId();
    rooms[id] = {
        id,
        name:      sanitize(name),
        isPrivate: !!password,
        password:  password || null,  // Simpan plain — room ini tidak sensitif
        members:   [username],
        messages:  [],
        createdBy: username,
        createdAt: Date.now(),
    };

    await db.saveData();
    res.status(201).json({ success: true, message: `✅ Room "${name}" dibuat.`, roomId: id });
}

/**
 * POST /api/chat/rooms/:id/join
 * Body: { password? }
 */
async function joinRoom(req, res) {
    const { username } = req.user;
    const { id }       = req.params;
    const { password } = req.body;
    const rooms        = db.getChatRooms();
    const room         = rooms[id];

    if (!room) return res.status(404).json({ success: false, message: 'Room tidak ditemukan.' });

    if (room.isPrivate && room.password !== password)
        return res.status(401).json({ success: false, message: '🔒 Password salah.' });

    if (!room.members.includes(username)) {
        room.members.push(username);
        await db.saveData();
    }

    // Ambil 50 pesan terakhir
    const recentMessages = (room.messages || []).slice(-50);
    res.json({ success: true, room: { id, name: room.name, isPrivate: room.isPrivate }, recentMessages });
}

/**
 * POST /api/chat/rooms/:id/leave
 */
async function leaveRoom(req, res) {
    const { username } = req.user;
    const { id }       = req.params;
    const rooms        = db.getChatRooms();
    const room         = rooms[id];

    if (!room) return res.status(404).json({ success: false, message: 'Room tidak ditemukan.' });

    room.members = (room.members || []).filter(m => m !== username);

    // Hapus room jika kosong dan bukan oleh sistem
    if (room.members.length === 0) {
        delete rooms[id];
        await db.saveData();
        return res.json({ success: true, message: '👋 Keluar dari room (room dihapus karena kosong).' });
    }

    await db.saveData();
    res.json({ success: true, message: `👋 Keluar dari room "${room.name}".` });
}

/**
 * DELETE /api/chat/rooms/:id — Admin/Developer/Creator bisa hapus
 */
async function deleteRoom(req, res) {
    const { username, role } = req.user;
    const { id }             = req.params;
    const rooms              = db.getChatRooms();
    const room               = rooms[id];

    if (!room) return res.status(404).json({ success: false, message: 'Room tidak ditemukan.' });

    const canDelete = ['admin', 'developer'].includes(role) || room.createdBy === username;
    if (!canDelete) return res.status(403).json({ success: false, message: '❌ Hanya creator atau admin yang bisa hapus room.' });

    delete rooms[id];
    await db.saveData();
    res.json({ success: true, message: `🗑️ Room "${room.name}" dihapus.` });
}

// ─────────────────────────────────────────────────────────────
//  PRIVATE / DIRECT MESSAGE
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/chat/dm/:target — Ambil riwayat DM
 */
async function getDM(req, res) {
    const { username }     = req.user;
    const { target }       = req.params;
    const privateChats     = db.getPrivateChats();

    // Konversasi ID selalu diurutkan agar konsisten (A-B atau B-A)
    const convId       = [username, target].sort().join('::');
    const conversation = privateChats[convId] || { messages: [] };
    const recent       = (conversation.messages || []).slice(-50);

    res.json({ success: true, messages: recent });
}

/**
 * POST /api/chat/dm/:target — Kirim DM (REST fallback; utamanya lewat Socket.IO)
 */
async function sendDM(req, res) {
    const { username }    = req.user;
    const { target }      = req.params;
    const { message }     = req.body;

    const webUsers = db.getWebUsers();
    if (!webUsers[target]) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

    const privateChats = db.getPrivateChats();
    const convId       = [username, target].sort().join('::');
    if (!privateChats[convId]) privateChats[convId] = { messages: [] };

    const msg = {
        id:        genId(),
        from:      username,
        message:   sanitize(message),
        timestamp: Date.now(),
    };
    privateChats[convId].messages.push(msg);

    // Simpan hanya 200 pesan terakhir per percakapan
    if (privateChats[convId].messages.length > 200) {
        privateChats[convId].messages = privateChats[convId].messages.slice(-200);
    }

    await db.saveData();
    res.json({ success: true, message: '✅ Pesan terkirim.', msg });
}

module.exports = { getRooms, createRoom, joinRoom, leaveRoom, deleteRoom, getDM, sendDM };
