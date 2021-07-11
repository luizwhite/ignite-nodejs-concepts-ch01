const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(req, res, next) {
  const { username } = req.headers;
  if (!username)
    return res.status(400).json({ error: 'Username data is required!' });

  const userFound = users.find((user) => username === user.username);
  if (!userFound) {
    return res.status(404).json({ error: 'Username does not exist!' });
  }

  req.user = userFound;
  return next();
}

app.post('/users', (req, res) => {
  const { name, username } = req.body;
  if (!name || !username)
    return res
      .status(400)
      .json({ error: 'Please send name and username data!' });

  const userFound = users.some((user) => username === user.username);
  if (userFound)
    return res.status(400).json({ error: 'Username already exists!' });

  users.push({
    id: uuidv4(),
    name,
    username,
    todos: [],
  });

  return res.status(201).json(users[users.length - 1]);
});

app.get('/todos', checksExistsUserAccount, (req, res) =>
  res.json(req.user.todos)
);

app.post('/todos', checksExistsUserAccount, (req, res) => {
  const { title, deadline } = req.body;
  const { user } = req;
  if (!title || !deadline)
    return res.status(400).json({ error: 'title and deadline are required!' });

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date(),
  };

  user.todos.push(todo);

  return res.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, (req, res) => {
  const { user } = req;
  const { id } = req.params;
  const { title, deadline } = req.body;
  if (!title || !deadline)
    return res.status(400).json({ error: 'title and deadline are required!' });

  const todoFound = user.todos.find((todo) => id === todo.id);
  if (!todoFound)
    return res
      .status(404)
      .json({ error: 'To-Do with the given id not found!' });

  const todoFoundIndex = user.todos.indexOf(todoFound);
  user.todos[todoFoundIndex] = {
    ...todoFound,
    title,
    deadline: new Date(deadline),
  };

  return res.json(user.todos[todoFoundIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const todoFound = user.todos.find((todo) => id === todo.id);
  if (!todoFound)
    return res
      .status(404)
      .json({ error: 'To-Do with the given id not found!' });

  const todoFoundIndex = user.todos.indexOf(todoFound);
  user.todos[todoFoundIndex] = {
    ...todoFound,
    done: true,
  };

  return res.json(user.todos[todoFoundIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, (req, res) => {
  const { user } = req;
  const { id } = req.params;

  const todoFoundIndex = user.todos.findIndex((todo) => id === todo.id);
  if (todoFoundIndex === -1)
    return res
      .status(404)
      .json({ error: 'To-Do with the given id not found!' });

  user.todos.splice(todoFoundIndex, 1);

  return res.status(204).send();
});

module.exports = app;
