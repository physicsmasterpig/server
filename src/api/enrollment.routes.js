/**
 * Enrollment Routes
 */
const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const router = express.Router();

// Get all enrollments
router.get('/', enrollmentController.getAllEnrollments.bind(enrollmentController));

// Get enrollments by class
router.get('/class/:classId', enrollmentController.getEnrollmentsByClass.bind(enrollmentController));

// Get enrollment by ID
router.get('/:id', enrollmentController.getEnrollmentById.bind(enrollmentController));

// Create new enrollment
router.post('/', enrollmentController.createEnrollment.bind(enrollmentController));

// Update enrollment
router.put('/:id', enrollmentController.updateEnrollment.bind(enrollmentController));

// Delete enrollment
router.delete('/:id', enrollmentController.deleteEnrollment.bind(enrollmentController));

module.exports = router;
