const express = require("express");
const path = require("path");
const app = express();
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const apiRouter = require("./routes/api");
dotenv.config();

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api", apiRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'main.html'));
});

app.get("/book-ranking", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "book-ranking.html"));
});

app.listen(3000);
