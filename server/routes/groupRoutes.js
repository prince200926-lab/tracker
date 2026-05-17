const express = require('express');
const {
  createGroup,
  joinGroup,
  respondToJoinRequest,
  getGroup,
  getUserGroups,
  leaveGroup,
  deleteGroup
} = require('../controllers/groupController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/create', createGroup);
router.post('/join', joinGroup);
router.post('/leave', leaveGroup);
router.post('/respond-request', respondToJoinRequest);
router.get('/user', getUserGroups);
router.delete('/:id', deleteGroup);
router.get('/:id', getGroup);

module.exports = router;