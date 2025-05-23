/**
 * Models index file
 * Export all repositories as a single module for easy importing
 */

module.exports = {
  // Core repositories
  students: require('./students.repository'),
  classes: require('./classes.repository'),
  
  // Education-related repositories
  enrollment: require('./enrollment.repository'),
  attendance: require('./attendance.repository'),
  lecture: require('./lecture.repository'),
  homework: require('./homework.repository'),
    // Exam-related repositories
  problems: require('./problems.repository'),
  exams: require('./exams.repository'),
  examProblems: require('./exam-problems.repository'),
  scores: require('./scores.repository')
};
