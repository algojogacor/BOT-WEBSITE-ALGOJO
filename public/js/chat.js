// public/js/chat.js — Live Chat Logic (Socket.IO)

if (!requireLogin()) throw new Error('Not logged in');

const ME = getUser();
let socket = null;
let currentChat = null; // { type: 'room'|'dm', id, name }
let typingTimeout = null;

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (ME) {
        document.getElementById('sidebar-username').textContent = ME.username;
        document.getElementById('sidebar-role').textContent     = ME.role;
        document.getElementById('sidebar-avatar').textContent   = ME.username[0].toUpperCase();
    }
    connectSocket();
    loadRooms();
});

// ── Socket Connection ─────────────────────────────────────────
function connectSocket() {
    socket = io({ auth: { token: getToken() } });

    socket.on('connect', () => console.log('🟢 Socket terhubung'));
    socket.on('connect_error', (err) => toastError(`Socket error: ${err.message}`));

    // New message in room
    socket.on('room:newMessage', ({ roomId, msg }) => {
        if (currentChat?.type === 'room' && currentChat.id === roomId) {
            appendMessage(msg, msg.from === ME.username);
        }
    });

    // New DM
    socket.on('dm:message', (msg) => {
        const partnerId = msg.from === ME.username ? msg.to : msg.from;
        if (currentChat?.type === 'dm' && currentChat.id === partnerId) {
            appendMessage(msg, msg.from === ME.username);
        } else {
            toastInfo(`📩 DM dari ${msg.from}: ${msg.message.substring(0, 40)}`);
        }
    });

    // Typing
    socket.on('room:typing', ({ roomId, username }) => {
        if (currentChat?.type === 'room' && currentChat.id === roomId && username !== ME.username) {
            showTyping(`${username} sedang mengetik...`);
        }
    });
    socket.on('dm:typing', ({ from }) => {
        if (currentChat?.type === 'dm' && currentChat.id === from) {
            showTyping(`${from} sedang mengetik...`);
        }
    });

    socket.on('room:userJoined', ({ username }) => {
        if (username !== ME.username) appendSystemMessage(`👤 ${username} bergabung.`);
    });
    socket.on('room:userLeft', ({ username }) => {
        appendSystemMessage(`👋 ${username} keluar.`);
    });
}

// ── Load Rooms ────────────────────────────────────────────────
async function loadRooms() {
    const data = await api.get('/chat/rooms');
    if (!data?.success) return;

    const list = document.getElementById('room-list');
    document.getElementById('room-count').textContent = `${data.usedSlots}/${data.totalSlots} rooms`;

    list.innerHTML = data.rooms.map(r => `
        <div class="chat-item" onclick="openRoom('${r.id}', '${escapeHtml(r.name)}', ${r.isPrivate})">
            <div class="chat-item-avatar room">#</div>
            <div style="min-width:0;flex:1">
                <div class="chat-item-name">${escapeHtml(r.name)} ${r.isPrivate ? '🔒' : ''}</div>
                <div class="chat-item-preview">👥 ${r.memberCount} member</div>
            </div>
        </div>
    `).join('');

    if (data.rooms.length === 0) {
        list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Belum ada room. Buat yang pertama!</div>';
    }
}

// ── Open Room ─────────────────────────────────────────────────
async function openRoom(roomId, name, isPrivate) {
    if (isPrivate) {
        document.getElementById('join-room-id').value   = roomId;
        document.getElementById('join-room-name').value = name;
        document.getElementById('join-room-modal').classList.remove('hidden');
        return;
    }
    await joinAndOpenRoom(roomId, name, null);
}

async function confirmJoinRoom() {
    const roomId   = document.getElementById('join-room-id').value;
    const name     = document.getElementById('join-room-name').value;
    const password = document.getElementById('join-password').value;
    document.getElementById('join-room-modal').classList.add('hidden');
    await joinAndOpenRoom(roomId, name, password);
}

async function joinAndOpenRoom(roomId, name, password) {
    const res = await api.post(`/chat/rooms/${roomId}/join`, { password: password || '' });
    if (!res?.success) return toastError(res?.message || 'Gagal join room.');

    if (currentChat?.type === 'room') {
        socket.emit('room:leave', { roomId: currentChat.id });
    }

    currentChat = { type: 'room', id: roomId, name };
    socket.emit('room:join', { roomId, password: password || '' });

    openChatUI(name, `Room Publik`);
    document.getElementById('chat-messages').innerHTML = '';
    res.recentMessages?.forEach(m => appendMessage(m, m.from === ME.username));

    // Mark active
    document.querySelectorAll('.chat-item').forEach(el => el.classList.remove('active'));
}

// ── Open DM ───────────────────────────────────────────────────
function showDMModal() { document.getElementById('dm-modal').classList.remove('hidden'); }

async function startDM() {
    const target = document.getElementById('dm-target').value.trim();
    if (!target || target === ME.username) return toastError('Username tidak valid.');
    document.getElementById('dm-modal').classList.add('hidden');
    await openDM(target);
}

async function openDM(target) {
    const res = await api.get(`/chat/dm/${target}`);
    if (!res?.success) return toastError('Gagal buka DM.');

    currentChat = { type: 'dm', id: target, name: target };
    openChatUI(`@${target}`, 'Direct Message');
    document.getElementById('chat-messages').innerHTML = '';
    res.messages?.forEach(m => appendMessage(m, m.from === ME.username));
}

// ── UI Helpers ─────────────────────────────────────────────────
function openChatUI(title, subtitle) {
    document.getElementById('chat-empty').style.display   = 'none';
    document.getElementById('chat-header').style.display  = 'flex';
    document.getElementById('chat-messages').style.display= 'flex';
    document.getElementById('chat-input-area').style.display = 'flex';
    document.getElementById('chat-title').textContent     = title;
    document.getElementById('chat-subtitle').textContent  = subtitle;
    document.getElementById('chat-input').focus();
}

function appendMessage(msg, isMine) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'mine' : ''}`;

    const time = new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const isAdmin = ['admin', 'developer'].includes(msg.role);

    div.innerHTML = `
        <div class="message-avatar">${(msg.from || '?')[0].toUpperCase()}</div>
        <div class="message-content">
            <div class="message-info">${isMine ? 'Kamu' : escapeHtml(msg.from)} • ${time}</div>
            <div class="message-bubble ${isAdmin ? 'admin' : ''}">${escapeHtml(msg.message)}</div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function appendSystemMessage(text) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.style.cssText = 'text-align:center;font-size:12px;color:var(--text-muted);padding:4px';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping(text) {
    const el = document.getElementById('typing-indicator');
    el.textContent = text;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => { el.textContent = ''; }, 3000);
}

// ── Send Message ──────────────────────────────────────────────
async function sendMessage() {
    const input   = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message || !currentChat) return;
    input.value = '';
    input.style.height = '';

    if (currentChat.type === 'room') {
        socket.emit('room:message', { roomId: currentChat.id, message });
    } else {
        socket.emit('dm:send', { target: currentChat.id, message });
    }
}

function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}

function handleTyping() {
    if (!socket || !currentChat) return;
    if (currentChat.type === 'room') {
        socket.emit('room:typing', { roomId: currentChat.id });
    } else {
        socket.emit('dm:typing', { target: currentChat.id });
    }
    // Auto-resize textarea
    const ta = document.getElementById('chat-input');
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 100) + 'px';
}

// ── Create Room ───────────────────────────────────────────────
function showCreateRoomModal() { document.getElementById('create-room-modal').classList.remove('hidden'); }

async function createRoom() {
    const name     = document.getElementById('room-name').value.trim();
    const password = document.getElementById('room-password').value;
    if (!name) return showAlert('create-room-alert', 'Nama room wajib diisi.');

    const res = await api.post('/chat/rooms', { name, password: password || undefined });
    if (res?.success) {
        toastSuccess(res.message);
        document.getElementById('create-room-modal').classList.add('hidden');
        document.getElementById('room-name').value = '';
        document.getElementById('room-password').value = '';
        loadRooms();
    } else {
        showAlert('create-room-alert', res?.message || 'Gagal buat room.');
    }
}

// ── Utils ─────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str || '').replace(/[<>&"']/g, c =>
        ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;' }[c]));
}
