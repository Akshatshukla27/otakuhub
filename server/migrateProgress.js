require("dotenv").config();

const mongoose = require("mongoose");

const migrateProgress = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected.");

    const users = await mongoose.connection
      .collection("users")
      .find({})
      .toArray();

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      const oldProgress =
        user.readingProgress || {};

      const newProgress = {
        anime: {},
        manga: {},
        manhwa: {},
      };

      for (const type of [
        "anime",
        "manga",
        "manhwa",
      ]) {
        const oldType =
          oldProgress[type] || {};

        for (const [id, item] of Object.entries(
          oldType
        )) {
          if (
            item !== null &&
            typeof item === "object" &&
            !Array.isArray(item)
          ) {
            newProgress[type][id] = {
              progress: Number(
                item.progress || 0
              ),
              title: item.title || "",
              image: item.image || "",
            };
          } else {
            newProgress[type][id] = {
              progress: Number(item || 0),
              title: "",
              image: "",
            };
          }
        }
      }

      await mongoose.connection
        .collection("users")
        .updateOne(
          { _id: user._id },
          {
            $set: {
              readingProgress: newProgress,
            },
          }
        );

      console.log(
        `✅ Migrated user: ${
          user.username || user.email
        }`
      );
    }

    console.log(
      "🎉 Reading progress migration complete!"
    );
  } catch (error) {
    console.error(
      "❌ Migration failed:",
      error
    );
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

migrateProgress();