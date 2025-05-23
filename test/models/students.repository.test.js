/**
 * Tests for StudentsRepository
 */
const StudentsRepository = require('../../src/models/students.repository');

// Mock BaseRepository to avoid calling actual services
jest.mock('../../src/models/base.repository', () => {
  return class MockBaseRepository {
    constructor(entityType) {
      this.entityType = entityType;
    }
    getAll() {
      return Promise.resolve([
        { id: '1', name: 'John Doe', status: 'active', school: 'High School A' },
        { id: '2', name: 'Jane Smith', status: 'active', school: 'High School B' },
        { id: '3', name: 'Bob Johnson', status: 'inactive', school: 'High School A' }
      ]);
    }
    getById(id) {
      return Promise.resolve({ id, name: 'Test Student' });
    }
    create(data) {
      return Promise.resolve({ id: '4', ...data });
    }
    update(id, data) {
      return Promise.resolve({ id, ...data });
    }
    delete(id) {
      return Promise.resolve(true);
    }
  };
});

// Mock the database config and other services
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

jest.mock('../../src/services/cache.service');
jest.mock('../../src/services/logger.service');
jest.mock('../../src/services/google-api.service');

describe('StudentsRepository', () => {
  let repository;
  
  beforeEach(() => {
    jest.clearAllMocks();
    repository = new StudentsRepository();
  });

  test('should be properly initialized', () => {
    expect(repository).toBeInstanceOf(StudentsRepository);
    expect(repository.entityType).toBe('students');
  });

  test('should have all expected methods', () => {
    expect(typeof repository.getAll).toBe('function');
    expect(typeof repository.getById).toBe('function');
    expect(typeof repository.create).toBe('function');
    expect(typeof repository.update).toBe('function');
    expect(typeof repository.delete).toBe('function');
    // Methods specific to StudentsRepository
    expect(typeof repository.search).toBe('function');
  });

  test('getAll should return student records', async () => {
    const result = await repository.getAll();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
