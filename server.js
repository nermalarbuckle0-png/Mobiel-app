const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// ── static files ──
app.use('/js',     express.static(path.join(__dirname, 'js')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/json',   express.static(path.join(__dirname, 'json')));
app.use('/icons',  express.static(path.join(__dirname, 'icons')));
app.use('/',       express.static(path.join(__dirname, 'pages')));
app.use('/pages',  express.static(path.join(__dirname, 'pages')));

// ── start server ──
app.listen(PORT, () => {
  console.log(`Server draait op http://localhost:${PORT}`);
});