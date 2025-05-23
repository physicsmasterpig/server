/**
 * Attendance Controller
 * Handles HTTP requests related to attendance
 */
const repositories = require('../models');
const logger = require('../services/logger.service');

class AttendanceController {
  constructor() {
    this.attendanceRepo = repositories.attendance;
    this.studentsRepo = repositories.students;
    this.lectureRepo = repositories.lecture;
  }
  
  /**
   * Get all attendance records
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAllAttendance(req, res) {
    try {
      const attendance = await this.attendanceRepo.getAll();
      
      res.json({
        success: true,
        count: attendance.length,
        data: attendance
      });
    } catch (error) {
      logger.error('Error getting attendance records', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance records',
        error: error.message
      });
    }
  }
  
  /**
   * Get attendance record by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAttendanceById(req, res) {
    try {
      const id = req.params.id;
      const attendance = await this.attendanceRepo.getById(id);
      
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: `Attendance record with ID ${id} not found`
        });
      }
      
      // Get related student and lecture details
      const student = await this.studentsRepo.getById(attendance.student_id);
      const lecture = await this.lectureRepo.getById(attendance.lecture_id);
      
      res.json({
        success: true,
        data: {
          attendance,
          student,
          lecture
        }
      });
    } catch (error) {
      logger.error('Error getting attendance by ID', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance record',
        error: error.message
      });
    }
  }
  
  /**
   * Create attendance record
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async createAttendance(req, res) {
    try {
      const attendanceData = req.body;
      
      // Validate required fields
      const requiredFields = ['lecture_id', 'student_id', 'status'];
      const missingFields = requiredFields.filter(field => !attendanceData[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`
        });
      }
      
      // Validate that student exists
      const student = await this.studentsRepo.getById(attendanceData.student_id);
      if (!student) {
        return res.status(400).json({
          success: false,
          message: `Student with ID ${attendanceData.student_id} not found`
        });
      }
      
      // Validate that lecture exists
      const lecture = await this.lectureRepo.getById(attendanceData.lecture_id);
      if (!lecture) {
        return res.status(400).json({
          success: false,
          message: `Lecture with ID ${attendanceData.lecture_id} not found`
        });
      }
      
      // Validate status value
      const validStatuses = ['present', 'absent', 'late', 'excused'];
      if (!validStatuses.includes(attendanceData.status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      const newAttendance = await this.attendanceRepo.create(attendanceData);
      
      res.status(201).json({
        success: true,
        message: 'Attendance record created successfully',
        data: newAttendance
      });
    } catch (error) {
      logger.error('Error creating attendance record', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to create attendance record',
        error: error.message
      });
    }
  }
  
  /**
   * Update attendance record
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async updateAttendance(req, res) {
    try {
      const id = req.params.id;
      const attendanceData = req.body;
      
      // Check if attendance record exists
      const existingAttendance = await this.attendanceRepo.getById(id);
      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          message: `Attendance record with ID ${id} not found`
        });
      }
      
      // Validate status if provided
      if (attendanceData.status) {
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        if (!validStatuses.includes(attendanceData.status.toLowerCase())) {
          return res.status(400).json({
            success: false,
            message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
          });
        }
      }
      
      const updatedAttendance = await this.attendanceRepo.update(id, attendanceData);
      
      res.json({
        success: true,
        message: 'Attendance record updated successfully',
        data: updatedAttendance
      });
    } catch (error) {
      logger.error('Error updating attendance record', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to update attendance record',
        error: error.message
      });
    }
  }
  
  /**
   * Delete attendance record
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async deleteAttendance(req, res) {
    try {
      const id = req.params.id;
      
      // Check if attendance record exists
      const existingAttendance = await this.attendanceRepo.getById(id);
      if (!existingAttendance) {
        return res.status(404).json({
          success: false,
          message: `Attendance record with ID ${id} not found`
        });
      }
      
      await this.attendanceRepo.delete(id);
      
      res.json({
        success: true,
        message: 'Attendance record deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting attendance record', { 
        error: error.message,
        id: req.params.id
      });
      res.status(500).json({
        success: false,
        message: 'Failed to delete attendance record',
        error: error.message
      });
    }
  }
  
  /**
   * Get attendance records by lecture
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAttendanceByLecture(req, res) {
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
      
      const attendance = await this.attendanceRepo.getByLectureId(lectureId);
      const stats = await this.attendanceRepo.calculateLectureAttendanceStats(lectureId);
      
      // Get student details for each attendance record
      const attendanceWithStudents = await Promise.all(
        attendance.map(async (record) => {
          const student = await this.studentsRepo.getById(record.student_id);
          return {
            ...record,
            student: student || { name: 'Unknown Student' }
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          lecture,
          records: attendanceWithStudents,
          stats
        }
      });
    } catch (error) {
      logger.error('Error getting attendance by lecture', { 
        error: error.message,
        lectureId: req.params.lectureId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance records',
        error: error.message
      });
    }
  }
  
  /**
   * Get attendance records by student
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAttendanceByStudent(req, res) {
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
      
      const attendance = await this.attendanceRepo.getByStudentId(studentId);
      const stats = await this.attendanceRepo.calculateStudentAttendanceStats(studentId);
      
      // Get lecture details for each attendance record
      const attendanceWithLectures = await Promise.all(
        attendance.map(async (record) => {
          const lecture = await this.lectureRepo.getById(record.lecture_id);
          return {
            ...record,
            lecture: lecture || { lecture_topic: 'Unknown Lecture' }
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          student,
          records: attendanceWithLectures,
          stats
        }
      });
    } catch (error) {
      logger.error('Error getting attendance by student', { 
        error: error.message,
        studentId: req.params.studentId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance records',
        error: error.message
      });
    }
  }
}

module.exports = new AttendanceController();
