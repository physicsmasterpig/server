/**
 * Homework Controller
 * Handles HTTP requests related to homework
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class HomeworkController {
  constructor() {
    this.homeworkRepo = repositories.homework;
    this.lectureRepo = repositories.lecture;
    this.studentsRepo = repositories.students;
  }
  
  /**
   * Get all homework
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllHomework(req, res) {
    try {
      const homework = await this.homeworkRepo.getAll();
      
      res.json({
        success: true,
        count: homework.length,
        data: homework
      });
    } catch (error) {
      logger.error('Error getting homework', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve homework',
        error: error.message
      });
    }
  }
  
  /**
   * Get homework by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getHomeworkById(req, res) {
    try {
      const id = req.params.id;
      const homework = await this.homeworkRepo.getById(id);
      
      if (!homework) {
        return res.status(404).json({
          success: false,
          message: `Homework with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: homework
      });
    } catch (error) {
      logger.error('Error getting homework by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve homework',
        error: error.message
      });
    }
  }
  
  /**
   * Create homework
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createHomework(req, res) {
    try {
      const homeworkData = req.body;
      
      // Validate required fields
      const requiredFields = ['lecture_id', 'student_id', 'total_problems'];
      const missingFields = requiredFields.filter(field => !homeworkData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate that lecture exists
      const lecture = await this.lectureRepo.getById(homeworkData.lecture_id);
      if (!lecture) {
        return res.status(400).json({
          success: false,
          message: `Lecture with ID ${homeworkData.lecture_id} not found`
        });
      }
      
      // Validate that student exists
      const student = await this.studentsRepo.getById(homeworkData.student_id);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: `Student with ID ${homeworkData.student_id} not found`
        });
      }
      
      // Set default values
      if (!homeworkData.completed_problems) {
        homeworkData.completed_problems = 0;
      }
      
      const newHomework = await this.homeworkRepo.create(homeworkData);
      
      res.status(201).json({
        success: true,
        message: 'Homework created successfully',
        data: newHomework
      });
    } catch (error) {
      logger.error('Error creating homework', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create homework',
        error: error.message
      });
    }
  }
  
  /**
   * Update homework
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateHomework(req, res) {
    try {
      const id = req.params.id;
      const homeworkData = req.body;
      
      // Check if homework exists
      const existingHomework = await this.homeworkRepo.getById(id);
      if (!existingHomework) {
        return res.status(404).json({
          success: false,
          message: `Homework with ID ${id} not found`
        });
      }
      
      const updatedHomework = await this.homeworkRepo.update(id, homeworkData);
      
      res.json({
        success: true,
        message: 'Homework updated successfully',
        data: updatedHomework
      });
    } catch (error) {
      logger.error('Error updating homework', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update homework',
        error: error.message
      });
    }
  }
  
  /**
   * Delete homework
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteHomework(req, res) {
    try {
      const id = req.params.id;
      
      // Check if homework exists
      const existingHomework = await this.homeworkRepo.getById(id);
      if (!existingHomework) {
        return res.status(404).json({
          success: false,
          message: `Homework with ID ${id} not found`
        });
      }
      
      await this.homeworkRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Homework deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting homework', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete homework',
        error: error.message
      });
    }
  }
  
  /**
   * Get homework by lecture
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getHomeworkByLecture(req, res) {
    try {
      const lectureId = req.params.lectureId;
      
      // Check if lecture exists
      const lecture = await this.lectureRepo.getById(lectureId);
      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: `Lecture with ID ${lectureId} not found`
        });
      }
      
      const homework = await this.homeworkRepo.getByLectureId(lectureId);
      const stats = await this.homeworkRepo.getCompletionStatsByLecture(lectureId);
      
      res.json({
        success: true,
        data: {
          records: homework,
          stats: stats
        }
      });
    } catch (error) {
      logger.error('Error getting homework by lecture', { 
        error: error.message,
        lectureId: req.params.lectureId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve homework',
        error: error.message
      });
    }
  }
}

module.exports = new HomeworkController();
