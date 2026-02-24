// controllers/features/aiController.js — Chat AI via OpenRouter
const axios = require('axios');
const { getUserGameData } = require('../userController');
const db = require('../../config/database');

async function chat(req, res) {
    const { message, model = 'openai/gpt-4o-mini' } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: '❌ Pesan tidak boleh kosong.' });

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model,
            messages: [
                { role: 'system', content: 'Kamu adalah AlgojoGacor AI, asisten cerdas berbahasa Indonesia yang ramah dan informatif.' },
                { role: 'user',   content: message }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
                'X-Title': 'AlgojoGacor Web',
            },
            timeout: 30_000,
        });

        const reply = response.data.choices?.[0]?.message?.content || 'Maaf, tidak ada jawaban.';
        res.json({ success: true, reply });
    } catch (err) {
        console.error('OpenRouter error:', err.response?.data || err.message);
        res.status(500).json({ success: false, message: 'Gagal menghubungi AI. Coba lagi.' });
    }
}

async function imagine(req, res) {
    const { prompt } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: '❌ Prompt tidak boleh kosong.' });

    try {
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openai/gpt-4o',
            messages: [{ role: 'user', content: `Generate an image: ${prompt}` }]
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'Content-Type':  'application/json',
                'HTTP-Referer':  process.env.APP_URL,
            },
            timeout: 60_000,
        });
        const reply = response.data.choices?.[0]?.message?.content || 'Tidak ada respons.';
        res.json({ success: true, reply });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Gagal generate gambar.' });
    }
}

module.exports = { chat, imagine };
