// controllers/features/toolsController.js
const axios    = require('axios');
const FormData = require('form-data');

async function removeBg(req, res) {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ success: false, message: '❌ Gambar (base64) wajib diisi.' });

    try {
        const form = new FormData();
        const buf  = Buffer.from(imageBase64, 'base64');
        form.append('image_file', buf, { filename: 'image.png', contentType: 'image/png' });
        form.append('size', 'auto');

        const response = await axios.post('https://api.remove.bg/v1.0/removebg', form, {
            headers: { ...form.getHeaders(), 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
            responseType: 'arraybuffer',
            timeout: 30_000,
        });
        const b64 = Buffer.from(response.data).toString('base64');
        res.json({ success: true, image: `data:image/png;base64,${b64}` });
    } catch (err) {
        console.error('RemoveBG error:', err.message);
        res.status(500).json({ success: false, message: 'Gagal hapus background.' });
    }
}

async function cuaca(req, res) {
    const { kota = 'Jakarta' } = req.query;
    try {
        const url      = `https://wttr.in/${encodeURIComponent(kota)}?format=j1`;
        const response = await axios.get(url, { timeout: 10_000 });
        const current  = response.data.current_condition?.[0];
        if (!current) return res.status(404).json({ success: false, message: 'Kota tidak ditemukan.' });
        res.json({
            success: true,
            kota,
            suhu: `${current.temp_C}°C`,
            cuaca: current.weatherDesc?.[0]?.value || '-',
            kelembaban: `${current.humidity}%`,
            angin: `${current.windspeedKmph} km/h`,
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal ambil data cuaca.' });
    }
}

async function berita(req, res) {
    const { q = 'Indonesia' } = req.query;
    try {
        // Gunakan GNews sebagai alternatif yang tidak perlu API key
        const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=id&max=5&apikey=free`;
        const response = await axios.get(url, { timeout: 10_000 });
        res.json({ success: true, articles: response.data.articles || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal ambil berita.' });
    }
}

module.exports = { removeBg, cuaca, berita };
