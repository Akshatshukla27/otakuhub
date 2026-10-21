const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const protect = require("../middleware/authMiddleware");

const router = express.Router();


// ======================================================
// UPDATE FAVORITES
// ======================================================

router.put("/progress", protect, async (req, res) => {
  try {
    const {
      type,
      id,
      progress,
      title,
      image,
    } = req.body;

    if (!type || !id || progress === undefined) {
      return res.status(400).json({
        message:
          "Type, id and progress are required.",
      });
    }

    if (
      !["anime", "manga", "manhwa"].includes(type)
    ) {
      return res.status(400).json({
        message: "Invalid content type.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.readingProgress[type].set(
      String(id),
      {
        progress: Number(progress),
        title: title || "",
        image: image || "",
      }
    );

    await user.save();

    res.json({
      message:
        "Reading progress saved successfully.",
      readingProgress: user.readingProgress,
    });
  } catch (error) {
    console.error(
      "Save reading progress error:",
      error.message
    );

    res.status(500).json({
      message:
        "Server error while saving reading progress.",
    });
  }
});

// ======================================================
// GET READING PROGRESS
// ======================================================

router.get("/progress", protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "readingProgress"
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({
      readingProgress: user.readingProgress,
    });
  } catch (error) {
    console.error(
      "Get reading progress error:",
      error.message
    );

    res.status(500).json({
      message:
        "Server error while getting reading progress.",
    });
  }
});




// ======================================================
// DELETE READING PROGRESS
// ======================================================

router.delete(
  "/progress/:type/:id",
  protect,
  async (req, res) => {
    try {
      const { type, id } = req.params;

      if (
        !["anime", "manga", "manhwa"].includes(type)
      ) {
        return res.status(400).json({
          message: "Invalid content type.",
        });
      }

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      user.readingProgress[type].delete(
        String(id)
      );

      await user.save();

      res.json({
        message:
          "Reading progress deleted successfully.",
        readingProgress: user.readingProgress,
      });
    } catch (error) {
      console.error(
        "Delete reading progress error:",
        error.message
      );

      res.status(500).json({
        message:
          "Server error while deleting reading progress.",
      });
    }
  }
);


// ======================================================
// SIGNUP
// ======================================================

router.post("/signup", async (req, res) => {
  try {
    const {
      username,
      email,
      password,
    } = req.body;

    // Check all fields
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please fill in all fields.",
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "An account with this email already exists.",
      });
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Signup error:",
      error.message
    );

    res.status(500).json({
      message: "Server error during signup.",
    });
  }
});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message:
          "Please enter email and password.",
      });
    }

    // Find user
    const user = await User.findOne({
      email,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Create JWT token
    const token = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      message: "Server error during login.",
    });
  }
});


// ======================================================
// PROTECTED PROFILE
// ======================================================

router.get(
  "/profile",
  protect,
  async (req, res) => {
    try {
      const user =
        await User.findById(req.userId).select(
          "-password"
        );

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      res.json({
        message:
          "Protected profile accessed successfully.",
        user,
      });
    } catch (error) {
      console.error(
        "Profile error:",
        error.message
      );

      res.status(500).json({
        message: "Server error.",
      });
    }
  }
);


// ======================================================
// EXPORT ROUTER
// ======================================================


// ======================================================
// UPDATE FAVORITES
// ======================================================

router.put("/favorites", protect, async (req, res) => {
  try {
    const {
      animeFavorites,
      mangaFavorites,
      manhwaFavorites,
    } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.animeFavorites = animeFavorites || [];
    user.mangaFavorites = mangaFavorites || [];
    user.manhwaFavorites = manhwaFavorites || [];

    await user.save();

    res.json({
      message: "Favorites updated successfully.",
      favorites: {
        animeFavorites: user.animeFavorites,
        mangaFavorites: user.mangaFavorites,
        manhwaFavorites: user.manhwaFavorites,
      },
    });
  } catch (error) {
    console.error(
      "Update favorites error:",
      error.message
    );

    res.status(500).json({
      message: "Server error while updating favorites.",
    });
  }
});
module.exports = router;