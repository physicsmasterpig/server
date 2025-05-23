/**
 * Scores Controller
 * Handles HTTP requests related to exam scores
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class ScoresController {
  constructor() {
    this.scoresRepo = repositories.scores;
    this.studentsRepo = repositories.students;
    this.examProblemsRepo = repositories.examProblems;
  }
  
  /**
   * Get all scores
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllScores(req, res) {
    try {
      const scores = await this.scoresRepo.getAll();
      
      res.json({
        success: true,
        count: scores.length,
        data: scores
      });
    } catch (error) {
      logger.error('Error getting scores', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scores',
        error: error.message
      });
    }
  }
  
  /**
   * Get score by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getScoreById(req, res) {
    try {
      const id = req.params.id;
      const score = await this.scoresRepo.getById(id);
      
      if (!score) {
        return res.status(404).json({
          success: false,
          message: `Score with ID ${id} not found`
        });
      }
      
      // Get related student and exam problem details
      const student = await this.studentsRepo.getById(score.student_id);
      const examProblem = await this.examProblemsRepo.getById(score.exam_problem_id);
      
      res.json({
        success: true,
        data: {
          score,
          student: student || { name: 'Unknown Student' },
          examProblem: examProblem || { problem_no: 'Unknown Problem' }
        }
      });
    } catch (error) {
      logger.error('Error getting score by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve score',
        error: error.message
      });
    }
  }
  
  /**
   * Create score
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createScore(req, res) {
    try {
      const scoreData = req.body;
      
      // Validate required fields
      const requiredFields = ['student_id', 'exam_problem_id', 'score'];
      const missingFields = requiredFields.filter(field => 
        scoreData[field] === undefined || scoreData[field] === null
      );
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate that student exists
      const student = await this.studentsRepo.getById(scoreData.student_id);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: `Student with ID ${scoreData.student_id} not found`
        });
      }
      
      // Validate that exam problem exists
      const examProblem = await this.examProblemsRepo.getById(scoreData.exam_problem_id);
      if (!examProblem) {
        return res.status(400).json({
          success: false,
          message: `Exam Problem with ID ${scoreData.exam_problem_id} not found`
        });
      }
      
      // Validate score value
      if (isNaN(scoreData.score) || scoreData.score < 0 || scoreData.score > examProblem.total_score) {
        return res.status(400).json({
          success: false,
          message: `Invalid score value. Must be between 0 and ${examProblem.total_score}`
        });
      }
      
      // Set default values
      if (!scoreData.graded_date) {
        scoreData.graded_date = new Date();
      }
      
      const newScore = await this.scoresRepo.create(scoreData);
      
      res.status(201).json({
        success: true,
        message: 'Score created successfully',
        data: newScore
      });
    } catch (error) {
      logger.error('Error creating score', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create score',
        error: error.message
      });
    }
  }
  
  /**
   * Update score
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateScore(req, res) {
    try {
      const id = req.params.id;
      const scoreData = req.body;
      
      // Check if score exists
      const existingScore = await this.scoresRepo.getById(id);
      if (!existingScore) {
        return res.status(404).json({
          success: false,
          message: `Score with ID ${id} not found`
        });
      }
      
      // Validate score value if provided
      if (scoreData.score !== undefined) {
        const examProblem = await this.examProblemsRepo.getById(existingScore.exam_problem_id);
        
        if (examProblem && (isNaN(scoreData.score) || scoreData.score < 0 || scoreData.score > examProblem.total_score)) {
          return res.status(400).json({
            success: false,
            message: `Invalid score value. Must be between 0 and ${examProblem.total_score}`
          });
        }
      }
      
      const updatedScore = await this.scoresRepo.update(id, scoreData);
      
      res.json({
        success: true,
        message: 'Score updated successfully',
        data: updatedScore
      });
    } catch (error) {
      logger.error('Error updating score', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update score',
        error: error.message
      });
    }
  }
  
  /**
   * Delete score
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteScore(req, res) {
    try {
      const id = req.params.id;
      
      // Check if score exists
      const existingScore = await this.scoresRepo.getById(id);
      if (!existingScore) {
        return res.status(404).json({
          success: false,
          message: `Score with ID ${id} not found`
        });
      }
      
      await this.scoresRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Score deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting score', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete score',
        error: error.message
      });
    }
  }
  
  /**
   * Get scores by student ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getScoresByStudent(req, res) {
    try {
      const studentId = req.params.studentId;
      
      // Check if student exists
      const student = await this.studentsRepo.getById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${studentId} not found`
        });
      }
      
      const scores = await this.scoresRepo.getByStudentId(studentId);
      const averageScore = await this.scoresRepo.calculateStudentAverage(studentId);
      
      // Get exam problem details for each score
      const scoresWithDetails = await Promise.all(
        scores.map(async (score) => {
          const examProblem = await this.examProblemsRepo.getById(score.exam_problem_id);
          return {
            ...score,
            examProblem: examProblem || { problem_no: 'Unknown Problem' }
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          student,
          scores: scoresWithDetails,
          stats: {
            averageScore,
            totalScores: scores.length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting scores by student', { 
        error: error.message,
        studentId: req.params.studentId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scores',
        error: error.message
      });
    }
  }
  
  /**
   * Get scores by exam problem ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getScoresByExamProblem(req, res) {
    try {
      const examProblemId = req.params.examProblemId;
      
      // Check if exam problem exists
      const examProblem = await this.examProblemsRepo.getById(examProblemId);
      if (!examProblem) {
        return res.status(404).json({
          success: false,
          message: `Exam Problem with ID ${examProblemId} not found`
        });
      }
      
      const scores = await this.scoresRepo.getByExamProblemId(examProblemId);
      const averageScore = await this.scoresRepo.calculateAverageScore(examProblemId);
      
      // Get student details for each score
      const scoresWithStudents = await Promise.all(
        scores.map(async (score) => {
          const student = await this.studentsRepo.getById(score.student_id);
          return {
            ...score,
            student: student || { name: 'Unknown Student' }
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          examProblem,
          scores: scoresWithStudents,
          stats: {
            averageScore,
            totalScores: scores.length,
            possibleScore: examProblem.total_score,
            totalPointsAwarded: scores.reduce((sum, score) => sum + score.score, 0)
          }
        }
      });
    } catch (error) {
      logger.error('Error getting scores by exam problem', { 
        error: error.message,
        examProblemId: req.params.examProblemId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve scores',
        error: error.message
      });
    }
  }
}

module.exports = new ScoresController();
