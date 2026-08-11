const express = require('express');
const Database = require("better-sqlite3");

const db = new Database("tasks.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const count = db.prepare("SELECT COUNT(*) AS count FROM tasks").get().count;

if (count === 0) {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  insert.run("Learn HTTP", 1);
  insert.run("Build a CRUD API", 0);
  insert.run("Push to GitHub", 0);
}

console.log(db.prepare("SELECT * FROM tasks").all());

function toTask(row) {
  if (!row) return row;              // pass undefined straight through
  return { ...row, done: Boolean(row.done) };
}

const app = express();

app.use(express.json());

const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("./openapi.json");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));



app.get('/', (req, res) => {
  res.json({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.json({ "status": "ok" });
});

app.get("/tasks", (req, res) => {
  const rows = db.prepare("SELECT * FROM tasks").all();

  res.json(rows.map(toTask));
});

app.get("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id);
  const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  const task = toTask(row); // safe even if row is undefined

  if (task) {
    res.json(task);
  } else {
    res.status(404).json({ "error": `Task ${taskId} not found` });
  }
});

app.post("/tasks", (req, res) => {
  const title = req.body.title;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  const result = db
    .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
    .run(title.trim(), 0);

  const newTask = toTask(
    db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid)
  );

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