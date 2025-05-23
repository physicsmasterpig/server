/**
 * Attendance Repository
 */
const BaseRepository = require('./base.repository');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super('attendance');
  }
  
  /**
   * Get attendance records for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Array of attendance records
   */
  async getByStudentId(studentId) {
    try {
      const records = await this.getAll();
      return records.filter(record => record.student_id === studentId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get attendance records for a lecture
   * @param {string} lectureId - Lecture ID
   * @returns {Promise<Array>} Array of attendance records
   */
  async getByLectureId(lectureId) {
    try {
      const records = await this.getAll();
      return records.filter(record => record.lecture_id === lectureId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get attendance records by status
   * @param {string} status - Attendance status
   * @returns {Promise<Array>} Array of attendance records
   */
  async getByStatus(status) {
    try {
      const records = await this.getAll();
      return records.filter(record => record.status === status);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate attendance rate for a lecture
   * @param {string} lectureId - Lecture ID
   * @returns {Promise<Object>} Attendance statistics
   */
  async calculateLectureAttendanceStats(lectureId) {
    try {
      const records = await this.getByLectureId(lectureId);
      
      if (!records.length) {
        return {
          totalStudents: 0,
          present: 0,
          absent: 0,
          attendanceRate: 0
        };
      }
      
      const stats = {
        totalStudents: records.length,
        present: 0,
        absent: 0,
        attendanceRate: 0
      };
      
      records.forEach(record => {
        if (record.status === 'present') {
          stats.present++;
        } else if (record.status === 'absent') {
          stats.absent++;
        }
      });
      
      stats.attendanceRate = stats.present / stats.totalStudents;
      
      return stats;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate attendance rate for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<number>} Attendance rate (0-100)
   */
  async calculateStudentAttendanceRate(studentId) {
    try {
      const records = await this.getByStudentId(studentId);
      
      if (!records.length) {
        return 0;
      }
      
      const presentCount = records.filter(record => record.status === 'present').length;
      
      return (presentCount / records.length) * 100;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const attendanceRepository = new AttendanceRepository();
module.exports = attendanceRepository;
