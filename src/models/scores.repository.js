/**
 * Scores Repository
 */
const BaseRepository = require('./base.repository');

class ScoresRepository extends BaseRepository {
  constructor() {
    super('scores');
  }
  
  /**
   * Get scores by student ID
   * @param {string} studentId - Student ID
   * @returns {Promise<Array>} Array of score records
   */
  async getByStudentId(studentId) {
    try {
      const scores = await this.getAll();
      return scores.filter(score => score.student_id === studentId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get scores by exam problem ID
   * @param {string} examProblemId - Exam Problem ID
   * @returns {Promise<Array>} Array of score records
   */
  async getByExamProblemId(examProblemId) {
    try {
      const scores = await this.getAll();
      return scores.filter(score => score.exam_problem_id === examProblemId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get scores by grader
   * @param {string} grader - Grader name or ID
   * @returns {Promise<Array>} Array of score records
   */
  async getByGrader(grader) {
    try {
      const scores = await this.getAll();
      return scores.filter(score => score.grader === grader);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get scores by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of score records
   */
  async getByGradedDateRange(startDate, endDate) {
    try {
      const scores = await this.getAll();
      
      return scores.filter(score => {
        const gradedDate = score.graded_date instanceof Date 
          ? score.graded_date 
          : new Date(score.graded_date);
          
        return gradedDate >= startDate && gradedDate <= endDate;
      });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate average score for a student
   * @param {string} studentId - Student ID
   * @returns {Promise<number>} Average score
   */
  async getStudentAverageScore(studentId) {
    try {
      const scores = await this.getByStudentId(studentId);
      
      if (scores.length === 0) {
        return 0;
      }
      
      const sum = scores.reduce((acc, score) => acc + (score.score || 0), 0);
      return sum / scores.length;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate average score for an exam problem
   * @param {string} examProblemId - Exam Problem ID
   * @returns {Promise<number>} Average score
   */
  async getExamProblemAverageScore(examProblemId) {
    try {
      const scores = await this.getByExamProblemId(examProblemId);
      
      if (scores.length === 0) {
        return 0;
      }
      
      const sum = scores.reduce((acc, score) => acc + (score.score || 0), 0);
      return sum / scores.length;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const scoresRepository = new ScoresRepository();
module.exports = scoresRepository;
