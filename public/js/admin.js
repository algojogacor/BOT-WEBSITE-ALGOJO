// public/js/admin.js — Admin Panel Logic

if (!requireLogin()) throw new Error('Not logged in');
const ME = getUser();

// Cek role
if (!['admin', 'developer'].includes(ME?.role)) {
    alert('Akses ditolak!');
    window.location.href = '/dashboard.html';
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('sidebar-username').textContent = ME.username;
    document.getElementById('sidebar-role').textContent     = ME.role;
    document.getElementById('sidebar-avatar').textContent   = ME.username[0].toUpperCase();

    // Show developer-only sections
    if (ME.role === 'developer') {
        document.querySelectorAll('.developer-only').forEach(el => el.classList.remove('hidden'));
    }

    await loadStats();
    await loadUserList();
});

async function loadStats() {
    const data = await api.get('/admin/stats');
    if (!data?.success) return;
    const s = data.stats;
    document.getElementById('s-web-users').textContent = s.totalWebUsers;
    document.getElementById('s-wa-users').textContent  = s.totalWaUsers;
    document.getElementById('s-banned').textContent    = s.bannedCount;
    document.getElementById('s-money').textContent     = fmtMoney(s.totalMoney);
}

async function loadUserList() {
    const data = await api.get('/user/list');
    if (!data?.success) return;
    const tbody = document.getElementById('user-table');
    tbody.innerHTML = data.users.map(u => `
        <tr>
            <td><strong>${escHtml(u.username)}</strong></td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td>${u.banned ? `<span class="badge badge-banned">Banned</span>` : '<span style="color:var(--accent-green)">✅ Aktif</span>'}</td>
            <td>${u.waId ? `<code style="font-size:11px">${u.waId.substring(0, 15)}...</code>` : '—'}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="quickBan('${escHtml(u.username)}')">🔨 Ban</button>
                <button class="btn btn-sm btn-secondary" onclick="quickUnban('${escHtml(u.username)}')">✅ Unban</button>
            </td>
        </tr>
    `).join('');
}

// ── Admin Actions ─────────────────────────────────────────────
async function adminAction(type) {
    let res;

    if (type === 'add-money') {
        const username = document.getElementById('add-money-user').value.trim();
        const amount   = document.getElementById('add-money-amount').value;
        if (!username || !amount) return toastError('Isi semua field.');
        res = await api.post('/admin/add-money', { username, amount: parseInt(amount) });

    } else if (type === 'set-money') {
        const username = document.getElementById('set-money-user').value.trim();
        const amount   = document.getElementById('set-money-amount').value;
        if (!username || amount === '') return toastError('Isi semua field.');
        res = await api.post('/admin/set-money', { username, amount: parseInt(amount) });

    } else if (type === 'ban') {
        const username = document.getElementById('ban-user').value.trim();
        const duration = parseInt(document.getElementById('ban-duration').value) || 0;
        const reason   = document.getElementById('ban-reason').value.trim();
        if (!username) return toastError('Isi username.');
        if (!confirm(`Ban @${username}?`)) return;
        res = await api.post('/admin/ban', { username, duration, reason });

    } else if (type === 'unban') {
        const username = document.getElementById('ban-user').value.trim();
        if (!username) return toastError('Isi username.');
        res = await api.post('/admin/unban', { username });

    } else if (type === 'reset-user') {
        const username = document.getElementById('reset-user').value.trim();
        if (!username) return toastError('Isi username.');
        if (!confirm(`Reset SEMUA data @${username}? Ini tidak bisa dibatalkan!`)) return;
        res = await api.post('/admin/reset-user', { username });

    } else if (type === 'event-on' || type === 'event-off') {
        const eventType= document.getElementById('event-type').value;
        const duration = parseInt(document.getElementById('event-duration').value) || 30;
        res = await api.post('/admin/event', { type: eventType, duration, active: type === 'event-on' });

    } else if (type === 'set-price') {
        const item  = document.getElementById('price-item').value.trim();
        const price = document.getElementById('price-value').value;
        if (!item || !price) return toastError('Isi semua field.');
        res = await api.post('/admin/set-price', { item, price: parseInt(price) });

    } else if (type === 'promote') {
        const username = document.getElementById('promote-user').value.trim();
        const role     = document.getElementById('promote-role').value;
        if (!username) return toastError('Isi username.');
        if (!confirm(`Ubah role @${username} menjadi ${role}?`)) return;
        res = await api.post('/admin/promote', { username, role });
    }

    if (!res) return;
    if (res.success) {
        toastSuccess(res.message);
        await loadStats();
        await loadUserList();
    } else {
        toastError(res.message);
    }
}

async function quickBan(username) {
    const reason = prompt(`Alasan ban @${username}?`, 'Melanggar aturan');
    if (reason === null) return;
    const res = await api.post('/admin/ban', { username, duration: 60, reason });
    if (res?.success) { toastSuccess(res.message); await loadUserList(); }
    else toastError(res?.message);
}

async function quickUnban(username) {
    const res = await api.post('/admin/unban', { username });
    if (res?.success) { toastSuccess(res.message); await loadUserList(); }
    else toastError(res?.message);
}

function escHtml(str) {
    return String(str || '').replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#x27;'}[c]));
}
