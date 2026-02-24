/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║         PRAKIRAAN CUACA + AQI — Fitur 17                    ║
 * ║  !cuaca <kota>    — Cuaca hari ini + AQI                    ║
 * ║  !prakiraan <kota>— Prakiraan 5 hari ke depan               ║
 * ╚══════════════════════════════════════════════════════════════╝
 * 
 *  API: Open-Meteo (gratis, no key) + Nominatim geocoding
 *  AQI dari: Open-Meteo Air Quality API (gratis)
 */

const axios = require('axios');
const { saveDB } = require('../helpers/database');

// ─── Geocoding: kota → koordinat ─────────────────────────────
async function getKoordinat(kota) {
    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(kota)}&format=json&limit=1`;
        const res = await axios.get(url, {
            timeout: 8000,
            headers: { 'User-Agent': 'WA-Bot-Weather/1.0' }
        });
        if (res.data && res.data.length > 0) {
            return {
                lat: parseFloat(res.data[0].lat),
                lon: parseFloat(res.data[0].lon),
                displayName: res.data[0].display_name.split(',').slice(0, 2).join(',').trim()
            };
        }
        return null;
    } catch (e) {
        console.error('Geocoding error:', e.message);
        return null;
    }
}

// ─── Fetch cuaca dari Open-Meteo ──────────────────────────────
async function getCuaca(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weathercode,windspeed_10m,winddirection_10m,uv_index` +
        `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,sunrise,sunset` +
        `&timezone=Asia%2FJakarta&forecast_days=5`;
    const res = await axios.get(url, { timeout: 8000 });
    return res.data;
}

// ─── Fetch AQI dari Open-Meteo Air Quality ───────────────────
async function getAQI(lat, lon) {
    try {
        const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
            `&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,us_aqi` +
            `&timezone=Asia%2FJakarta`;
        const res = await axios.get(url, { timeout: 8000 });
        return res.data.current;
    } catch (e) {
        return null;
    }
}

// ─── Mapping kode cuaca WMO ───────────────────────────────────
const WMO_CODE = {
    0: { desc: 'Cerah', emoji: '☀️' },
    1: { desc: 'Cerah Berawan', emoji: '🌤️' },
    2: { desc: 'Berawan Sebagian', emoji: '⛅' },
    3: { desc: 'Mendung', emoji: '☁️' },
    45: { desc: 'Berkabut', emoji: '🌫️' },
    48: { desc: 'Berkabut (Beku)', emoji: '🌫️' },
    51: { desc: 'Gerimis Ringan', emoji: '🌦️' },
    53: { desc: 'Gerimis Sedang', emoji: '🌦️' },
    55: { desc: 'Gerimis Lebat', emoji: '🌧️' },
    61: { desc: 'Hujan Ringan', emoji: '🌧️' },
    63: { desc: 'Hujan Sedang', emoji: '🌧️' },
    65: { desc: 'Hujan Lebat', emoji: '🌧️' },
    71: { desc: 'Salju Ringan', emoji: '🌨️' },
    73: { desc: 'Salju Sedang', emoji: '❄️' },
    75: { desc: 'Salju Lebat', emoji: '❄️' },
    80: { desc: 'Hujan Shower Ringan', emoji: '🌦️' },
    81: { desc: 'Hujan Shower Sedang', emoji: '🌧️' },
    82: { desc: 'Hujan Shower Lebat', emoji: '⛈️' },
    95: { desc: 'Badai Petir', emoji: '⛈️' },
    96: { desc: 'Badai Petir + Hujan Es', emoji: '⛈️' },
    99: { desc: 'Badai Petir Lebat', emoji: '🌩️' },
};

const getWeather = (code) => WMO_CODE[code] || { desc: 'Tidak Diketahui', emoji: '❓' };

// ─── AQI Level ─────────────────────────────────────────────────
function getAQILevel(aqi) {
    if (!aqi) return { level: 'Tidak diketahui', emoji: '❓', saran: '' };
    if (aqi <= 50) return { level: 'Baik', emoji: '🟢', saran: 'Aman untuk aktivitas luar.' };
    if (aqi <= 100) return { level: 'Sedang', emoji: '🟡', saran: 'Kelompok sensitif perlu hati-hati.' };
    if (aqi <= 150) return { level: 'Tidak Sehat (Sensitif)', emoji: '🟠', saran: 'Batasi aktivitas luar untuk anak & lansia.' };
    if (aqi <= 200) return { level: 'Tidak Sehat', emoji: '🔴', saran: 'Hindari aktivitas luar dalam waktu lama.' };
    if (aqi <= 300) return { level: 'Sangat Tidak Sehat', emoji: '🟣', saran: 'Tetap di dalam ruangan, gunakan masker.' };
    return { level: 'Berbahaya', emoji: '⚫', saran: '⚠️ Darurat! Jangan keluar rumah.' };
}

// ─── Arah angin ───────────────────────────────────────────────
function arahAngin(derajat) {
    const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
    return dirs[Math.round(derajat / 45) % 8];
}

// ─── Format hari ─────────────────────────────────────────────
function formatHari(dateStr) {
    const d = new Date(dateStr);
    const hari = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return `${hari[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

// ──────────────────────────────────────────────────────────────
module.exports = async (command, args, msg, user, db) => {
    const validCommands = ['cuaca', 'prakiraan', 'weather', 'aqi'];
    if (!validCommands.includes(command)) return;

    const kota = args.join(' ').trim();

    if (!kota) {
        return msg.reply(
            `🌤️ *CUACA & KUALITAS UDARA*\n\n` +
            `Cara pakai:\n` +
            `• \`!cuaca Jakarta\` — Cuaca hari ini\n` +
            `• \`!prakiraan Surabaya\` — Prakiraan 5 hari\n` +
            `• \`!aqi Bandung\` — Fokus kualitas udara\n\n` +
            `Mendukung kota manapun di seluruh dunia 🌍`
        );
    }

    await msg.reply(`🌍 _Mencari data cuaca untuk "${kota}"..._`);

    // Geocoding
    const lokasi = await getKoordinat(kota);
    if (!lokasi) {
        return msg.reply(`❌ Kota "${kota}" tidak ditemukan. Coba nama kota yang lebih spesifik.`);
    }

    try {
        const [cuacaData, aqiData] = await Promise.all([
            getCuaca(lokasi.lat, lokasi.lon),
            getAQI(lokasi.lat, lokasi.lon)
        ]);

        const c = cuacaData.current;
        const d = cuacaData.daily;
        const w = getWeather(c.weathercode);
        const aqiInfo = getAQILevel(aqiData?.us_aqi);
        const uvLevel = c.uv_index <= 2 ? 'Rendah ☀️' : c.uv_index <= 5 ? 'Sedang 🌤️' : c.uv_index <= 7 ? 'Tinggi ⚠️' : 'Sangat Tinggi 🔥';

        // ══════════════════════════════════════════════════════
        // !cuaca atau !aqi — Cuaca hari ini
        // ══════════════════════════════════════════════════════
        if (command === 'cuaca' || command === 'weather' || command === 'aqi') {
            const sunrise = d.sunrise[0]?.split('T')[1]?.substring(0, 5) || '-';
            const sunset = d.sunset[0]?.split('T')[1]?.substring(0, 5) || '-';

            let aqiSection = '';
            if (aqiData) {
                aqiSection =
                    `\n${'─'.repeat(20)}\n` +
                    `🌬️ *KUALITAS UDARA (AQI)*\n` +
                    `Indeks: ${aqiInfo.emoji} *${aqiData.us_aqi} — ${aqiInfo.level}*\n` +
                    `PM2.5: ${aqiData.pm2_5?.toFixed(1) || '-'} μg/m³\n` +
                    `PM10: ${aqiData.pm10?.toFixed(1) || '-'} μg/m³\n` +
                    `O₃: ${aqiData.ozone?.toFixed(1) || '-'} μg/m³\n` +
                    `NO₂: ${aqiData.nitrogen_dioxide?.toFixed(1) || '-'} μg/m³\n` +
                    `💡 ${aqiInfo.saran}\n`;
            }

            return msg.reply(
                `${w.emoji} *CUACA — ${lokasi.displayName.toUpperCase()}*\n` +
                `${'─'.repeat(30)}\n\n` +
                `${w.emoji} *${w.desc}*\n\n` +
                `🌡️ Suhu: *${c.temperature_2m}°C* (terasa ${c.apparent_temperature}°C)\n` +
                `💧 Kelembaban: *${c.relative_humidity_2m}%*\n` +
                `🌧️ Curah Hujan: *${c.precipitation} mm*\n` +
                `💨 Angin: *${c.windspeed_10m} km/j* arah ${arahAngin(c.winddirection_10m)}\n` +
                `🔆 UV Index: *${c.uv_index}* (${uvLevel})\n` +
                `🌅 Matahari: Terbit ${sunrise} | Tenggelam ${sunset}\n` +
                aqiSection +
                `\n${'─'.repeat(20)}\n` +
                `📅 Prakiraan 5 hari: \`!prakiraan ${kota}\`\n` +
                `_Data: Open-Meteo • ${new Date().toLocaleString('id-ID')}_`
            );
        }

        // ══════════════════════════════════════════════════════
        // !prakiraan — Prakiraan 5 hari
        // ══════════════════════════════════════════════════════
        if (command === 'prakiraan') {
            let forecast = '';
            for (let i = 0; i < 5; i++) {
                const w5 = getWeather(d.weathercode[i]);
                const hari = formatHari(d.time[i]);
                forecast +=
                    `${w5.emoji} *${hari}* — ${w5.desc}\n` +
                    `   🌡️ ${d.temperature_2m_min[i]}°C – ${d.temperature_2m_max[i]}°C\n` +
                    `   🌧️ Hujan: ${d.precipitation_sum[i]} mm | UV: ${d.uv_index_max[i]}\n\n`;
            }

            return msg.reply(
                `📅 *PRAKIRAAN 5 HARI*\n` +
                `📍 ${lokasi.displayName}\n` +
                `${'─'.repeat(30)}\n\n` +
                forecast +
                `${'─'.repeat(20)}\n` +
                `_Data: Open-Meteo (gratis & akurat)_\n` +
                `Cuaca hari ini: \`!cuaca ${kota}\``
            );
        }
    } catch (e) {
        console.error('Cuaca Error:', e.message);
        return msg.reply('❌ Gagal mengambil data cuaca. Coba lagi nanti.');
    }
};
