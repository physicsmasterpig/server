/**
 * Attendance Routes
 */
const express = require('express');
const attendanceController = require('../controllers/attendance.controller');
const router = express.Router();

// Get all attendance records
router.get('/', attendanceController.getAllAttendance.bind(attendanceController));

// Get attendance by lecture
router.get('/lecture/:lectureId', attendanceController.getAttendanceByLecture.bind(attendanceController));

// Get attendance by student
router.get('/student/:studentId', attendanceController.getAttendanceByStudent.bind(attendanceController));

// Get attendance by ID
router.get('/:id', attendanceController.getAttendanceById.bind(attendanceController));

// Create new attendance record
router.post('/', attendanceController.createAttendance.bind(attendanceController));

// Update attendance record
router.put('/:id', attendanceController.updateAttendance.bind(attendanceController));

// Delete attendance record
router.delete('/:id', attendanceController.deleteAttendance.bind(attendanceController));

module.exports = router;
