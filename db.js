const { Pool } = require("pg");

// A pool manages a set of reusable connections to Postgres.
// It reads DATABASE_URL from the environment (loaded via --env-file).
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Run once on startup: create the table if missing, seed if empty.
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `);

  const { rows } = await pool.query("SELECT COUNT(*) AS count FROM tasks");
  if (Number(rows[0].count) === 0) {
    await pool.query(
      "INSERT INTO tasks (title, done) VALUES ($1,$2),($3,$4),($5,$6)",
      ["Learn HTTP", true, "Build a CRUD API", false, "Push to GitHub", false]
    );
  }
}

// One function per operation — these are what your routes will call.
async function getAllTasks() {
  const { rows } = await pool.query("SELECT * FROM tasks ORDER BY id");
  return rows;
}

async function getTaskById(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0]; // undefined if not found
}

async function createTask(title) {
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title, false]
  );
  return rows[0];
}

async function updateTask(id, fields) {
  const { rows } = await pool.query(
    "UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *",
    [fields.title, fields.done, id]
  );
  return rows[0]; // undefined if no row matched
}

async function deleteTask(id) {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return result.rowCount; // 0 if nothing was deleted
}

module.exports = { init, getAllTasks, getTaskById, createTask, updateTask, deleteTask };