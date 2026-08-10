const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send({ "name": "Task API", "version": "1.0", "endpoints": ["/tasks"] });
});

app.get("/health", (req, res) => {
  res.send({ "status": "ok" });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});