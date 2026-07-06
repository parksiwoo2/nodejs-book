const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const passport = require('passport');

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const connectDB = require("./config/db");
const apiRouter = require("./routes/api");

const app = express();

app.use(passport.initialize());
require('./config/passport')(passport);

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", apiRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'main.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
});
app.listen(3000);
