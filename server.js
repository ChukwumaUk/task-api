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

  // 1. Does the task exist? (404 if not)
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
  if (!existing) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  // 2. Validate the incoming fields (same rules as A1)
  const { title, done } = req.body;
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "Done must be a boolean" });
  }

  // 3. Merge: keep old values for anything the client didn't send
  const newTitle = title !== undefined ? title.trim() : existing.title;
  const newDone  = done  !== undefined ? (done ? 1 : 0) : existing.done;

  // 4. Write the update
  db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?")
    .run(newTitle, newDone, taskId);

  // 5. Return the updated row, converted
  const updated = toTask(db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId));
  res.status(200).json(updated);
});

app.delete("/tasks/:id", (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);

  if (result.changes === 0) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  res.status(204).send();
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});