/**
 * Problems Repository
 */
const BaseRepository = require('./base.repository');

class ProblemsRepository extends BaseRepository {
  constructor() {
    super('problems');
  }
  
  /**
   * Get problems by subject
   * @param {string} subject - Subject area
   * @returns {Promise<Array>} Array of problem records
   */
  async getBySubject(subject) {
    try {
      const problems = await this.getAll();
      return problems.filter(problem => problem.subject === subject);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get problems with valid links
   * @returns {Promise<Array>} Array of problem records with non-empty links
   */
  async getWithLinks() {
    try {
      const problems = await this.getAll();
      return problems.filter(problem => problem.link && problem.link.trim() !== '');
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get count of problems by subject
   * @returns {Promise<Object>} Subject counts (e.g. {math: 10, science: 5})
   */
  async getCountsBySubject() {
    try {
      const problems = await this.getAll();
      const counts = {};
      
      problems.forEach(problem => {
        const subject = problem.subject || 'uncategorized';
        counts[subject] = (counts[subject] || 0) + 1;
      });
      
      return counts;
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const problemsRepository = new ProblemsRepository();
module.exports = problemsRepository;
