/**
 * Tests for ScoresController
 */
const ScoresController = require('../../src/controllers/scores.controller');
const { mockRepositories } = require('../setup');

// Mock the repositories module with our pre-configured mock repositories
jest.mock('../../src/models', () => mockRepositories);

describe('ScoresController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();
    
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

  test('getAllScores should return all scores', async () => {
    await ScoresController.getAllScores(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ id: '1', score: 85 })
      ])
    }));
  });

  test('getScoreById should return a specific score', async () => {
    req.params.id = '1';
    
    await ScoresController.getScoreById(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ id: '1', score: 85 })
    }));
  });

  test('getScoresByStudent should return scores for a student', async () => {
    req.params.studentId = '1';
    
    await ScoresController.getScoresByStudent(req, res);
    
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({ student_id: '1' })
      ])
    }));
  });
});
