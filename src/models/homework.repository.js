/**
 * Homework Repository
 */
const BaseRepository = require('./base.repository');

class HomeworkRepository extends BaseRepository {
  constructor() {
    super('homework');
  }
  
  /**
   * Get homework by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Array of homework records
   */
  async getByStudentId(studentId) {
    try {
      const homework = await this.getAll();
      return homework.filter(hw => hw.student_id === studentId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get homework by lecture ID
   * @param {string} lectureId - Lecture ID
   * @returns {Promise<Array>} Array of homework records
   */
  async getByLectureId(lectureId) {
    try {
      const homework = await this.getAll();
      return homework.filter(hw => hw.lecture_id === lectureId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get homework completion stats by lecture
   * @param {string} lectureId - Lecture ID
   * @returns {Promise<Object>} Homework statistics
   */
  async getCompletionStatsByLecture(lectureId) {
    try {
      const homeworkList = await this.getByLectureId(lectureId);
      
      // Initialize stats
      const stats = {
        totalAssigned: homeworkList.length,
        completed: 0,
        partiallyCompleted: 0,
        notStarted: 0,
        completionRate: 0,
        averageCompletedProblems: 0
      };
      
      if (homeworkList.length === 0) {
        return stats;
      }
      
      // Calculate stats
      let totalCompletedProblems = 0;
      
      homeworkList.forEach(hw => {
        totalCompletedProblems += hw.completed_problems || 0;
        
        if (hw.completed_problems === 0 || hw.completed_problems === null) {
          stats.notStarted++;
        } else if (hw.completed_problems < hw.total_problems) {
          stats.partiallyCompleted++;
        } else {
          stats.completed++;
        }
      });
      
      stats.completionRate = stats.completed / stats.totalAssigned;
      stats.averageCompletedProblems = totalCompletedProblems / stats.totalAssigned;
      
      return stats;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get homework by classification
   * @param {string} classification - Homework classification
   * @returns {Promise<Array>} Array of homework records
   */
  async getByClassification(classification) {
    try {
      const homework = await this.getAll();
      return homework.filter(hw => hw.classification === classification);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate homework completion rate for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<number>} Completion rate (0-1)
   */
  async getStudentCompletionRate(studentId) {
    try {
      const homeworkList = await this.getByStudentId(studentId);
      
      if (homeworkList.length === 0) {
        return 0;
      }
      
      let totalProblems = 0;
      let completedProblems = 0;
      
      homeworkList.forEach(hw => {
        totalProblems += hw.total_problems || 0;
        completedProblems += hw.completed_problems || 0;
      });
      
      return totalProblems > 0 ? completedProblems / totalProblems : 0;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const homeworkRepository = new HomeworkRepository();
module.exports = homeworkRepository;
