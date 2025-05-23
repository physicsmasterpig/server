/**
 * Analytics Routes
 * API endpoints for analytics and reporting
 */
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');

// Get overview stats for dashboard
router.get('/overview', analyticsController.getOverviewStats.bind(analyticsController));

// Get attendance analytics
router.get('/attendance', analyticsController.getAttendanceAnalytics.bind(analyticsController));

// Get performance analytics
router.get('/performance', analyticsController.getPerformanceAnalytics.bind(analyticsController));

module.exports = router;
