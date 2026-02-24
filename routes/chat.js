// routes/chat.js
const router = require('express').Router();
const ctrl   = require('../controllers/chatController');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { chatMessageRules, handleValidation } = require('../middleware/validate');

router.use(requireAuth);

// Rooms
router.get   ('/rooms',         ctrl.getRooms);
router.post  ('/rooms',         ctrl.createRoom);
router.post  ('/rooms/:id/join',ctrl.joinRoom);
router.post  ('/rooms/:id/leave',ctrl.leaveRoom);
router.delete('/rooms/:id',     ctrl.deleteRoom);

// Direct Message
router.get ('/dm/:target', ctrl.getDM);
router.post('/dm/:target', chatMessageRules, handleValidation, ctrl.sendDM);

module.exports = router;
