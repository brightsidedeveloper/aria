import React, { useState, useEffect } from 'react'

interface Todo {
  id: number
  text: string
  completed: boolean
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    const storedTodos = localStorage.getItem('todos')
    if (storedTodos) setTodos(JSON.parse(storedTodos))
  }, [])

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  const addTodo = () => {
    if (newTodo.trim() === '') return
    const newTask: Todo = { id: Date.now(), text: newTodo, completed: false }
    setTodos([...todos, newTask])
    setNewTodo('')
  }

  const toggleTodo = (id: number) => {
    setTodos(
      todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(todo => todo.id !== id))
  }

  return (
    <div className="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-bold">Todo List</h1>
      <div className="flex space-x-2">
        <input 
          type="text" 
          value={newTodo} 
          onChange={(e) => setNewTodo(e.target.value)} 
          placeholder="Add a new task" 
          className="flex-grow p-2 border rounded"
        />
        <button 
          onClick={addTodo} 
          className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Todo
        </button>
      </div>
      <ul className="space-y-2">
        {todos.map(todo => (
          <li 
            key={todo.id} 
            className={`flex justify-between items-center p-2 border rounded ${todo.completed ? 'line-through text-gray-500' : ''}`}
          >
            <span 
              onClick={() => toggleTodo(todo.id)} 
              className="flex-grow cursor-pointer"
            >
              {todo.text}
            </span>
            <button 
              onClick={() => deleteTodo(todo.id)} 
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodoList
