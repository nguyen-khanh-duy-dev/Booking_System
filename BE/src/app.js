const express = require("express");
const cors = require("cors");
const courtRoutes = require("./routes/court.route.js");
const logger = require("./middlewares/logger.middleware");
const notFound = require("./middlewares/notfound.middleware.js");
const errorMiddleware = require("./middlewares/error.middleware.js");

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split("").map((origin) => origin.trim())
  : [];

// Middleware cho toàn bộ
app.use(
  cors({
    origin: (origin, callback) => {
      // callback(error, allow)

      // Trường hợp gửi lên ko có origin như: postmain, server to server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORD"));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(logger);

app.use("/api/courts", courtRoutes);

app.use(notFound);

app.get("/", (req, res) => {
  res.json({
    message: "Booking System API",
  });
});

app.use(errorMiddleware);

module.exports = app;
