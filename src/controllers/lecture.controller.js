/**
 * Lecture Controller
 * Handles HTTP requests related to lectures
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class LectureController {
  constructor() {
    this.lectureRepo = repositories.lecture;
    this.classesRepo = repositories.classes;
    this.attendanceRepo = repositories.attendance;
    this.homeworkRepo = repositories.homework;
  }
  
  /**
   * Get all lectures
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllLectures(req, res) {
    try {
      const lectures = await this.lectureRepo.getAll();
      
      res.json({
        success: true,
        count: lectures.length,
        data: lectures
      });
    } catch (error) {
      logger.error('Error getting lectures', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lectures',
        error: error.message
      });
    }
  }
  
  /**
   * Get lecture by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getLectureById(req, res) {
    try {
      const id = req.params.id;
      const lecture = await this.lectureRepo.getById(id);
      
      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: `Lecture with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: lecture
      });
    } catch (error) {
      logger.error('Error getting lecture by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lecture',
        error: error.message
      });
    }
  }
  
  /**
   * Create lecture
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createLecture(req, res) {
    try {
      const lectureData = req.body;
      
      // Validate required fields
      const requiredFields = ['class_id', 'lecture_date', 'lecture_topic'];
      const missingFields = requiredFields.filter(field => !lectureData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate that class exists
      const classRecord = await this.classesRepo.getById(lectureData.class_id);
      if (!classRecord) {
        return res.status(400).json({
          success: false,
          message: `Class with ID ${lectureData.class_id} not found`
        });
      }
      
      const newLecture = await this.lectureRepo.create(lectureData);
      
      res.status(201).json({
        success: true,
        message: 'Lecture created successfully',
        data: newLecture
      });
    } catch (error) {
      logger.error('Error creating lecture', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create lecture',
        error: error.message
      });
    }
  }
  
  /**
   * Update lecture
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateLecture(req, res) {
    try {
      const id = req.params.id;
      const lectureData = req.body;
      
      // Check if lecture exists
      const existingLecture = await this.lectureRepo.getById(id);
      if (!existingLecture) {
        return res.status(404).json({
          success: false,
          message: `Lecture with ID ${id} not found`
        });
      }
      
      const updatedLecture = await this.lectureRepo.update(id, lectureData);
      
      res.json({
        success: true,
        message: 'Lecture updated successfully',
        data: updatedLecture
      });
    } catch (error) {
      logger.error('Error updating lecture', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update lecture',
        error: error.message
      });
    }
  }
  
  /**
   * Delete lecture
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteLecture(req, res) {
    try {
      const id = req.params.id;
      
      // Check if lecture exists
      const existingLecture = await this.lectureRepo.getById(id);
      if (!existingLecture) {
        return res.status(404).json({
          success: false,
          message: `Lecture with ID ${id} not found`
        });
      }
      
      await this.lectureRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Lecture deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting lecture', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete lecture',
        error: error.message
      });
    }
  }
  
  /**
   * Get lectures by class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getLecturesByClass(req, res) {
    try {
      const classId = req.params.classId;
      
      // Check if class exists
      const classRecord = await this.classesRepo.getById(classId);
      if (!classRecord) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${classId} not found`
        });
      }
      
      const lectures = await this.lectureRepo.getByClassId(classId);
      
      res.json({
        success: true,
        count: lectures.length,
        data: lectures
      });
    } catch (error) {
      logger.error('Error getting lectures by class', { 
        error: error.message,
        classId: req.params.classId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lectures',
        error: error.message
      });
    }
  }
  
  /**
   * Get upcoming lectures
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getUpcomingLectures(req, res) {
    try {
      const lectures = await this.lectureRepo.getUpcoming();
      
      res.json({
        success: true,
        count: lectures.length,
        data: lectures
      });
    } catch (error) {
      logger.error('Error getting upcoming lectures', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve upcoming lectures',
        error: error.message
      });
    }
  }
  
  /**
   * Get lecture attendance
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getLectureAttendance(req, res) {
    try {
      const lectureId = req.params.id;
      
      // Check if lecture exists
      const lecture = await this.lectureRepo.getById(lectureId);
      if (!lecture) {
        return res.status(404).json({
          success: false,
          message: `Lecture with ID ${lectureId} not found`
        });
      }
      
      const attendanceRecords = await this.attendanceRepo.getByLectureId(lectureId);
      const stats = await this.attendanceRepo.calculateLectureAttendanceStats(lectureId);
      
      res.json({
        success: true,
        data: {
          lecture: lecture,
          attendance: attendanceRecords,
          stats: stats
        }
      });
    } catch (error) {
      logger.error('Error getting lecture attendance', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve lecture attendance',
        error: error.message
      });
    }
  }
}

module.exports = new LectureController();
