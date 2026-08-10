const express = require('express');

const app = express();

app.use(express.json());

let tasks = [
  { id: 1, title: "Learn HTTP", done: true },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Push to GitHub", done: false },
];

app.get('/', (req, res) => {
  res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.json({ "status": "ok" });
});

app.get("/tasks", (req, res) => {
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    res.json(task);
  } else {
    res.status(404).send({ "error": `Task ${taskId} not found` });
  }
});

app.post("/tasks", (req, res) => {
    const title = req.body.title;

    if (!title || title.trim() === "") {
        return res.status(400).json({ "error": "Title is required" });
    }

    const newTask = {
        id: Math.max(...tasks.map(t => t.id)) + 1,
        title: title,
        done: false
    };

    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});