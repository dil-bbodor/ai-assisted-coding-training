import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTodos, saveTodos, clearTodos, isValidTodos } from '../utils/sessionStorage';
import type { Todo } from '../types/Todo';

describe('sessionStorage utilities', () => {
  const mockTodos: Todo[] = [
    {
      id: '1',
      title: 'Test Todo 1',
      description: 'Test Description 1',
      completed: false,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
    },
    {
      id: '2',
      title: 'Test Todo 2',
      description: 'Test Description 2',
      completed: true,
      createdAt: new Date('2023-01-02T00:00:00.000Z'),
    },
  ];

  beforeEach(() => {
    // Clear sessionStorage before each test
    window.sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('isValidTodos', () => {
    it('should return true for valid todo arrays', () => {
      expect(isValidTodos(mockTodos)).toBe(true);
      expect(isValidTodos([])).toBe(true);
    });

    it('should return false for invalid data', () => {
      expect(isValidTodos(null)).toBe(false);
      expect(isValidTodos(undefined)).toBe(false);
      expect(isValidTodos('string')).toBe(false);
      expect(isValidTodos(123)).toBe(false);
      expect(isValidTodos({})).toBe(false);
    });

    it('should return false for arrays with invalid todo objects', () => {
      expect(isValidTodos([{ invalid: 'object' }])).toBe(false);
      expect(
        isValidTodos([
          {
            id: 'valid',
            title: 'valid',
            description: 'valid',
            completed: true,
            createdAt: new Date(),
          },
          { invalid: 'object' },
        ])
      ).toBe(false);
    });

    it('should return true for todos with string createdAt', () => {
      const todosWithStringDates = mockTodos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      }));
      expect(isValidTodos(todosWithStringDates)).toBe(true);
    });
  });

  describe('loadTodos', () => {
    it('should return empty array when no data exists', () => {
      const result = loadTodos();
      expect(result).toEqual([]);
    });

    it('should load valid todos from sessionStorage', () => {
      window.sessionStorage.setItem('todos', JSON.stringify(mockTodos));
      const result = loadTodos();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[0].title).toBe('Test Todo 1');
      expect(result[0].createdAt).toBeInstanceOf(Date);
    });

    it('should convert string dates back to Date objects', () => {
      const todosWithStringDates = mockTodos.map(todo => ({
        ...todo,
        createdAt: todo.createdAt.toISOString(),
      }));

      window.sessionStorage.setItem('todos', JSON.stringify(todosWithStringDates));
      const result = loadTodos();

      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].createdAt.getTime()).toBe(new Date('2023-01-01T00:00:00.000Z').getTime());
    });

    it('should clear storage and return empty array for invalid JSON', () => {
      window.sessionStorage.setItem('todos', 'invalid json');
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(window.sessionStorage.getItem('todos')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load todos from sessionStorage:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    it('should clear storage and return empty array for invalid todo data', () => {
      window.sessionStorage.setItem('todos', JSON.stringify([{ invalid: 'data' }]));
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = loadTodos();

      expect(result).toEqual([]);
      expect(window.sessionStorage.getItem('todos')).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid todos data found in sessionStorage, clearing storage'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveTodos', () => {
    it('should save todos to sessionStorage successfully', () => {
      const result = saveTodos(mockTodos);

      expect(result).toBeNull();

      const stored = window.sessionStorage.getItem('todos');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockTodos);
    });

    it('should return error message on QuotaExceededError', () => {
      const originalSetItem = window.sessionStorage.setItem;
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';

      window.sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw error;
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result).toBe('Storage quota exceeded – your latest changes may not be saved.');
      expect(consoleSpy).toHaveBeenCalledWith('Storage quota exceeded, unable to save todos');

      // Restore original method
      window.sessionStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });

    it('should return error message on other storage errors', () => {
      const originalSetItem = window.sessionStorage.setItem;
      const error = new Error('Some other error');

      window.sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw error;
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = saveTodos(mockTodos);

      expect(result).toBe('Failed to save changes to session storage.');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to save todos to sessionStorage:', error);

      // Restore original method
      window.sessionStorage.setItem = originalSetItem;
      consoleSpy.mockRestore();
    });
  });

  describe('clearTodos', () => {
    it('should clear todos from sessionStorage', () => {
      window.sessionStorage.setItem('todos', JSON.stringify(mockTodos));

      clearTodos();

      expect(window.sessionStorage.getItem('todos')).toBeNull();
    });

    it('should handle storage errors gracefully', () => {
      const originalRemoveItem = window.sessionStorage.removeItem;
      const error = new Error('Storage error');

      window.sessionStorage.removeItem = vi.fn().mockImplementation(() => {
        throw error;
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => clearTodos()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to clear todos from sessionStorage:', error);

      // Restore original method
      window.sessionStorage.removeItem = originalRemoveItem;
      consoleSpy.mockRestore();
    });
  });
});
