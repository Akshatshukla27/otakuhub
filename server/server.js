
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
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://otakuhub-theta.vercel.app",
      ];

      const isVercelPreview =
        origin &&
        /^https:\/\/otakuhub-[a-z0-9-]+\.vercel\.app$/i.test(origin);

      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        isVercelPreview
      ) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error("ERROR: MONGO_URI is missing.");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("ERROR: JWT_SECRET is missing.");
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

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:");
    console.error(error.message);

    process.exit(1);
  });
