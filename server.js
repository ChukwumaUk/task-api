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

app.put("/tasks/:id", (req, res) => {
    
    const taskId = parseInt(req.params.id, 10);

    if (isNaN(taskId)) {
        return res.status(400).json({ "error": "Invalid task ID must be a number" });
    }
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ "error": `Task ${taskId} not found` });
    }

    const {title, done} = req.body;

    // Validate title if provided
    if (title !== undefined && (typeof title !== "string" || title.trim() === "")) {
        return res.status(400).json({ "error": "Title cannot be empty" });
    }

    // Validate done if provided
    if (done !== undefined && typeof done !== "boolean") {
        return res.status(400).json({ "error": "Done must be a boolean" });
    }

    // Explicitly update allowed fields while keeping the original ID intact
    const updatedTask = {
        ...tasks[taskIndex],
        ...(title !== undefined && {title: title.trim()}),
        ...(done !== undefined && {done: done})
    };

    tasks[taskIndex] = updatedTask;
    return res.status(200).json(updatedTask);
});

app.delete("/tasks/:id", (req, res) => {
    const taskId = parseInt(req.params.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (taskIndex === -1) {
        return res.status(404).json({ "error": `Task ${taskId} not found` });
    }

    tasks.splice(taskIndex, 1);
    return res.status(204).send();
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});