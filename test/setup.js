/**
 * Common test setup and mocks for BrainDB
 */

// Mock Google API Service to avoid actual API calls
jest.mock('../src/services/google-api.service', () => {
  return {
    getSheets: jest.fn().mockReturnValue({
      spreadsheets: {
        values: {
          get: jest.fn().mockResolvedValue({ 
            data: { 
              values: [
                ['id', 'name', 'status', 'school'],
                ['1', 'John Doe', 'active', 'School A'],
                ['2', 'Jane Smith', 'active', 'School B'],
                ['3', 'Bob Johnson', 'inactive', 'School A']
              ]
            }
          }),
          append: jest.fn().mockResolvedValue({ data: { updates: { updatedRows: 1 } } }),
          update: jest.fn().mockResolvedValue({ data: { updatedCells: 1 } }),
          batchUpdate: jest.fn().mockResolvedValue({ data: { responses: [{}] } })
        }
      }
    })
  };
});

// Mock database config
jest.mock('../src/config/database.config', () => ({
  spreadsheetId: 'test-spreadsheet-id',
  sheets: {
    students: {
      range: 'Students!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'name', 'status', 'school']
    },
    scores: {
      range: 'Scores!A1:Z1000', 
      idColumn: 0,
      columns: ['id', 'student_id', 'exam_problem_id', 'score']
    },
    attendance: {
      range: 'Attendance!A1:Z1000',
      idColumn: 0, 
      columns: ['id', 'student_id', 'class_id', 'date', 'status']
    },
    enrollment: {
      range: 'Enrollment!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'student_id', 'class_id', 'status']
    },
    classes: {
      range: 'Classes!A1:Z1000', 
      idColumn: 0,
      columns: ['id', 'name', 'subject', 'teacher', 'schedule']
    },
    exams: {
      range: 'Exams!A1:Z1000',
      idColumn: 0, 
      columns: ['id', 'name', 'date', 'class_id']
    },
    examProblems: {
      range: 'ExamProblems!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'exam_id', 'problem_id', 'points']  
    },
    problems: {
      range: 'Problems!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'name', 'description', 'difficulty']
    },
    lecture: {
      range: 'Lectures!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'class_id', 'name', 'date', 'topics'] 
    },
    homework: {
      range: 'Homework!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'class_id', 'title', 'description', 'due_date']
    }
  }
}));

// Mock cache service
jest.mock('../src/services/cache.service', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock logger
jest.mock('../src/services/logger.service', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

module.exports = {
  mockRepositories: {
    students: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'John Doe', status: 'active', school: 'School A' },
        { id: '2', name: 'Jane Smith', status: 'active', school: 'School B' },
        { id: '3', name: 'Bob Johnson', status: 'inactive', school: 'School A' }
      ]),
      getById: jest.fn().mockImplementation((id) => {
        const students = {
          '1': { id: '1', name: 'John Doe', status: 'active', school: 'School A' },
          '2': { id: '2', name: 'Jane Smith', status: 'active', school: 'School B' },
          '3': { id: '3', name: 'Bob Johnson', status: 'inactive', school: 'School A' }
        };
        return Promise.resolve(students[id] || null);
      }),
      create: jest.fn().mockImplementation((data) => {
        return Promise.resolve({ id: '4', ...data });
      }),
      update: jest.fn().mockImplementation((id, data) => {
        return Promise.resolve({ id, ...data });
      }),
      delete: jest.fn().mockResolvedValue(true)
    },
    scores: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', student_id: '1', exam_problem_id: '1', score: 85 },
        { id: '2', student_id: '1', exam_problem_id: '2', score: 90 },
        { id: '3', student_id: '2', exam_problem_id: '1', score: 78 }
      ]),
      getById: jest.fn().mockImplementation((id) => {
        const scores = {
          '1': { id: '1', student_id: '1', exam_problem_id: '1', score: 85 },
          '2': { id: '2', student_id: '1', exam_problem_id: '2', score: 90 },
          '3': { id: '3', student_id: '2', exam_problem_id: '1', score: 78 }
        };
        return Promise.resolve(scores[id] || null);
      }),
      create: jest.fn().mockImplementation((data) => {
        return Promise.resolve({ id: '4', ...data });
      }),
      update: jest.fn().mockImplementation((id, data) => {
        return Promise.resolve({ id, ...data });
      }),
      delete: jest.fn().mockResolvedValue(true),
      getByStudentId: jest.fn().mockImplementation((studentId) => {
        const allScores = [
          { id: '1', student_id: '1', exam_problem_id: '1', score: 85 },
          { id: '2', student_id: '1', exam_problem_id: '2', score: 90 },
          { id: '3', student_id: '2', exam_problem_id: '1', score: 78 }
        ];
        return Promise.resolve(allScores.filter(s => s.student_id === studentId));
      })
    },
    attendance: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', student_id: '1', class_id: '1', date: '2025-05-10', status: 'present' },
        { id: '2', student_id: '1', class_id: '1', date: '2025-05-11', status: 'absent' },
        { id: '3', student_id: '2', class_id: '1', date: '2025-05-10', status: 'present' }
      ]),
      getByStudentId: jest.fn().mockImplementation((studentId) => {
        const allAttendance = [
          { id: '1', student_id: '1', class_id: '1', date: '2025-05-10', status: 'present' },
          { id: '2', student_id: '1', class_id: '1', date: '2025-05-11', status: 'absent' },
          { id: '3', student_id: '2', class_id: '1', date: '2025-05-10', status: 'present' }
        ];
        return Promise.resolve(allAttendance.filter(a => a.student_id === studentId));
      })
    },
    enrollment: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', student_id: '1', class_id: '1', status: 'active' },
        { id: '2', student_id: '2', class_id: '1', status: 'active' },
        { id: '3', student_id: '3', class_id: '2', status: 'active' }
      ]),
      getByStudentId: jest.fn().mockImplementation((studentId) => {
        const allEnrollment = [
          { id: '1', student_id: '1', class_id: '1', status: 'active' },
          { id: '2', student_id: '2', class_id: '1', status: 'active' },
          { id: '3', student_id: '3', class_id: '2', status: 'active' }
        ];
        return Promise.resolve(allEnrollment.filter(e => e.student_id === studentId));
      })
    },
    classes: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'Math 101', subject: 'Mathematics', teacher: 'Mr. Smith' },
        { id: '2', name: 'Physics 101', subject: 'Physics', teacher: 'Mrs. Jones' }
      ]),
      getById: jest.fn().mockImplementation((id) => {
        const classes = {
          '1': { id: '1', name: 'Math 101', subject: 'Mathematics', teacher: 'Mr. Smith' },
          '2': { id: '2', name: 'Physics 101', subject: 'Physics', teacher: 'Mrs. Jones' }
        };
        return Promise.resolve(classes[id] || null);
      })
    },
    exams: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', name: 'Midterm Exam', date: '2025-04-15', class_id: '1' },
        { id: '2', name: 'Final Exam', date: '2025-06-15', class_id: '1' }
      ])
    },
    examProblems: {
      getAll: jest.fn().mockResolvedValue([
        { id: '1', exam_id: '1', problem_id: '1', points: 10 },
        { id: '2', exam_id: '1', problem_id: '2', points: 15 }
      ])
    }
  }
};
