/**
 * Lecture Repository
 */
const BaseRepository = require('./base.repository');

class LectureRepository extends BaseRepository {
  constructor() {
    super('lecture');
  }
  
  /**
   * Get lectures by class ID
   * @param {string} classId - Class ID
   * @returns {Promise<Array>} Array of lecture records
   */
  async getByClassId(classId) {
    try {
      const lectures = await this.getAll();
      return lectures.filter(lecture => lecture.class_id === classId);
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get lectures by date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of lecture records
   */
  async getByDateRange(startDate, endDate) {
    try {
      const lectures = await this.getAll();
      
      return lectures.filter(lecture => {
        const lectureDate = lecture.lecture_date instanceof Date 
          ? lecture.lecture_date 
          : new Date(lecture.lecture_date);
          
        return lectureDate >= startDate && lectureDate <= endDate;
      });
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get lectures by topic
   * @param {string} topic - Lecture topic
   * @returns {Promise<Array>} Array of lecture records
   */
  async getByTopic(topic) {
    try {
      const lectures = await this.getAll();
      const lowerTopic = topic.toLowerCase();
      
      return lectures.filter(lecture => 
        lecture.lecture_topic && lecture.lecture_topic.toLowerCase().includes(lowerTopic)
      );
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Get upcoming lectures (from today onwards)
   * @returns {Promise<Array>} Array of upcoming lecture records
   */
  async getUpcoming() {
    try {
      const lectures = await this.getAll();
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      
      return lectures.filter(lecture => {
        const lectureDate = lecture.lecture_date instanceof Date 
          ? lecture.lecture_date 
          : new Date(lecture.lecture_date);
          
        return lectureDate >= today;
      }).sort((a, b) => {
        const dateA = a.lecture_date instanceof Date ? a.lecture_date : new Date(a.lecture_date);
        const dateB = b.lecture_date instanceof Date ? b.lecture_date : new Date(b.lecture_date);
        return dateA - dateB;
      });
    } catch (error) {
      throw error;
    }
  }
}

// Create and export a singleton instance
const lectureRepository = new LectureRepository();
module.exports = lectureRepository;
