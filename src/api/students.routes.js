/**
 * Student Routes
 * API endpoints for student management
 */
const express = require('express');
const router = express.Router();
const studentsController = require('../controllers/students.controller');

// Get all students
router.get('/', studentsController.getAllStudents.bind(studentsController));

// Get a student by ID
router.get('/:id', studentsController.getStudentById.bind(studentsController));

// Create a new student
router.post('/', studentsController.createStudent.bind(studentsController));

// Update a student
router.put('/:id', studentsController.updateStudent.bind(studentsController));

// Delete a student
router.delete('/:id', studentsController.deleteStudent.bind(studentsController));

// Get student attendance
router.get('/:id/attendance', studentsController.getStudentAttendance.bind(studentsController));

module.exports = router;
