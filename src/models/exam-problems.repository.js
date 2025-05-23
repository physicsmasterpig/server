/**
 * ExamProblems Repository
 */
const BaseRepository = require('./base.repository');

class ExamProblemsRepository extends BaseRepository {
  constructor() {
    super('examProblems');
  }
  
  /**
   * Get exam problems by exam ID
   * @param {string} examId - Exam ID
   * @returns {Promise<Array>} Array of exam problem records
   */
  async getByExamId(examId) {
    try {
      const examProblems = await this.getAll();
      return examProblems.filter(problem => problem.exam_id === examId)
        .sort((a, b) => a.problem_no - b.problem_no); // Sort by problem number
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get exam problems by problem ID
   * @param {string} problemId - Problem ID
   * @returns {Promise<Array>} Array of exam problem records
   */
  async getByProblemId(problemId) {
    try {
      const examProblems = await this.getAll();
      return examProblems.filter(problem => problem.problem_id === problemId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate total points for an exam
   * @param {string} examId - Exam ID
   * @returns {Promise<number>} Total points
   */
  async getTotalPointsByExam(examId) {
    try {
      const examProblems = await this.getByExamId(examId);
      
      if (examProblems.length === 0) {
        return 0;
      }
      
      return examProblems.reduce((total, problem) => total + (problem.total_score || 0), 0);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Count problems by exam ID
   * @param {string} examId - Exam ID
   * @returns {Promise<number>} Number of problems
   */
  async getCountByExam(examId) {
    try {
      const examProblems = await this.getByExamId(examId);
      return examProblems.length;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const examProblemsRepository = new ExamProblemsRepository();
module.exports = examProblemsRepository;
