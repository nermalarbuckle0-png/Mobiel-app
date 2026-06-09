const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ── static files ──
app.use(express.static(path.join(__dirname)));

// ── start server ──
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});