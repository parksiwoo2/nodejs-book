const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const passport = require('passport');
const morgan = require('morgan');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('./config/db');
const apiRouter = require('./routes/api');

const app = express();

app.use(morgan('dev'));

app.use(passport.initialize());
require('./config/passport')(passport);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'main.html'));
});

app.get('/book-ranking', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'book-ranking.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'register.html'));
});

app.get('/mypage', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'mypage.html'));
});

app.get('/readinglog', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'readinglog.html'));
});

app.get('/edit-user', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'edit-user.html'));
});

app.get('/reading', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'reading.html'));
});

app.listen(3000);
