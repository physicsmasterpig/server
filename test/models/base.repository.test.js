/**
 * Tests for BaseRepository
 */
const BaseRepository = require('../../src/models/base.repository');

// Mock the Google API Service
jest.mock('../../src/services/google-api.service', () => ({
  getSheets: jest.fn().mockReturnValue({
    spreadsheets: {
      values: {
        get: jest.fn().mockResolvedValue({ 
          data: { 
            values: [
              ['id', 'name', 'status', 'school'],
              ['1', 'Test Student 1', 'active', 'School A'],
              ['2', 'Test Student 2', 'active', 'School B']
            ]
          }
        }),
        append: jest.fn().mockResolvedValue({ data: { updates: { updatedRows: 1 } } }),
        update: jest.fn().mockResolvedValue({ data: { updatedCells: 1 } }),
        batchUpdate: jest.fn().mockResolvedValue({ data: { responses: [{}] } })
      }
    }
  })
}));

// Mock the database config
jest.mock('../../src/config/database.config', () => ({
  spreadsheetId: 'test-spreadsheet-id',
  sheets: {
    students: {
      range: 'Students!A1:Z1000',
      idColumn: 0,
      columns: ['id', 'name', 'status', 'school']
    }
  }
}));

// Mock the cache service
jest.mock('../../src/services/cache.service', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
}));

// Mock logger
jest.mock('../../src/services/logger.service', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('BaseRepository', () => {
  let repository;

  beforeEach(() => {
    repository = new BaseRepository('students');
    jest.clearAllMocks();
  });

  test('should be instantiated with a collection name', () => {
    expect(repository).toBeInstanceOf(BaseRepository);
    expect(repository.entityType).toBe('students');
  });

  test('should have the correct spreadsheetId from config', () => {
    expect(repository.spreadsheetId).toBe('test-spreadsheet-id');
  });

  test('should have access to the config object', () => {
    expect(repository.config).toBeDefined();
    expect(repository.config.range).toBe('Students!A1:Z1000');
  });

  test('getAll should retrieve data from spreadsheet', async () => {
    const result = await repository.getAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('id', '1');
    expect(result[0]).toHaveProperty('name', 'Test Student 1');
  });
});
