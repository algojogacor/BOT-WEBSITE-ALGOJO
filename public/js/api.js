// ============================================================
//  public/js/api.js — Helper Fetch API + Auth
//  Di-include di semua halaman untuk komunikasi ke backend
// ============================================================

const API_BASE = '/api';

// ── Token ────────────────────────────────────────────────────
function getToken()        { return localStorage.getItem('token'); }
function setToken(t)       { localStorage.setItem('token', t); }
function removeToken()     { localStorage.removeItem('token'); localStorage.removeItem('user'); }
function getUser()         { try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; } }
function setUser(u)        { localStorage.setItem('user', JSON.stringify(u)); }

// ── Redirect guard ────────────────────────────────────────────
function requireLogin() {
    if (!getToken()) { window.location.href = '/'; return false; }
    return true;
}

// ── Core Fetch ────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body: options.body ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body)) : undefined,
    });

    if (res.status === 401) {
        removeToken();
        if (window.location.pathname !== '/') window.location.href = '/';
        return null;
    }

    const data = await res.json().catch(() => ({ success: false, message: 'Response tidak valid.' }));
    return data;
}

const api = {
    get:    (path)         => apiFetch(path, { method: 'GET' }),
    post:   (path, body)   => apiFetch(path, { method: 'POST',   body }),
    put:    (path, body)   => apiFetch(path, { method: 'PUT',    body }),
    delete: (path)         => apiFetch(path, { method: 'DELETE' }),
};

// ── Toast ─────────────────────────────────────────────────────
function toast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, duration);
}
const toastSuccess = (msg) => toast(msg, 'success');
const toastError   = (msg) => toast(msg, 'error');
const toastInfo    = (msg) => toast(msg, 'info');
function showToast(type, message) {
    if (type === 'success') toastSuccess(message);
    else if (type === 'error') toastError(message);
    else toast(message, type);
}

// ── Alert di dalam form ────────────────────────────────────────
function showAlert(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}
function clearAlert(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
}

// ── Format angka ──────────────────────────────────────────────
function fmt(num) { return Math.floor(Number(num) || 0).toLocaleString('id-ID'); }
function fmtMoney(num) { return `Rp${fmt(num)}`; }

// ── Logout ────────────────────────────────────────────────────
function logout() {
    removeToken();
    window.location.href = '/';
}

// ── Sidebar toggle (mobile) ───────────────────────────────────
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}
