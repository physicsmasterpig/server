/**
 * API Routes
 * Main router that combines all API endpoints
 */
const express = require('express');
const router = express.Router();
const logger = require('../services/logger.service');

// Import individual route modules
const studentsRoutes = require('./students.routes');
// Dynamically import routes if they exist, or provide fallback
let classesRoutes, attendanceRoutes, lecturesRoutes, homeworkRoutes, examsRoutes, analyticsRoutes, enrollmentRoutes, scoresRoutes;

try {
  classesRoutes = require('./classes.routes');
} catch (error) {
  logger.warn('Classes routes not found, using fallback');
  classesRoutes = express.Router();
}

try {
  attendanceRoutes = require('./attendance.routes');
} catch (error) {
  logger.warn('Attendance routes not found, using fallback');
  attendanceRoutes = express.Router();
}

try {
  lecturesRoutes = require('./lectures.routes');
} catch (error) {
  logger.warn('Lectures routes not found, using fallback');
  lecturesRoutes = express.Router();
}

try {
  homeworkRoutes = require('./homework.routes');
} catch (error) {
  logger.warn('Homework routes not found, using fallback');
  homeworkRoutes = express.Router();
}

try {
  examsRoutes = require('./exams.routes');
} catch (error) {
  logger.warn('Exams routes not found, using fallback');
  examsRoutes = express.Router();
}

try {
  analyticsRoutes = require('./analytics.routes');
} catch (error) {
  logger.warn('Analytics routes not found, using fallback');
  analyticsRoutes = express.Router();
}

try {
  enrollmentRoutes = require('./enrollment.routes');
} catch (error) {
  logger.warn('Enrollment routes not found, using fallback');
  enrollmentRoutes = express.Router();
}

try {
  scoresRoutes = require('./scores.routes');
} catch (error) {
  logger.warn('Scores routes not found, using fallback');
  scoresRoutes = express.Router();
}

// Mount routes
router.use('/students', studentsRoutes);
router.use('/classes', classesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/lectures', lecturesRoutes);
router.use('/homework', homeworkRoutes);
router.use('/exams', examsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/enrollment', enrollmentRoutes);
router.use('/scores', scoresRoutes);

// API documentation endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'BrainDB API',
    version: '1.0.0',
    endpoints: [
      { path: '/api/students', description: 'Student management' },
      { path: '/api/classes', description: 'Class management' },
      { path: '/api/attendance', description: 'Attendance tracking' },
      { path: '/api/lectures', description: 'Lecture management' },
      { path: '/api/homework', description: 'Homework management' },
      { path: '/api/exams', description: 'Exam management' },
      { path: '/api/analytics', description: 'Analytics and reports' },
      { path: '/api/enrollment', description: 'Enrollment management' },
      { path: '/api/scores', description: 'Exam scores management' }
    ]
  });
});

module.exports = router;
