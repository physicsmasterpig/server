/**
 * Students Controller
 * Handles HTTP requests related to students
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class StudentsController {
  constructor() {
    // Use imported repositories
    this.studentsRepo = repositories.students;
    this.enrollmentRepo = repositories.enrollment;
    this.attendanceRepo = repositories.attendance;
    this.homeworkRepo = repositories.homework;
    this.scoresRepo = repositories.scores;
  }
  
  /**
   * Get all students
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllStudents(req, res) {
    try {
      // Parse query parameters for filtering
      const filters = req.query;
      let students = await this.studentsRepo.getAll();
      
      // Apply filters if any
      if (Object.keys(filters).length > 0) {
        students = students.filter(student => {
          return Object.keys(filters).every(key => {
            // Skip if student doesn't have the key
            if (!student[key]) return false;
            
            // Case-insensitive string comparison
            const filterValue = filters[key].toString().toLowerCase();
            const studentValue = student[key].toString().toLowerCase();
            
            return studentValue.includes(filterValue);
          });
        });
      }
      
      res.json({
        success: true,
        count: students.length,
        data: students
      });
    } catch (error) {
      logger.error('Error getting students', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students',
        error: error.message
      });
    }
  }
  
  /**
   * Get a student by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStudentById(req, res) {
    try {
      const id = req.params.id;
      const student = await this.studentsRepo.getById(id);
      
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found`
        });
      }
      
      res.json({
        success: true,
        data: student
      });
    } catch (error) {
      logger.error('Error getting student by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student',
        error: error.message
      });
    }
  }
  
  /**
   * Create a new student
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createStudent(req, res) {
    try {
      const studentData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'school', 'generation'];
      const missingFields = requiredFields.filter(field => !studentData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Add default values
      if (!studentData.enrollment_date) {
        studentData.enrollment_date = new Date();
      }
      
      if (!studentData.status) {
        studentData.status = 'active';
      }
      
      const newStudent = await this.studentsRepo.create(studentData);
      
      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: newStudent
      });
    } catch (error) {
      logger.error('Error creating student', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create student',
        error: error.message
      });
    }
  }
  
  /**
   * Update a student
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateStudent(req, res) {
    try {
      const id = req.params.id;
      const studentData = req.body;
      
      // Check if student exists
      const existingStudent = await this.studentsRepo.getById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found`
        });
      }
      
      const updatedStudent = await this.studentsRepo.update(id, studentData);
      
      res.json({
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent
      });
    } catch (error) {
      logger.error('Error updating student', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update student',
        error: error.message
      });
    }
  }
  
  /**
   * Delete a student
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteStudent(req, res) {
    try {
      const id = req.params.id;
      
      // Check if student exists
      const existingStudent = await this.studentsRepo.getById(id);
      if (!existingStudent) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${id} not found`
        });
      }
      
      await this.studentsRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting student', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete student',
        error: error.message
      });
    }
  }
  
  /**
   * Get student attendance records
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStudentAttendance(req, res) {
    try {
      const studentId = req.params.id;
      
      // Check if student exists
      const student = await this.studentsRepo.getById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${studentId} not found`
        });
      }
      
      // Get attendance records for the student
      const attendanceRecords = await this.attendanceRepo.getByStudentId(studentId);
      const stats = await this.attendanceRepo.calculateStudentAttendanceStats(studentId);
      
      res.json({
        success: true,
        data: {
          records: attendanceRecords,
          stats: stats
        }
      });
    } catch (error) {
      logger.error('Error getting student attendance', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student attendance',
        error: error.message
      });
    }
  }
  
  /**
   * Get student homework records
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStudentHomework(req, res) {
    try {
      const studentId = req.params.id;
      
      // Check if student exists
      const student = await this.studentsRepo.getById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${studentId} not found`
        });
      }
      
      // Get homework records for the student
      const homeworkRecords = await this.homeworkRepo.getByStudentId(studentId);
      const completionRate = await this.homeworkRepo.getStudentCompletionRate(studentId);
      
      res.json({
        success: true,
        data: {
          records: homeworkRecords,
          stats: {
            completionRate: completionRate,
            totalAssigned: homeworkRecords.length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting student homework', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student homework',
        error: error.message
      });
    }
  }
  
  /**
   * Get student exam scores
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStudentScores(req, res) {
    try {
      const studentId = req.params.id;
      
      // Check if student exists
      const student = await this.studentsRepo.getById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${studentId} not found`
        });
      }
      
      // Get score records for the student
      const scoreRecords = await this.scoresRepo.getByStudentId(studentId);
      const averageScore = await this.scoresRepo.calculateStudentAverage(studentId);
      
      res.json({
        success: true,
        data: {
          records: scoreRecords,
          stats: {
            averageScore: averageScore,
            totalExams: scoreRecords.length
          }
        }
      });
    } catch (error) {
      logger.error('Error getting student scores', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student scores',
        error: error.message
      });
    }
  }
  
  /**
   * Get student enrollments
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getStudentEnrollments(req, res) {
    try {
      const studentId = req.params.id;
      
      // Check if student exists
      const student = await this.studentsRepo.getById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${studentId} not found`
        });
      }
      
      // Get enrollment records for the student
      const enrollmentRecords = await this.enrollmentRepo.getByStudentId(studentId);
      
      // Get class details for each enrollment
      const classes = [];
      for (const enrollment of enrollmentRecords) {
        const classDetails = await repositories.classes.getById(enrollment.class_id);
        if (classDetails) {
          classes.push({
            ...classDetails,
            enrollment_date: enrollment.enrollment_date,
            enrollment_id: enrollment.enrollment_id
          });
        }
      }
      
      res.json({
        success: true,
        data: {
          enrollments: enrollmentRecords,
          classes: classes
        }
      });
    } catch (error) {
      logger.error('Error getting student enrollments', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve student enrollments',
        error: error.message
      });
    }
  }
}

module.exports = new StudentsController();
