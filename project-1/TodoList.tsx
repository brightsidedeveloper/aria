import React, { useState, useEffect } from 'react';

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
      setTodos(JSON.parse(storedTodos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim() === '') return;
    const newTask: Todo = { id: Date.now(), text: newTodo, completed: false };
    setTodos([...todos, newTask]);
    setNewTodo('');
  };

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="todo-list">
      <h1>Todo List</h1>
      <input 
        type="text" 
        value={newTodo} 
        onChange={(e) => setNewTodo(e.target.value)} 
        placeholder="Add a new task" 
      />
      <button onClick={addTodo}>Add Todo</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <style jsx>{`
        .todo-list {
          font-family: Arial, sans-serif;
          text-align: center;
        }
        input {
          padding: 10px;
          margin: 10px;
          font-size: 16px;
        }
        button {
          padding: 10px;
          font-size: 16px;
        }
        ul {
          list-style: none;
          padding: 0;
        }
        li {
          padding: 10px;
          font-size: 18px;
          cursor: pointer;
        }
        .completed {
          text-decoration: line-through;
          color: grey;
        }
      `}</style>
    </div>
  );
};

export default TodoList;
