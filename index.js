const express = require("express");
require("dotenv").config();
const cors = require('cors');
const mongoose = require("mongoose");
const userRoutes = require("./Routes/users.routes");
const postRoutes = require("./Routes/posts.routes");
const commentRoutes = require("./Routes/comments.routes");


const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true 
}));
app.use(express.json());
app.use("/users", userRoutes);
app.use("/posts",postRoutes);
app.use("/comments", commentRoutes);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
    status: statusCode,
  });
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
