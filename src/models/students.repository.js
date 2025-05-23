/**
 * Students Repository
 */
const BaseRepository = require('./base.repository');

class StudentsRepository extends BaseRepository {
  constructor() {
    super('students');
  }
  
  /**
   * Search students by name
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of matching student records
   */
  async search(query) {
    try {
      const students = await this.getAll();
      const lowerQuery = query.toLowerCase();
      
      return students.filter(student => 
        student.name && student.name.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get students by school
   * @param {string} school - School name
   * @returns {Promise<Array>} Array of student records
   */
  async getBySchool(school) {
    try {
      const students = await this.getAll();
      return students.filter(student => student.school === school);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get students by generation
   * @param {string} generation - Generation
   * @returns {Promise<Array>} Array of student records
   */
  async getByGeneration(generation) {
    try {
      const students = await this.getAll();
      return students.filter(student => student.generation === generation);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get students by status
   * @param {string} status - Student status (e.g., 'active', 'inactive')
   * @returns {Promise<Array>} Array of student records
   */
  async getByStatus(status) {
    try {
      const students = await this.getAll();
      return students.filter(student => student.status === status);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get active students count
   * @returns {Promise<number>} Count of active students
   */
  async getActiveCount() {
    try {
      const students = await this.getAll();
      return students.filter(student => student.status === 'active').length;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get students enrolled after a specific date
   * @param {Date} date - Enrollment date threshold
   * @returns {Promise<Array>} Array of student records
   */
  async getEnrolledAfter(date) {
    try {
      const students = await this.getAll();
      
      return students.filter(student => {
        const enrollmentDate = student.enrollment_date instanceof Date 
          ? student.enrollment_date 
          : new Date(student.enrollment_date);
          
        return enrollmentDate >= date;
      });
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const studentsRepository = new StudentsRepository();
module.exports = studentsRepository;
