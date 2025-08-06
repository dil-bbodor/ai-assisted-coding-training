import type { Todo } from '../types/Todo';

const STORAGE_KEY = 'todos';

/**
 * Validates if a value is a properly structured Todo object
 */
const isValidTodo = (value: unknown): value is Todo => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.completed === 'boolean' &&
    (obj.createdAt instanceof Date || typeof obj.createdAt === 'string')
  );
};

/**
 * Validates if an array contains only valid Todo objects
 */
const isValidTodos = (value: unknown): value is Todo[] => {
  return Array.isArray(value) && value.every(isValidTodo);
};

/**
 * Loads todos from sessionStorage
 * Returns empty array if data is invalid or doesn't exist
 */
export const loadTodos = (): Todo[] => {
  try {
    const storedData = window.sessionStorage.getItem(STORAGE_KEY);
    if (!storedData) {
      return [];
    }

    const parsedData = JSON.parse(storedData);

    if (!isValidTodos(parsedData)) {
      console.warn('Invalid todos data found in sessionStorage, clearing storage');
      window.sessionStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Convert createdAt strings back to Date objects if needed
    return parsedData.map(todo => ({
      ...todo,
      createdAt: typeof todo.createdAt === 'string' ? new Date(todo.createdAt) : todo.createdAt,
    }));
  } catch (error) {
    console.warn('Failed to load todos from sessionStorage:', error);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
};

/**
 * Saves todos to sessionStorage
 * Returns error message if save fails, null if successful
 */
export const saveTodos = (todos: Todo[]): string | null => {
  try {
    const dataToStore = JSON.stringify(todos);
    window.sessionStorage.setItem(STORAGE_KEY, dataToStore);
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, unable to save todos');
      return 'Storage quota exceeded – your latest changes may not be saved.';
    }
    console.warn('Failed to save todos to sessionStorage:', error);
    return 'Failed to save changes to session storage.';
  }
};

/**
 * Clears todos from sessionStorage
 */
export const clearTodos = (): void => {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear todos from sessionStorage:', error);
  }
};

// Export validation functions for testing
export { isValidTodos };
