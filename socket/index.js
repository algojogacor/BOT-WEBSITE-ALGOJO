// ============================================================
//  socket/index.js — Socket.IO Handler untuk Live Chat
//  Room Chat & Direct Message secara real-time
// ============================================================

const { Server } = require('socket.io');
const jwt         = require('jsonwebtoken');
const db          = require('../config/database');
const { genId, sanitize } = require('../utils/helpers');
const { CHAT }    = require('../utils/constants');

module.exports = function initSocket(server) {
    const io = new Server(server, {
        cors: { origin: process.env.APP_URL || '*', credentials: true }
    });

    // ── Middleware Auth ──────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token) return next(new Error('Autentikasi diperlukan.'));
        try {
            const decoded    = jwt.verify(token, process.env.JWT_SECRET);
            socket.username  = decoded.username;
            socket.role      = decoded.role;
            next();
        } catch {
            next(new Error('Token tidak valid.'));
        }
    });

    // ── Connection ───────────────────────────────────────────
    io.on('connection', (socket) => {
        const { username, role } = socket;
        console.log(`🟢 Socket: ${username} terhubung (${socket.id})`);

        // Beri tahu user lain bahwa user ini online
        socket.broadcast.emit('user:online', { username });

        // ── JOIN ROOM ─────────────────────────────────────────
        socket.on('room:join', ({ roomId, password }) => {
            const rooms = db.getChatRooms();
            const room  = rooms[roomId];
            if (!room) return socket.emit('error', 'Room tidak ditemukan.');
            if (room.isPrivate && room.password !== password)
                return socket.emit('error', '🔒 Password salah.');

            socket.join(`room:${roomId}`);
            if (!room.members.includes(username)) {
                room.members.push(username);
                db.saveData();
            }

            // Kirim riwayat pesan ke user yang baru join
            socket.emit('room:history', { roomId, messages: (room.messages || []).slice(-50) });

            // Beritahu member lain
            io.to(`room:${roomId}`).emit('room:userJoined', { roomId, username });
        });

        // ── LEAVE ROOM ────────────────────────────────────────
        socket.on('room:leave', ({ roomId }) => {
            socket.leave(`room:${roomId}`);
            const rooms = db.getChatRooms();
            if (rooms[roomId]) {
                rooms[roomId].members = (rooms[roomId].members || []).filter(m => m !== username);
                db.saveData();
            }
            io.to(`room:${roomId}`).emit('room:userLeft', { roomId, username });
        });

        // ── ROOM MESSAGE ──────────────────────────────────────
        socket.on('room:message', async ({ roomId, message }) => {
            if (!message?.trim()) return;
            if (message.length > CHAT.MAX_MSG_LENGTH) return socket.emit('error', 'Pesan terlalu panjang.');

            const rooms = db.getChatRooms();
            const room  = rooms[roomId];
            if (!room) return socket.emit('error', 'Room tidak ditemukan.');
            if (!room.members.includes(username)) return socket.emit('error', 'Kamu belum join room ini.');

            const msg = {
                id:        genId(),
                from:      username,
                role,
                message:   sanitize(message.trim()),
                timestamp: Date.now(),
            };

            // Simpan pesan (maks MAX_MSG_PER_ROOM)
            if (!room.messages) room.messages = [];
            room.messages.push(msg);
            if (room.messages.length > CHAT.MAX_MSG_PER_ROOM) {
                room.messages = room.messages.slice(-CHAT.MAX_MSG_PER_ROOM);
            }
            await db.saveData();

            // Broadcast ke semua member room
            io.to(`room:${roomId}`).emit('room:newMessage', { roomId, msg });
        });

        // ── DIRECT MESSAGE ────────────────────────────────────
        socket.on('dm:send', async ({ target, message }) => {
            if (!message?.trim()) return;
            if (message.length > CHAT.MAX_MSG_LENGTH) return socket.emit('error', 'Pesan terlalu panjang.');

            const webUsers = db.getWebUsers();
            if (!webUsers[target]) return socket.emit('error', 'User tidak ditemukan.');

            const privateChats = db.getPrivateChats();
            const convId = [username, target].sort().join('::');
            if (!privateChats[convId]) privateChats[convId] = { messages: [] };

            const msg = {
                id:        genId(),
                from:      username,
                to:        target,
                message:   sanitize(message.trim()),
                timestamp: Date.now(),
            };

            privateChats[convId].messages.push(msg);
            if (privateChats[convId].messages.length > 200) {
                privateChats[convId].messages = privateChats[convId].messages.slice(-200);
            }
            await db.saveData();

            // Kirim ke pengirim & penerima (jika online)
            socket.emit('dm:message', msg);
            // Cari socket target yang online
            const targetSockets = [...io.sockets.sockets.values()].filter(s => s.username === target);
            targetSockets.forEach(s => s.emit('dm:message', msg));
        });

        // ── TYPING INDICATOR ──────────────────────────────────
        socket.on('room:typing', ({ roomId }) => {
            socket.to(`room:${roomId}`).emit('room:typing', { roomId, username });
        });
        socket.on('dm:typing', ({ target }) => {
            const targets = [...io.sockets.sockets.values()].filter(s => s.username === target);
            targets.forEach(s => s.emit('dm:typing', { from: username }));
        });

        // ── DISCONNECT ────────────────────────────────────────
        socket.on('disconnect', () => {
            console.log(`🔴 Socket: ${username} terputus`);
            socket.broadcast.emit('user:offline', { username });
        });
    });

    return io;
};
