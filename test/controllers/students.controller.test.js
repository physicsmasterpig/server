/**
 * Tests for StudentsController
 */
const StudentsController = require('../../src/controllers/students.controller');
const { mockRepositories } = require('../setup');

// Mock the repositories module with our pre-configured mock repositories
jest.mock('../../src/models', () => mockRepositories);

describe('StudentsController', () => {
  let req, res;

  beforeEach(() => {
    // Reset mock implementation for each test
    jest.clearAllMocks();
    
    // Mock request and response
    req = {
      params: {},
      query: {},
      body: {}
    };
    
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test('getAllStudents should return all students', async () => {
    await StudentsController.getAllStudents(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ id: '1', name: 'John Doe' })
      ])
    }));
  });

  test('getStudentById should return a specific student', async () => {
    req.params.id = '1';
    
    await StudentsController.getStudentById(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: '1', name: 'John Doe' })
    }));
  });

  test('getStudentAttendance should return attendance for a student', async () => {
    req.params.id = '1';
    
    await StudentsController.getStudentAttendance(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true
    }));
  });
});
