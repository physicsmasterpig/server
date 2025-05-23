/**
 * Exams Repository
 */
const BaseRepository = require('./base.repository');

class ExamsRepository extends BaseRepository {
  constructor() {
    super('exams');
  }
  
  /**
   * Get exams by lecture ID
   * @param {string} lectureId - Lecture ID
   * @returns {Promise<Array>} Array of exam records
   */
  async getByLectureId(lectureId) {
    try {
      const exams = await this.getAll();
      return exams.filter(exam => exam.lecture_id === lectureId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get exams by status
   * @param {string} status - Exam status
   * @returns {Promise<Array>} Array of exam records
   */
  async getByStatus(status) {
    try {
      const exams = await this.getAll();
      return exams.filter(exam => exam.status === status);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get upcoming exams
   * @param {Array} lectureIds - Array of lecture IDs to filter by (optional)
   * @returns {Promise<Array>} Array of upcoming exam records
   */
  async getUpcoming(lectureIds = null) {
    try {
      let exams = await this.getAll();
      
      // Filter by lecture IDs if provided
      if (lectureIds && Array.isArray(lectureIds)) {
        exams = exams.filter(exam => lectureIds.includes(exam.lecture_id));
      }
      
      // Filter by status (assuming "upcoming" status exists)
      return exams.filter(exam => exam.status === 'upcoming');
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const examsRepository = new ExamsRepository();
module.exports = examsRepository;
