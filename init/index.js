require("dotenv").config();
const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const { getGeometry } = require("../utils/geometry.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

async function initDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("Connected to DB");

    for (const obj of initData.data) {
      const geometry = await getGeometry(obj.location, obj.country);

      if (!geometry) {
        console.log(`Skipping "${obj.title}": geometry not found`);
        continue;
      }

      await Listing.findOneAndUpdate(
        { title: obj.title },
        {
          ...obj,
          geometry,
          owner: "6abc9dab0b1d0f6d520c2b6b",
        },
        {
  upsert: true,
  returnDocument: "after",
  runValidators: true
}
      );
    }

    console.log("Seed data initialized");
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

initDB();
