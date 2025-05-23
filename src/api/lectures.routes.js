/**
 * Lecture Routes
 */
const express = require('express');
const lectureController = require('../controllers/lecture.controller');
const router = express.Router();

// Get all lectures
router.get('/', lectureController.getAllLectures.bind(lectureController));

// Get upcoming lectures
router.get('/upcoming', lectureController.getUpcomingLectures.bind(lectureController));

// Get lectures by class
router.get('/class/:classId', lectureController.getLecturesByClass.bind(lectureController));

// Get lecture by ID
router.get('/:id', lectureController.getLectureById.bind(lectureController));

// Get lecture attendance
router.get('/:id/attendance', lectureController.getLectureAttendance.bind(lectureController));

// Create new lecture
router.post('/', lectureController.createLecture.bind(lectureController));

// Update lecture
router.put('/:id', lectureController.updateLecture.bind(lectureController));

// Delete lecture
router.delete('/:id', lectureController.deleteLecture.bind(lectureController));

module.exports = router;
