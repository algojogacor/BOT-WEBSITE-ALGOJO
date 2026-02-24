// ============================================================
//  controllers/features/farmingController.js
//  Porting dari commands/farming.js WA Bot
// ============================================================

const db  = require('../../config/database');
const { getUserGameData } = require('../userController');
const { fmt, randInt } = require('../../utils/helpers');
const { CROP_PRICES, PROCESSED_CROP_PRICES, CROP_GROW_TIME_MS, MACHINE_PRICES } = require('../../utils/constants');

// Durasi proses per item untuk produk olahan (mengikuti commands/farming.js WA Bot)
const PROCESS_TIME_MS = {
    beras:        25 * 60_000,
    popcorn:      30 * 60_000,
    bawang_goreng:45 * 60_000,
    kopi_bubuk:   60 * 60_000,
    minyak:       120 * 60_000,
};

function ensureFarm(u) {
    if (!u.farm) u.farm = {};
    if (!u.farm.plants) u.farm.plants = [];
    if (!u.farm.inventory) u.farm.inventory = {};
    if (!u.farm.machines) u.farm.machines = [];
    if (!u.farm.processing) u.farm.processing = [];
}

function updateProcessing(u) {
    ensureFarm(u);
    const now = Date.now();
    const processing = u.farm.processing || [];
    if (!processing.length) return { list: [], changed: false };

    const remaining = [];
    const view = [];
    let changed = false;

    for (const p of processing) {
        const duration = p.durationPerItem || PROCESS_TIME_MS[p.product] || 0;
        if (!duration) {
            // Tidak ada info durasi, tetap tampilkan apa adanya
            remaining.push(p);
            view.push({
                machine: p.machine,
                product: p.product,
                qty: p.qty,
                timeLeftMs: 0,
                durationPerItem: duration,
            });
            continue;
        }

        const elapsedTime = now - p.startedAt;
        let finishedCount = Math.floor(elapsedTime / duration);
        if (finishedCount > p.qty) finishedCount = p.qty;

        if (finishedCount > 0) {
            changed = true;
            if (!u.farm.inventory[p.product]) u.farm.inventory[p.product] = 0;
            u.farm.inventory[p.product] += finishedCount;

            p.qty -= finishedCount;
            p.startedAt += finishedCount * duration;
        }

        if (p.qty > 0) {
            const currentProgressMs = now - p.startedAt;
            const timeLeftMs = Math.max(0, duration - currentProgressMs);
            remaining.push({
                machine: p.machine,
                product: p.product,
                qty: p.qty,
                durationPerItem: duration,
                startedAt: p.startedAt,
            });
            view.push({
                machine: p.machine,
                product: p.product,
                qty: p.qty,
                timeLeftMs,
                durationPerItem: duration,
            });
        } else {
            changed = true;
        }
    }

    u.farm.processing = remaining;
    return { list: view, changed };
}

async function saveU(username, u, source) {
    const data = db.getData();
    if (source === 'wa') { const waId = db.getWebUsers()[username]?.waId; if (waId) data.users[waId] = u; }
    else { if (!data.webGameData) data.webGameData = {}; data.webGameData[username] = u; }
    await db.saveData(data);
}

async function getStatus(req, res) {
    const { username } = req.user;
    const { source, data: u }  = getUserGameData(username);
    ensureFarm(u);

    const balance = Math.floor(u.balance || 0);
    const bank   = Math.floor(u.bank || 0);

    // Normalize legacy WA data: readyAt might be in seconds (< 1e12)
    let crops = (u.crops || []).map(c => {
        const c2 = { ...c };
        if (c2.readyAt != null && c2.readyAt < 1e12) c2.readyAt = c2.readyAt * 1000;
        return c2;
    });

    const procInfo = updateProcessing(u);
    if (procInfo.changed) {
        await saveU(username, u, source);
    }

    const machinesArr = (u.machines && u.machines.length)
        ? u.machines
        : (u.farm.machines || []);

    res.json({
        success: true,
        crops,
        machines: machinesArr,
        balance,
        bank,
        processing: procInfo.list,
        inventory: u.farm.inventory || {},
    });
}

async function tanam(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const { crop, qty = 1 } = req.body;

    const price = CROP_PRICES[crop];
    if (!price) return res.status(400).json({ success: false, message: `❌ Tanaman tidak valid. Pilih: ${Object.keys(CROP_PRICES).join(', ')}` });

    const total = price * qty;
    if ((u.balance || 0) < total) return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(total)} untuk tanam ${qty}x ${crop}.` });

    const MAX_FIELDS = 100;
    const currentCrops = u.crops || [];
    if (currentCrops.length + qty > MAX_FIELDS) return res.status(400).json({ success: false, message: `❌ Maksimal ${MAX_FIELDS} slot ladang. Sekarang ${currentCrops.length}.` });

    if (!u.crops) u.crops = [];
    u.balance -= total;
    const growMs = CROP_GROW_TIME_MS[crop] || 3600_000;
    u.crops.push({ crop, qty: parseInt(qty), plantedAt: Date.now(), readyAt: Date.now() + growMs });
    await saveU(username, u, source);
    res.json({ success: true, message: `🌱 Berhasil tanam ${qty}x ${crop}! Panen dalam ${CROP_GROW_TIME_MS[crop] / 3600_000} jam.` });
}

async function panen(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const now = Date.now();

    if (!u.crops?.length) return res.status(400).json({ success: false, message: '❌ Tidak ada tanaman.' });

    const ready  = u.crops.filter(c => now >= c.readyAt);
    if (!ready.length) return res.status(400).json({ success: false, message: '⏳ Belum ada tanaman yang siap panen.' });

    let income = 0;
    let results = [];
    ready.forEach(c => {
        const earn = (CROP_PRICES[c.crop] || 0) * c.qty * 2; // 2x dari modal
        income += earn;
        results.push(`${c.qty}x ${c.crop} → +Rp${fmt(earn)}`);
    });

    u.crops    = u.crops.filter(c => now < c.readyAt);
    u.balance  = (u.balance || 0) + income;
    await saveU(username, u, source);
    res.json({ success: true, message: `🌾 Panen berhasil!\n${results.join('\n')}\nTotal: +Rp${fmt(income)}`, income });
}

async function beliMesin(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const { machine } = req.body;

    const price = MACHINE_PRICES[machine];
    if (!price) return res.status(400).json({ success: false, message: `❌ Mesin tidak valid. Pilih: ${Object.keys(MACHINE_PRICES).join(', ')}` });
    if ((u.balance || 0) < price) return res.status(400).json({ success: false, message: `❌ Butuh Rp${fmt(price)} untuk beli mesin.` });

    if (!u.machines) u.machines = [];
    // Stackable: allow multiple of same machine (array can contain duplicates)
    u.balance -= price;
    u.machines.push(machine);
    await saveU(username, u, source);
    res.json({ success: true, message: `⚙️ Mesin ${machine} dibeli! Rp${fmt(price)}.` });
}

async function prosesTanaman(req, res) {
    const { username } = req.user;
    const { source, data: u } = getUserGameData(username);
    const { crop, qty = 1 } = req.body;

    const rawMap = { beras: 'padi', popcorn: 'jagung', bawang_goreng: 'bawang', kopi_bubuk: 'kopi', minyak: 'sawit' };
    const machineMap = { beras: 'gilingan', popcorn: 'popcorn_maker', bawang_goreng: 'penggorengan', kopi_bubuk: 'roaster', minyak: 'penyulingan' };

    const rawCrop   = rawMap[crop];
    const reqMachine= machineMap[crop];
    if (!rawCrop) return res.status(400).json({ success: false, message: `❌ Produk tidak valid: ${Object.keys(rawMap).join(', ')}` });
    ensureFarm(u);

    const machineList = (u.farm.machines && u.farm.machines.length)
        ? u.farm.machines
        : (u.machines || []);

    const totalMachines = machineList.filter(m => m === reqMachine).length;
    if (totalMachines === 0) {
        return res.status(400).json({ success: false, message: `❌ Butuh mesin ${reqMachine}!` });
    }

    const nQty = parseInt(qty) || 1;
    if (nQty <= 0) return res.status(400).json({ success: false, message: '❌ Jumlah harus lebih dari 0.' });

    // Gunakan stok hasil panen di gudang (schema WA: user.farm.inventory)
    if (!u.farm || !u.farm.inventory) {
        return res.status(400).json({ success: false, message: '❌ Gudang kosong atau belum ada data farming lama. Panen dulu di WA bot atau versi web yang baru.' });
    }

    const currentStock = u.farm.inventory[rawCrop] || 0;
    if (currentStock < nQty) {
        return res.status(400).json({
            success: false,
            message: `❌ Bahan kurang. Stok ${rawCrop.toUpperCase()} di gudang: ${fmt(currentStock)} unit.`
        });
    }

    // Batasi jumlah batch aktif per jenis mesin sesuai jumlah unit mesin
    const activeBatches = (u.farm.processing || []).filter(p => p.machine === reqMachine).length;
    if (activeBatches >= totalMachines) {
        return res.status(400).json({
            success: false,
            message: `⏳ Semua mesin ${reqMachine} sedang bekerja! Tunggu antrian selesai atau beli mesin lagi.`
        });
    }

    const durationPerItem = PROCESS_TIME_MS[crop] || 30 * 60_000;

    // Kurangi stok bahan mentah di gudang
    u.farm.inventory[rawCrop] = currentStock - nQty;
    if (u.farm.inventory[rawCrop] <= 0) delete u.farm.inventory[rawCrop];

    // Masukkan ke antrian pabrik (incremental queue seperti WA bot)
    if (!u.farm.processing) u.farm.processing = [];
    u.farm.processing.push({
        machine: reqMachine,
        product: crop,
        qty: nQty,
        durationPerItem,
        startedAt: Date.now(),
    });

    await saveU(username, u, source);
    const minutes = Math.round(durationPerItem / 60_000);
    res.json({
        success: true,
        message: `⚙️ Mesin berjalan! Input: ${nQty} ${rawCrop.toUpperCase()}.\n⏱️ Per item: ${minutes} menit. Cek tab Pabrik untuk lihat progres & hasil.`
    });
}

module.exports = { getStatus, tanam, panen, beliMesin, prosesTanaman };
