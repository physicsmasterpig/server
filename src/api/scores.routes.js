/**
 * Scores Routes
 */
const express = require('express');
const scoresController = require('../controllers/scores.controller');
const router = express.Router();

// Get all scores
router.get('/', scoresController.getAllScores.bind(scoresController));

// Get scores by student
router.get('/student/:studentId', scoresController.getScoresByStudent.bind(scoresController));

// Get scores by exam problem
router.get('/exam-problem/:examProblemId', scoresController.getScoresByExamProblem.bind(scoresController));

// Get score by ID
router.get('/:id', scoresController.getScoreById.bind(scoresController));

// Create new score
router.post('/', scoresController.createScore.bind(scoresController));

// Update score
router.put('/:id', scoresController.updateScore.bind(scoresController));

// Delete score
router.delete('/:id', scoresController.deleteScore.bind(scoresController));

module.exports = router;
