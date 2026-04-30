// index.js — Demo de vulnerabilidades para CodeQL y Dependabot
// NO usar en producción — archivo de demostración del curso DevOps

const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Vulnerabilidad 1: Code Injection con eval()
// CodeQL detectará esto como "Code Injection"
app.get('/calc', (req, res) => {
  const { expr } = req.query;
  const result = eval(expr); // ← inseguro: eval con input de usuario
  res.json({ result });
});

// Vulnerabilidad 2: Path Traversal
// CodeQL detectará esto como "Path Traversal"
app.get('/file', (req, res) => {
  const { name } = req.query;
  const filePath = path.join(__dirname, name); // ← sin sanitizar
  res.sendFile(filePath);
});

app.listen(3000, () => {
  console.log('API demo corriendo en puerto 3000');
});
