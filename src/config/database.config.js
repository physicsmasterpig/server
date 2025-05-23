/**
 * Database configuration settings
 */

// Define Google Spreadsheet structure based on provided headers
const spreadsheetConfigs = {
  students: {
    sheetName: 'students',
    fields: {
      student_id: { column: 'A', type: 'string' },
      name: { column: 'B', type: 'string' },
      school: { column: 'C', type: 'string' },
      generation: { column: 'D', type: 'string' },
      number: { column: 'E', type: 'string' },
      enrollment_date: { column: 'F', type: 'date' },
      status: { column: 'G', type: 'string' }
    }
  },
  
  classes: {
    sheetName: 'class',
    fields: {
      class_id: { column: 'A', type: 'string' },
      school: { column: 'B', type: 'string' },
      year: { column: 'C', type: 'string' },
      semester: { column: 'D', type: 'string' },
      generation: { column: 'E', type: 'string' },
      schedule: { column: 'F', type: 'string' },
      status: { column: 'G', type: 'string' }
    }
  },
  
  enrollment: {
    sheetName: 'enrollment',
    fields: {
      enrollment_id: { column: 'A', type: 'string' },
      student_id: { column: 'B', type: 'string' },
      class_id: { column: 'C', type: 'string' },
      enrollment_date: { column: 'D', type: 'date' }
    }
  },
  
  attendance: {
    sheetName: 'attendance',
    fields: {
      attendance_id: { column: 'A', type: 'string' },
      lecture_id: { column: 'B', type: 'string' },
      student_id: { column: 'C', type: 'string' },
      status: { column: 'D', type: 'string' }
    }
  },
  
  lecture: {
    sheetName: 'lecture',
    fields: {
      lecture_id: { column: 'A', type: 'string' },
      class_id: { column: 'B', type: 'string' },
      lecture_date: { column: 'C', type: 'date' },
      lecture_time: { column: 'D', type: 'string' },
      lecture_topic: { column: 'E', type: 'string' }
    }
  },
  
  homework: {
    sheetName: 'homework',
    fields: {
      homework_id: { column: 'A', type: 'string' },
      lecture_id: { column: 'B', type: 'string' },
      student_id: { column: 'C', type: 'string' },
      total_problems: { column: 'D', type: 'number' },
      completed_problems: { column: 'E', type: 'number' },
      classification: { column: 'F', type: 'string' },
      comments: { column: 'G', type: 'string' }
    }
  },
  
  problems: {
    sheetName: 'problem_id',
    fields: {
      problem_id: { column: 'A', type: 'string' },
      link: { column: 'B', type: 'string' },
      subject: { column: 'C', type: 'string' }
    }
  },
  
  exams: {
    sheetName: 'exam',
    fields: {
      exam_id: { column: 'A', type: 'string' },
      lecture_id: { column: 'B', type: 'string' },
      status: { column: 'C', type: 'string' }
    }
  },
  
  examProblems: {
    sheetName: 'exam_problem',
    fields: {
      exam_problem_id: { column: 'A', type: 'string' },
      exam_id: { column: 'B', type: 'string' },
      problem_id: { column: 'C', type: 'string' },
      problem_no: { column: 'D', type: 'number' },
      total_score: { column: 'E', type: 'number' }
    }
  },
  
  scores: {
    sheetName: 'score',
    fields: {
      score_id: { column: 'A', type: 'string' },
      student_id: { column: 'B', type: 'string' },
      exam_problem_id: { column: 'C', type: 'string' },
      score: { column: 'D', type: 'number' },
      comment: { column: 'E', type: 'string' },
      internal_comment: { column: 'F', type: 'string' },
      time: { column: 'G', type: 'string' },
      grader: { column: 'H', type: 'string' },
      graded_date: { column: 'I', type: 'date' }
    }
  }
};

module.exports = {
  // Google Spreadsheet ID 
  // (this should be moved to environment variables in production)
  spreadsheetId: process.env.SPREADSHEET_ID || '1Example-SpreadsheetId',
  
  // Sheet configurations
  sheets: spreadsheetConfigs,
  
  // Cache configuration for database results
  cache: {
    enabled: true,
    ttl: 5 * 60, // 5 minutes in seconds
  }
};
