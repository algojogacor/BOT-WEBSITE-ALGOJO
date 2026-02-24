// public/js/dashboard.js — Dashboard Logic

if (!requireLogin()) throw new Error('Not logged in');

const user = getUser();

// ── Init ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // Tampilkan info user di sidebar
    if (user) {
        document.getElementById('sidebar-username').textContent = user.username;
        document.getElementById('sidebar-role').textContent     = user.role;
        document.getElementById('sidebar-avatar').textContent   = user.username[0].toUpperCase();
        document.getElementById('topbar-greeting').textContent  = `Halo, ${user.username}! ⚔️`;

        // Tampilkan elemen admin jika role admin/developer
        if (['admin', 'developer'].includes(user.role)) {
            document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
        }
    }

    await loadProfile();

    // Auto-refresh status vital setiap 60 detik
    setInterval(loadProfile, 60_000);
});

// ── Load Profile ──────────────────────────────────────────────
async function loadProfile() {
    const data = await api.get('/user/profile');
    if (!data?.success) return;

    const p = data.profile;

    // Stats
    document.getElementById('stat-balance').textContent = fmtMoney(p.balance);
    document.getElementById('stat-bank').textContent    = fmtMoney(p.bank);
    document.getElementById('stat-level').textContent   = `Lv.${p.level}`;
    document.getElementById('stat-job').textContent     = p.job ? `💼 ${p.job}` : '😴 Nganggur';

    // Vital bars
    updateVitalBar('hp',     p.hp);
    updateVitalBar('hunger', p.hunger);
    updateVitalBar('energy', p.energy);

    // Status badges
    document.getElementById('dead-badge').classList.toggle('hidden', !p.dead);
    document.getElementById('sleep-badge').classList.toggle('hidden', !p.sleeping);

    // Peringatan kritis
    if (p.hp <= 30 && !p.dead)     toastError(`⚠️ HP kritis: ${p.hp}%! Segera makan atau ke RS!`);
    if (p.hunger <= 20)             toastError(`🍗 Lapar kritis: ${p.hunger}%! Segera makan!`);
}

function updateVitalBar(type, value) {
    const bar = document.getElementById(`${type}-bar`);
    const val = document.getElementById(`${type}-val`);
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, value))}%`;
    if (val) val.textContent = `${Math.floor(value)}%`;
}

// ── Quick Actions ─────────────────────────────────────────────
async function quickAction(action) {
    let res;
    if (action === 'makan') {
        if (!confirm('Makan? Biaya: Rp 50.000.000')) return;
        res = await api.post('/economy/makan');
    } else if (action === 'daily') {
        res = await api.post('/economy/daily');
    } else if (action === 'revive') {
        if (!confirm('Revive/RS? Biaya: Rp 500.000.000 (gratis jika miskin)')) return;
        res = await api.post('/economy/revive');
    } else if (action === 'tidur') {
        const hours = parseInt(document.getElementById('sleep-hours')?.value) || 8;
        res = await api.post('/economy/tidur', { hours });
        document.getElementById('sleep-modal')?.classList.add('hidden');
    } else if (action === 'bangun') {
        res = await api.post('/economy/bangun');
    }

    if (!res) return;
    if (res.success) {
        toastSuccess(res.message);
        await loadProfile();
    } else {
        toastError(res.message);
    }
}

function showSleepModal() {
    document.getElementById('sleep-modal')?.classList.remove('hidden');
}
