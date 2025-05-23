/**
 * Classes Controller
 * Handles HTTP requests related to classes
 */
const ClassesRepository = require('../models/classes.repository');
const logger = require('../services/logger.service');

class ClassesController {
  constructor() {
    this.repository = new ClassesRepository();
  }
  
  /**
   * Get all classes
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllClasses(req, res) {
    try {
      // Parse query parameters for filtering
      const filters = req.query;
      let classes = await this.repository.getAll();
      
      // Apply filters if any
      if (Object.keys(filters).length > 0) {
        classes = classes.filter(classItem => {
          return Object.keys(filters).every(key => {
            // Skip if class doesn't have the key
            if (!classItem[key]) return false;
            
            // Case-insensitive string comparison
            const filterValue = filters[key].toString().toLowerCase();
            const classValue = classItem[key].toString().toLowerCase();
            
            return classValue.includes(filterValue);
          });
        });
      }
      
      res.json({
        success: true,
        count: classes.length,
        data: classes
      });
    } catch (error) {
      logger.error('Error getting classes', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve classes',
        error: error.message
      });
    }
  }
  
  /**
   * Get a class by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getClassById(req, res) {
    try {
      const id = req.params.id;
      const classItem = await this.repository.getById(id);
      
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: classItem
      });
    } catch (error) {
      logger.error('Error getting class by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve class',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createClass(req, res) {
    try {
      const classData = req.body;
      
      // Validate required fields
      const requiredFields = ['school', 'year', 'semester', 'generation'];
      const missingFields = requiredFields.filter(field => !classData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Add default values
      if (!classData.status) {
        classData.status = 'active';
      }
      
      const newClass = await this.repository.create(classData);
      
      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: newClass
      });
    } catch (error) {
      logger.error('Error creating class', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create class',
        error: error.message
      });
    }
  }
  
  /**
   * Update a class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateClass(req, res) {
    try {
      const id = req.params.id;
      const classData = req.body;
      
      // Check if class exists
      const existingClass = await this.repository.getById(id);
      if (!existingClass) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${id} not found`
        });
      }
      
      const updatedClass = await this.repository.update(id, classData);
      
      res.json({
        success: true,
        message: 'Class updated successfully',
        data: updatedClass
      });
    } catch (error) {
      logger.error('Error updating class', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update class',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteClass(req, res) {
    try {
      const id = req.params.id;
      
      // Check if class exists
      const existingClass = await this.repository.getById(id);
      if (!existingClass) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${id} not found`
        });
      }
      
      await this.repository.delete(id);
      
      res.json({
        success: true,
        message: 'Class deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting class', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete class',
        error: error.message
      });
    }
  }
  
  /**
   * Get students enrolled in a class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getClassStudents(req, res) {
    try {
      const classId = req.params.id;
      
      // Check if class exists
      const classItem = await this.repository.getById(classId);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${classId} not found`
        });
      }
      
      // This would ideally be done with an EnrollmentRepository
      // For now, we'll return a placeholder
      res.json({
        success: true,
        message: 'API not fully implemented',
        data: []
      });
    } catch (error) {
      logger.error('Error getting class students', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve class students',
        error: error.message
      });
    }
  }
  
  /**
   * Get lectures for a class
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getClassLectures(req, res) {
    try {
      const classId = req.params.id;
      
      // Check if class exists
      const classItem = await this.repository.getById(classId);
      if (!classItem) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${classId} not found`
        });
      }
      
      // This would ideally be done with a LectureRepository
      // For now, we'll return a placeholder
      res.json({
        success: true,
        message: 'API not fully implemented',
        data: []
      });
    } catch (error) {
      logger.error('Error getting class lectures', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve class lectures',
        error: error.message
      });
    }
  }
}

module.exports = new ClassesController();
