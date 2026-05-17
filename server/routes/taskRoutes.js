const express = require('express');
const {
  createTask,
  markTaskComplete,
  getGroupTasks,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/create', createTask);
router.post('/mark-complete', markTaskComplete);
router.get('/group/:groupId', getGroupTasks);
router.delete('/:id', deleteTask);

module.exports = router;