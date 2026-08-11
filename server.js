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

app.post("/tasks", async (req, res) => {
  const title = req.body.title;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }
  const newTask = await db.createTask(title.trim());
  res.status(201).json(newTask);
});

app.put("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);

  const existing = await db.getTaskById(taskId);
  if (!existing) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body;
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    return res.status(400).json({ error: "Title cannot be empty" });
  }
  if (done !== undefined && typeof done !== "boolean") {
    return res.status(400).json({ error: "Done must be a boolean" });
  }

  const merged = {
    title: title !== undefined ? title.trim() : existing.title,
    done:  done  !== undefined ? done : existing.done,
  };

  const updated = await db.updateTask(taskId, merged);
  res.status(200).json(updated);
});

app.delete("/tasks/:id", async (req, res) => {
  const taskId = parseInt(req.params.id, 10);
  const deletedCount = await db.deleteTask(taskId);
  if (deletedCount === 0) {
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