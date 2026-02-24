const { saveDB } = require('../helpers/database');

module.exports = async (command, args, msg, user, db) => {
    
    // FITUR BERSIH-BERSIH DATABASE
    if (command === 'cleandb' || command === 'prune') {
        // Cek argumen hari (Default 30 hari kalau tidak diisi)
        const daysInput = parseInt(args[0]);
        const days = isNaN(daysInput) ? 30 : daysInput;
        
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - (days * MS_PER_DAY);

        let deletedCount = 0;
        let totalUsers = Object.keys(db.users).length;

        // Loop semua user
        for (const userId in db.users) {
            const u = db.users[userId];
            
            // Logika Deteksi Pasif:
            // Gunakan lastSeen (terbaru) atau lastDaily (data lama) atau 0 (user hantu)
            const lastActive = u.lastSeen || u.lastDaily || 0;

            // Saldo >100.000 aman
            const isRich = u.balance > 100000; 

            if (lastActive < cutoffTime && !isRich) {
                delete db.users[userId];
                deletedCount++;
            }
        }

        saveDB(db);
        
        let replyMsg = `🧹 *PEMBERSIHAN DATABASE SELESAI*\n\n`;
        replyMsg += `📉 Batas Pasif: *${days} Hari*\n`;
        replyMsg += `👥 Total User Awal: ${totalUsers}\n`;
        replyMsg += `🗑️ Dihapus: *${deletedCount}* user pasif\n`;
        replyMsg += `✅ Sisa User: ${Object.keys(db.users).length}`;

        return msg.reply(replyMsg);
    }
};