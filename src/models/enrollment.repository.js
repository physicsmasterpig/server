/**
 * Enrollment Repository
 */
const BaseRepository = require('./base.repository');

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super('enrollment');
  }
  
  /**
   * Get enrollments by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Array of enrollment records
   */
  async getByStudentId(studentId) {
    try {
      const enrollments = await this.getAll();
      return enrollments.filter(enrollment => enrollment.student_id === studentId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get enrollments by class ID
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} Array of enrollment records
   */
  async getByClassId(classId) {
    try {
      const enrollments = await this.getAll();
      return enrollments.filter(enrollment => enrollment.class_id === classId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Check if a student is enrolled in a specific class
   * @param {string} studentId - Student ID
   * @param {string} classId - Class ID
   * @returns {Promise<boolean>} True if enrolled, false otherwise
   */
  async isEnrolled(studentId, classId) {
    try {
      const enrollments = await this.getAll();
      return enrollments.some(enrollment => 
        enrollment.student_id === studentId && 
        enrollment.class_id === classId
      );
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const enrollmentRepository = new EnrollmentRepository();
module.exports = enrollmentRepository;
