const mongoose = require("mongoose");

const readingProgressItemSchema = new mongoose.Schema(
  {
    progress: {
      type: Number,
      default: 0,
    },

    title: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    animeFavorites: {
      type: [String],
      default: [],
    },

    mangaFavorites: {
      type: [String],
      default: [],
    },

    manhwaFavorites: {
      type: [String],
      default: [],
    },

    readingProgress: {
      anime: {
        type: Map,
        of: readingProgressItemSchema,
        default: {},
      },

      manga: {
        type: Map,
        of: readingProgressItemSchema,
        default: {},
      },

      manhwa: {
        type: Map,
        of: readingProgressItemSchema,
        default: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);