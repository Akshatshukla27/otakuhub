const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

// Allow React/Vite frontend to communicate with backend

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://otakuhub-theta.vercel.app",
    ],
    credentials: true,
  })
);


// IMPORTANT:
// Parse JSON request bodies BEFORE API routes
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Check required environment variables
if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing from .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing from .env");
  process.exit(1);
}

// =====================================================
// BASIC TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "OtakuHub backend is running.",
  });
});

// =====================================================
// AUTH ROUTES
// =====================================================

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);

// =====================================================
// 404 ROUTE
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error("SERVER ERROR:", error);

  res.status(500).json({
    message: "Internal server error.",
  });
});

// =====================================================
// MONGODB CONNECTION
// =====================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    // =================================================
    // START SERVER
    // =================================================

    app.listen(PORT, () => {
      console.log(
        `Server running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:"
    );

    console.error(error.message);

    process.exit(1);
  });