// ============================================================
//  routes/features.js — Semua Fitur: Farming, Mining, Games, dll
// ============================================================

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth');
const { gameLimiter, externalApiLimiter } = require('../middleware/rateLimiter');

router.use(requireAuth);

// ── Farming ──────────────────────────────────────────────────
const farming = require('../controllers/features/farmingController');
router.get ('/farming',              farming.getStatus);
router.post('/farming/tanam',        gameLimiter, farming.tanam);
router.post('/farming/panen',        gameLimiter, farming.panen);
router.post('/farming/beli-mesin',   farming.beliMesin);
router.post('/farming/proses',       gameLimiter, farming.prosesTanaman);

// ── Ternak ───────────────────────────────────────────────────
const ternak = require('../controllers/features/ternakController');
router.get ('/ternak',               ternak.getStatus);
router.post('/ternak/beli',          gameLimiter, ternak.beli);
router.post('/ternak/pakan',         gameLimiter, ternak.pakan);
router.post('/ternak/jual',          gameLimiter, ternak.jual);

// ── Mining ───────────────────────────────────────────────────
const mining = require('../controllers/features/miningController');
router.get ('/mining',               mining.getStatus);
router.post('/mining/beli-rig',      mining.beliRig);
router.post('/mining/collect',       gameLimiter, mining.collectIncome);

// ── Properti ─────────────────────────────────────────────────
const property = require('../controllers/features/propertyController');
router.get ('/property',             property.getStatus);
router.post('/property/beli',        property.beli);
router.post('/property/collect',     gameLimiter, property.collect);

// ── Games (Casino, Roulette, Slot, Coinflip) ─────────────────
const games = require('../controllers/features/gamesController');
router.get ('/games',                games.getStatus);
router.post('/games/casino',         gameLimiter, games.casino);
router.post('/games/roulette',       gameLimiter, games.roulette);
router.post('/games/slot',           gameLimiter, games.slot);
router.post('/games/coinflip',       gameLimiter, games.coinflip);
router.post('/games/dadu',          gameLimiter, games.dadu);
router.post('/games/minigame-reward', gameLimiter, games.minigameReward);

// ── Trivia (WA Bot port) ─────────────────────────────────────
const trivia = require('../controllers/features/triviaController');
router.get ('/trivia/status',         trivia.status);
router.post('/trivia/start',          gameLimiter, trivia.start);
router.post('/trivia/answer',         gameLimiter, trivia.answer);
router.post('/trivia/hint',           gameLimiter, trivia.hint);
router.post('/trivia/stop',           gameLimiter, trivia.stop);
router.get ('/trivia/leaderboard',    trivia.leaderboard);

// ── Wordle (WA Bot port) ─────────────────────────────────────
const wordle = require('../controllers/features/wordleController');
router.get ('/wordle/status',         wordle.status);
router.post('/wordle/start',          gameLimiter, wordle.start);
router.post('/wordle/guess',          gameLimiter, wordle.guess);
router.post('/wordle/stop',           gameLimiter, wordle.stop);
router.get ('/wordle/stats',          wordle.stats);

// ── AI (via OpenRouter) ──────────────────────────────────────
const aiCtrl = require('../controllers/features/aiController');
router.post('/ai/chat',              externalApiLimiter, aiCtrl.chat);
router.post('/ai/imagine',           externalApiLimiter, aiCtrl.imagine);

// ── TTS ──────────────────────────────────────────────────────
const ttsCtrl = require('../controllers/features/ttsController');
router.post('/tts',                  externalApiLimiter, ttsCtrl.generate);

// ── Tools ────────────────────────────────────────────────────
const toolsCtrl = require('../controllers/features/toolsController');
router.post('/tools/remove-bg',      externalApiLimiter, toolsCtrl.removeBg);
router.get ('/tools/cuaca',          toolsCtrl.cuaca);
router.get ('/tools/berita',         toolsCtrl.berita);

module.exports = router;
