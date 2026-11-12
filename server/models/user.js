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

    // WATCHLIST
    watchlist: {
      type: [
        {
          itemId: {
            type: String,
            required: true,
          },

          category: {
            type: String,
            enum: ["Anime", "Manga", "Manhwa"],
            required: true,
          },

          title: {
            type: String,
            required: true,
          },

          image: {
            type: String,
            default: "",
          },

          status: {
            type: String,
            enum: [
              "Watching",
              "Completed",
              "Plan to Watch",
              "On Hold",
              "Dropped",
            ],
            default: "Plan to Watch",
          },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);