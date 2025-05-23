/**
 * Classes Repository
 */
const BaseRepository = require('./base.repository');

class ClassesRepository extends BaseRepository {
  constructor() {
    super('classes');
  }
  
  /**
   * Get classes by school
   * @param {string} school - School name
   * @returns {Promise<Array>} Array of class records
   */
  async getBySchool(school) {
    try {
      const classes = await this.getAll();
      return classes.filter(cls => cls.school === school);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get classes by year and semester
   * @param {string} year - Academic year
   * @param {string} semester - Semester
   * @returns {Promise<Array>} Array of class records
   */
  async getByYearAndSemester(year, semester) {
    try {
      const classes = await this.getAll();
      return classes.filter(cls => cls.year === year && cls.semester === semester);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get classes by generation
   * @param {string} generation - Generation
   * @returns {Promise<Array>} Array of class records
   */
  async getByGeneration(generation) {
    try {
      const classes = await this.getAll();
      return classes.filter(cls => cls.generation === generation);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get classes by status
   * @param {string} status - Class status
   * @returns {Promise<Array>} Array of class records
   */
  async getByStatus(status) {
    try {
      const classes = await this.getAll();
      return classes.filter(cls => cls.status === status);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get active classes
   * @returns {Promise<Array>} Array of active class records
   */
  async getActive() {
    try {
      return this.getByStatus('active');
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const classesRepository = new ClassesRepository();
module.exports = classesRepository;
