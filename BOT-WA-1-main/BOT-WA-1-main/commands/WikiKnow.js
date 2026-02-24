const axios = require('axios');

// User-Agent
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

module.exports = async (command, args, msg) => {
    
    // 1. WIKIKNOW (Wikipedia)
    if (command === 'wiki' || command === 'wikiknow' || command === 'whatis') {
        if (args.length === 0) return msg.reply("❌ Masukkan kata kunci! Contoh: `!wikiknow Soekarno`");
        const query = args.join(" ");

        try {
            const url = `https://id.wikipedia.org/w/api.php`;
            const params = {
                action: 'query',
                format: 'json',
                prop: 'extracts|pageimages',
                exintro: true,
                explaintext: true,
                redirects: 1,
                piprop: 'original',
                titles: query
            };

            const { data } = await axios.get(url, { params, headers: { 'User-Agent': UA } });
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            const pageData = pages[pageId];

            if (pageId === "-1") return msg.reply(`❌ Artikel "${query}" tidak ditemukan.`);

            let txt = `📚 *WikiKnow: ${pageData.title}*\n\n`;
            txt += `${pageData.extract}\n\n`;
            txt += `🔗 _id.wikipedia.org/wiki/${encodeURIComponent(pageData.title.replace(/ /g, "_"))}_`;

            if (pageData.original && pageData.original.source) {
                try {
                    const media = await MessageMedia.fromUrl(pageData.original.source);
                    return msg.reply(media, null, { caption: txt });
                } catch (e) { /* Ignore image error */ }
            }
            return msg.reply(txt);

        } catch (e) {
            console.error("Wiki Error:", e.message);
            return msg.reply("⚠️ Gagal mengambil data Wikipedia.");
        }
    }

    // 2. FAKTA UNIK
    if (command === 'fakta' || command === 'faktaunik') {
        const faktaList = [
            "Madu adalah satu-satunya makanan yang tidak pernah basi.",
            "Siput bisa tidur selama 3 tahun.",
            "Kuda laut jantan adalah yang melahirkan anak.",
            "Jantung udang terletak di kepalanya.",
            "Kecoa bisa hidup 9 hari tanpa kepala.",
            "Indonesia memiliki garis pantai terpanjang kedua di dunia."
        ];
        return msg.reply(`💡 *WikiKnow Fact:*\n\n"${faktaList[Math.floor(Math.random() * faktaList.length)]}"`);
    }
    
    // 3. JADWAL SHOLAT
    if (command === 'sholat' || command === 'jadwal') {
        const kota = args[0] || 'jakarta';
        try {
            const searchCity = await axios.get(`https://api.myquran.com/v2/sholat/kota/cari/${kota}`);
            if(!searchCity.data.status || searchCity.data.data.length === 0) return msg.reply("❌ Kota tidak ditemukan.");
            
            const idKota = searchCity.data.data[0].id;
            const namaKota = searchCity.data.data[0].lokasi;
            const date = new Date().toISOString().split('T')[0].split('-'); 
            const jadwalUrl = `https://api.myquran.com/v2/sholat/jadwal/${idKota}/${date[0]}/${date[1]}/${date[2]}`;
            const { data } = await axios.get(jadwalUrl);
            const j = data.data.jadwal;

            let txt = `🕌 *Jadwal Sholat ${namaKota}*\n📅 ${j.tanggal}\n\n`;
            txt += `🌌 Subuh: ${j.subuh}\n☀️ Dzuhur: ${j.dzuhur}\n🌤️ Ashar: ${j.ashar}\n🌅 Maghrib: ${j.maghrib}\n🌌 Isya: ${j.isya}\n`;
            return msg.reply(txt);
        } catch (e) {
            return msg.reply("⚠️ Gagal mengambil jadwal sholat.");
        }
    }
};