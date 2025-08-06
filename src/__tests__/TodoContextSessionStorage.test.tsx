import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TodoProvider } from '../contexts/TodoContext';
import { ToastProvider } from '../components/Toast';
import { useTodo } from '../hooks/useTodo';
import type { Todo } from '../types/Todo';

// Mock the sessionStorage utilities
vi.mock('../utils/sessionStorage', () => {
  let mockTodos: Todo[] = [];
  let shouldThrowError = false;
  let errorMessage: string | null = null;

  return {
    loadTodos: vi.fn(() => mockTodos),
    saveTodos: vi.fn((todos: Todo[]) => {
      if (shouldThrowError) {
        return errorMessage;
      }
      mockTodos = [...todos];
      return null;
    }),
    clearTodos: vi.fn(() => {
      mockTodos = [];
    }),
    // Test helpers
    __setMockTodos: (todos: Todo[]) => {
      mockTodos = [...todos];
    },
    __setShouldThrowError: (shouldThrow: boolean, message?: string) => {
      shouldThrowError = shouldThrow;
      errorMessage = message || null;
    },
    __getMockTodos: () => mockTodos,
  };
});

type MockedSessionStorage = typeof import('../utils/sessionStorage') & {
  __setMockTodos: (todos: Todo[]) => void;
  __setShouldThrowError: (shouldThrow: boolean, message?: string) => void;
  __getMockTodos: () => Todo[];
};

const mockSessionStorage = (await import('../utils/sessionStorage')) as MockedSessionStorage;

const TestComponent = () => {
  const { todos, addTodo, toggleTodoCompletion, deleteTodo, editTodo } = useTodo();

  return (
    <div>
      <button data-testid="add-todo" onClick={() => addTodo('Test Todo', 'Test Description')}>
        Add Todo
      </button>
      <div data-testid="todo-count">{todos.length}</div>
      {todos.map(todo => (
        <div key={todo.id} data-testid={`todo-item-${todo.id}`}>
          <span data-testid={`todo-title-${todo.id}`}>{todo.title}</span>
          <span data-testid={`todo-desc-${todo.id}`}>{todo.description}</span>
          <span data-testid={`todo-completed-${todo.id}`}>
            {todo.completed ? 'Completed' : 'Not completed'}
          </span>
          <button data-testid={`toggle-${todo.id}`} onClick={() => toggleTodoCompletion(todo.id)}>
            Toggle
          </button>
          <button
            data-testid={`edit-${todo.id}`}
            onClick={() => editTodo(todo.id, { title: 'Updated Title' })}
          >
            Edit
          </button>
          <button data-testid={`delete-${todo.id}`} onClick={() => deleteTodo(todo.id)}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
};

const renderWithProviders = (children: React.ReactNode) => {
  return render(
    <ToastProvider>
      <TodoProvider>{children}</TodoProvider>
    </ToastProvider>
  );
};

describe('TodoContext with sessionStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.__setMockTodos([]);
    mockSessionStorage.__setShouldThrowError(false);
  });

  it('should initialize with empty todos when no stored data exists', () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockSessionStorage.loadTodos).toHaveBeenCalledTimes(1);
  });

  it('should initialize with stored todos when data exists', () => {
    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Existing Todo',
        description: 'Existing Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
      },
    ];

    mockSessionStorage.__setMockTodos(existingTodos);

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(screen.getByTestId('todo-title-1')).toHaveTextContent('Existing Todo');
    expect(mockSessionStorage.loadTodos).toHaveBeenCalledTimes(1);
  });

  it('should save todos to storage when a todo is added', async () => {
    const user = userEvent.setup();

    renderWithProviders(<TestComponent />);

    const addButton = screen.getByTestId('add-todo');
    await user.click(addButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');
    expect(mockSessionStorage.saveTodos).toHaveBeenCalled();

    // Verify the todo was saved with correct data
    const saveTodosMock = mockSessionStorage.saveTodos as ReturnType<typeof vi.fn>;
    const lastCall = saveTodosMock.mock.calls.slice(-1)[0];
    const savedTodos = lastCall[0];
    expect(savedTodos).toHaveLength(1);
    expect(savedTodos[0].title).toBe('Test Todo');
    expect(savedTodos[0].description).toBe('Test Description');
  });

  it('should save todos to storage when a todo is toggled', async () => {
    const user = userEvent.setup();

    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
      },
    ];

    mockSessionStorage.__setMockTodos(existingTodos);

    renderWithProviders(<TestComponent />);

    const toggleButton = screen.getByTestId('toggle-1');
    await user.click(toggleButton);

    expect(screen.getByTestId('todo-completed-1')).toHaveTextContent('Completed');
    expect(mockSessionStorage.saveTodos).toHaveBeenCalled();
  });

  it('should save todos to storage when a todo is edited', async () => {
    const user = userEvent.setup();

    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Original Title',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
      },
    ];

    mockSessionStorage.__setMockTodos(existingTodos);

    renderWithProviders(<TestComponent />);

    const editButton = screen.getByTestId('edit-1');
    await user.click(editButton);

    expect(screen.getByTestId('todo-title-1')).toHaveTextContent('Updated Title');
    expect(mockSessionStorage.saveTodos).toHaveBeenCalled();
  });

  it('should save todos to storage when a todo is deleted', async () => {
    const user = userEvent.setup();

    const existingTodos: Todo[] = [
      {
        id: '1',
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2023-01-01'),
      },
    ];

    mockSessionStorage.__setMockTodos(existingTodos);

    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');

    const deleteButton = screen.getByTestId('delete-1');
    await user.click(deleteButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('0');
    expect(mockSessionStorage.saveTodos).toHaveBeenCalled();
  });

  it('should show toast when storage save fails', async () => {
    const user = userEvent.setup();

    // Configure mock to return error
    mockSessionStorage.__setShouldThrowError(
      true,
      'Storage quota exceeded – your latest changes may not be saved.'
    );

    renderWithProviders(<TestComponent />);

    const addButton = screen.getByTestId('add-todo');
    await user.click(addButton);

    // Check that the todo was still added to the UI (in-memory state)
    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');

    // Check that the toast error message appears
    expect(
      screen.getByText('Storage quota exceeded – your latest changes may not be saved.')
    ).toBeInTheDocument();
  });

  it('should continue working when storage operations fail', async () => {
    const user = userEvent.setup();

    // Configure mock to return error
    mockSessionStorage.__setShouldThrowError(true, 'Failed to save changes to session storage.');

    renderWithProviders(<TestComponent />);

    // Add first todo
    const addButton = screen.getByTestId('add-todo');
    await user.click(addButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('1');

    // Add second todo - should still work despite storage errors
    await user.click(addButton);

    expect(screen.getByTestId('todo-count')).toHaveTextContent('2');

    // Verify error messages are shown
    expect(screen.getAllByText('Failed to save changes to session storage.')).toHaveLength(2);
  });
});
