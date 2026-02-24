// public/js/auth.js — Login & Register Logic

// Jika sudah login, langsung ke dashboard
if (localStorage.getItem('token')) {
    window.location.href = '/dashboard.html';
}

function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.add('active');
}

// Pasang event listener pada tab (tidak pakai onclick di HTML)
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

// ── LOGIN ─────────────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Loading...';

    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            document.getElementById('login-alert').innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch {
        document.getElementById('login-alert').innerHTML = `<div class="alert alert-error">❌ Koneksi gagal. Coba lagi.</div>`;
    }

    btn.disabled = false;
    btn.innerHTML = '🚀 Login';
});

// ── REGISTER ──────────────────────────────────────────────────
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('register-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Membuat akun...';

    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const waId     = document.getElementById('reg-waid').value.trim();

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, waId: waId || undefined })
        });
        const data = await res.json();

        if (data.success) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = '/dashboard.html';
        } else {
            document.getElementById('register-alert').innerHTML = `<div class="alert alert-error">${data.message}</div>`;
        }
    } catch {
        document.getElementById('register-alert').innerHTML = `<div class="alert alert-error">❌ Koneksi gagal. Coba lagi.</div>`;
    }

    btn.disabled = false;
    btn.innerHTML = '✅ Buat Akun';
});