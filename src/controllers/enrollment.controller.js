/**
 * Enrollment Controller
 * Handles HTTP requests related to student enrollments
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class EnrollmentController {
  constructor() {
    this.enrollmentRepo = repositories.enrollment;
    this.studentsRepo = repositories.students;
    this.classesRepo = repositories.classes;
  }
  
  /**
   * Get all enrollments
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllEnrollments(req, res) {
    try {
      const enrollments = await this.enrollmentRepo.getAll();
      
      res.json({
        success: true,
        count: enrollments.length,
        data: enrollments
      });
    } catch (error) {
      logger.error('Error getting enrollments', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve enrollments',
        error: error.message
      });
    }
  }
  
  /**
   * Get enrollment by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getEnrollmentById(req, res) {
    try {
      const id = req.params.id;
      const enrollment = await this.enrollmentRepo.getById(id);
      
      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found`
        });
      }
      
      // Get related student and class details
      const student = await this.studentsRepo.getById(enrollment.student_id);
      const classDetails = await this.classesRepo.getById(enrollment.class_id);
      
      res.json({
        success: true,
        data: {
          enrollment,
          student,
          class: classDetails
        }
      });
    } catch (error) {
      logger.error('Error getting enrollment by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve enrollment',
        error: error.message
      });
    }
  }
  
  /**
   * Create enrollment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createEnrollment(req, res) {
    try {
      const enrollmentData = req.body;
      
      // Validate required fields
      const requiredFields = ['student_id', 'class_id'];
      const missingFields = requiredFields.filter(field => !enrollmentData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate that student exists
      const student = await this.studentsRepo.getById(enrollmentData.student_id);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: `Student with ID ${enrollmentData.student_id} not found`
        });
      }
      
      // Validate that class exists
      const classDetails = await this.classesRepo.getById(enrollmentData.class_id);
      if (!classDetails) {
        return res.status(400).json({
          success: false,
          message: `Class with ID ${enrollmentData.class_id} not found`
        });
      }
      
      // Check if student is already enrolled in the class
      const isEnrolled = await this.enrollmentRepo.isEnrolled(
        enrollmentData.student_id, 
        enrollmentData.class_id
      );
      
      if (isEnrolled) {
        return res.status(400).json({
          success: false,
          message: `Student is already enrolled in this class`
        });
      }
      
      // Set default values
      if (!enrollmentData.enrollment_date) {
        enrollmentData.enrollment_date = new Date();
      }
      
      const newEnrollment = await this.enrollmentRepo.create(enrollmentData);
      
      res.status(201).json({
        success: true,
        message: 'Enrollment created successfully',
        data: newEnrollment
      });
    } catch (error) {
      logger.error('Error creating enrollment', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create enrollment',
        error: error.message
      });
    }
  }
  
  /**
   * Update enrollment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateEnrollment(req, res) {
    try {
      const id = req.params.id;
      const enrollmentData = req.body;
      
      // Check if enrollment exists
      const existingEnrollment = await this.enrollmentRepo.getById(id);
      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found`
        });
      }
      
      // If changing student or class, validate they exist
      if (enrollmentData.student_id) {
        const student = await this.studentsRepo.getById(enrollmentData.student_id);
        if (!student) {
          return res.status(400).json({
            success: false,
            message: `Student with ID ${enrollmentData.student_id} not found`
          });
        }
      }
      
      if (enrollmentData.class_id) {
        const classDetails = await this.classesRepo.getById(enrollmentData.class_id);
        if (!classDetails) {
          return res.status(400).json({
            success: false,
            message: `Class with ID ${enrollmentData.class_id} not found`
          });
        }
      }
      
      const updatedEnrollment = await this.enrollmentRepo.update(id, enrollmentData);
      
      res.json({
        success: true,
        message: 'Enrollment updated successfully',
        data: updatedEnrollment
      });
    } catch (error) {
      logger.error('Error updating enrollment', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update enrollment',
        error: error.message
      });
    }
  }
  
  /**
   * Delete enrollment
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteEnrollment(req, res) {
    try {
      const id = req.params.id;
      
      // Check if enrollment exists
      const existingEnrollment = await this.enrollmentRepo.getById(id);
      if (!existingEnrollment) {
        return res.status(404).json({
          success: false,
          message: `Enrollment with ID ${id} not found`
        });
      }
      
      await this.enrollmentRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Enrollment deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting enrollment', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete enrollment',
        error: error.message
      });
    }
  }
  
  /**
   * Get enrollments by class ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getEnrollmentsByClass(req, res) {
    try {
      const classId = req.params.classId;
      
      // Check if class exists
      const classDetails = await this.classesRepo.getById(classId);
      if (!classDetails) {
        return res.status(404).json({
          success: false,
          message: `Class with ID ${classId} not found`
        });
      }
      
      const enrollments = await this.enrollmentRepo.getByClassId(classId);
      
      // Get student details for each enrollment
      const enrollmentWithStudents = await Promise.all(
        enrollments.map(async (enrollment) => {
          const student = await this.studentsRepo.getById(enrollment.student_id);
          return {
            ...enrollment,
            student: student || { name: 'Unknown Student' }
          };
        })
      );
      
      res.json({
        success: true,
        count: enrollments.length,
        data: enrollmentWithStudents
      });
    } catch (error) {
      logger.error('Error getting enrollments by class', { 
        error: error.message,
        classId: req.params.classId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve enrollments',
        error: error.message
      });
    }
  }
}

module.exports = new EnrollmentController();
