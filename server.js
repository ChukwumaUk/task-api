const express = require('express');


const db = require("./db");


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

app.get("/tasks", async (req, res) => {
  const tasks = await db.getAllTasks();
  res.json(tasks);
});

app.get("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const task = await db.getTaskById(taskId);
  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
  res.json(task);
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

db.init()
  .then(() => {
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });