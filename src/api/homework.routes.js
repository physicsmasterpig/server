/**
 * Homework Routes
 */
const express = require('express');
const homeworkController = require('../controllers/homework.controller');
const router = express.Router();

// Get all homework
router.get('/', homeworkController.getAllHomework.bind(homeworkController));

// Get homework by lecture
router.get('/lecture/:lectureId', homeworkController.getHomeworkByLecture.bind(homeworkController));

// Get homework by ID
router.get('/:id', homeworkController.getHomeworkById.bind(homeworkController));

// Create new homework
router.post('/', homeworkController.createHomework.bind(homeworkController));

// Update homework
router.put('/:id', homeworkController.updateHomework.bind(homeworkController));

// Delete homework
router.delete('/:id', homeworkController.deleteHomework.bind(homeworkController));

module.exports = router;
