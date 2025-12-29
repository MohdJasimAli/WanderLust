const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlist";

async function initDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to MongoDB");

    await Listing.deleteMany({});

    // ✅ Use a real existing user as owner
    const owner = await User.findOne();
    if (!owner) {
      throw new Error("No users found. Please register a user first.");
    }

    const fixedData = initData.data.map(obj => ({
      ...obj,
      owner: owner._id,
      image: {
        url: obj.image?.url || "https://via.placeholder.com/800x600",
        filename: obj.image?.filename || "seed-image",
      },
    }));

    await Listing.insertMany(fixedData);

    console.log("Database initialized successfully");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Error initializing DB:", err);
    await mongoose.connection.close();
  }
}

initDB();
