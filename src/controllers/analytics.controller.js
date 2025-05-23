/**
 * Analytics Controller
 * Handles analytics data processing and retrieval
 */
const logger = require('../services/logger.service');
// Import repositories from centralized index
const repositories = require('../models');

class AnalyticsController {
  constructor() {
    // Use repositories from centralized index
    this.studentsRepo = new repositories.students();
    this.attendanceRepo = new repositories.attendance();
    this.classesRepo = new repositories.classes();
    this.lectureRepo = new repositories.lecture();
    this.homeworkRepo = new repositories.homework();
    this.examsRepo = new repositories.exams();
    this.examProblemsRepo = new repositories.examProblems();
    this.scoresRepo = new repositories.scores();
  }
  
  /**
   * Get overview stats for dashboard
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getOverviewStats(req, res) {
    try {
      const students = await this.studentsRepo.getAll();
      const classes = await this.classesRepo.getAll();
      const attendance = await this.attendanceRepo.getAll();
      
      // Calculate active students
      const activeStudents = students.filter(student => student.status === 'active').length;
      
      // Calculate attendance rate
      let attendanceRate = 0;
      if (attendance.length > 0) {
        const presentCount = attendance.filter(record => record.status === 'present').length;
        attendanceRate = (presentCount / attendance.length) * 100;
      }
      
      // Get homework completion data
      const homework = await this.homeworkRepo.getAll();
      let homeworkCompletion = 0;
      
      if (homework.length > 0) {
        const totalProblems = homework.reduce((sum, hw) => sum + hw.total_problems, 0);
        const completedProblems = homework.reduce((sum, hw) => sum + hw.completed_problems, 0);
        homeworkCompletion = totalProblems > 0 ? (completedProblems / totalProblems) * 100 : 0;
      }
      
  // Get exam score data
      const scores = await this.scoresRepo.getAll();
      const examProblems = await this.examProblemsRepo.getAll();
      
      let avgExamScore = 0;
      if (scores.length > 0 && examProblems.length > 0) {
        // Create a map of exam problem IDs to total score
        const examProblemScores = {};
        examProblems.forEach(problem => {
          examProblemScores[problem.exam_problem_id] = problem.total_score;
        });
        
        // Calculate percentage scores
        let totalPercentage = 0;
        let validScores = 0;
        
        scores.forEach(score => {
          const maxScore = examProblemScores[score.exam_problem_id];
          if (maxScore && maxScore > 0) {
            const percentage = (score.score / maxScore) * 100;
            totalPercentage += percentage;
            validScores++;
          }
        });
        
        avgExamScore = validScores > 0 ? totalPercentage / validScores : 0;
      }
      
      res.json({
        success: true,
        data: {
          totalStudents: students.length,
          activeStudents,
          totalClasses: classes.length,
          attendanceRate: Math.round(attendanceRate * 10) / 10, // Round to 1 decimal
          homeworkCompletion: Math.round(homeworkCompletion * 10) / 10,
          avgExamScore: Math.round(avgExamScore * 10) / 10
        }
      });
    } catch (error) {
      logger.error('Error getting overview stats', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve overview statistics',
        error: error.message
      });
    }
  }
  
  /**
   * Get attendance analytics
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getAttendanceAnalytics(req, res) {
    try {
      const attendance = await this.attendanceRepo.getAll();
      const lectures = await this.lectureRepo.getAll();
      
      // Create a map of lecture IDs to lecture dates
      const lectureDates = {};
      lectures.forEach(lecture => {
        lectureDates[lecture.lecture_id] = lecture.lecture_date;
      });
      
      // Group attendance by date
      const attendanceByDate = {};
      attendance.forEach(record => {
        const lectureDate = lectureDates[record.lecture_id];
        if (lectureDate) {
          const dateStr = new Date(lectureDate).toISOString().split('T')[0];
          
          if (!attendanceByDate[dateStr]) {
            attendanceByDate[dateStr] = {
              present: 0,
              absent: 0,
              late: 0,
              excused: 0,
              total: 0
            };
          }
          
          attendanceByDate[dateStr].total++;
          
          // Increment the appropriate counter
          const status = record.status.toLowerCase();
          if (attendanceByDate[dateStr][status] !== undefined) {
            attendanceByDate[dateStr][status]++;
          }
        }
      });
      
      // Convert to arrays for chart data
      const dates = Object.keys(attendanceByDate).sort();
      const presentRates = dates.map(date => {
        const day = attendanceByDate[date];
        return day.total > 0 ? (day.present / day.total) * 100 : 0;
      });
      
      // Get attendance by day of week
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const attendanceByDay = Array(7).fill(0).map(() => ({ present: 0, total: 0 }));
      
      attendance.forEach(record => {
        const lectureDate = lectureDates[record.lecture_id];
        if (lectureDate) {
          const date = new Date(lectureDate);
          const dayOfWeek = date.getDay();
          
          attendanceByDay[dayOfWeek].total++;
          if (record.status.toLowerCase() === 'present') {
            attendanceByDay[dayOfWeek].present++;
          }
        }
      });
      
      const dayRates = attendanceByDay.map(day => 
        day.total > 0 ? (day.present / day.total) * 100 : 0
      );
      
      // Count status distribution
      const statusCounts = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
      
      attendance.forEach(record => {
        const status = record.status.toLowerCase();
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        }
      });
      
      const totalAttendance = attendance.length;
      const statusDistribution = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status],
        percentage: totalAttendance > 0 ? (statusCounts[status] / totalAttendance) * 100 : 0
      }));
      
      res.json({
        success: true,
        data: {
          attendancePattern: {
            dates,
            presentRates
          },
          attendanceByDay: {
            days: dayNames,
            rates: dayRates
          },
          statusDistribution
        }
      });
    } catch (error) {
      logger.error('Error getting attendance analytics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance analytics',
        error: error.message
      });
    }
  }
    /**
   * Get performance analytics
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  async getPerformanceAnalytics(req, res) {
    try {
      const scores = await this.scoresRepo.getAll();
      const examProblems = await this.examProblemsRepo.getAll();
      
      // For now, return placeholder data
      res.json({
        success: true,
        message: 'API not fully implemented',
        data: {
          gradeDistribution: [
            { grade: 'A', count: 45, percentage: 30 },
            { grade: 'B', count: 60, percentage: 40 },
            { grade: 'C', count: 30, percentage: 20 },
            { grade: 'D', count: 12, percentage: 8 },
            { grade: 'F', count: 3, percentage: 2 }
          ],
          subjectPerformance: [
            { subject: 'Mathematics', average: 85 },
            { subject: 'Science', average: 78 },
            { subject: 'English', average: 82 },
            { subject: 'History', average: 75 }
          ]
        }
      });
    } catch (error) {
      logger.error('Error getting performance analytics', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance analytics',
        error: error.message
      });
    }
  }
}

module.exports = new AnalyticsController();
