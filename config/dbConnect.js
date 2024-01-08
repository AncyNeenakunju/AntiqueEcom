const mongoose = require("mongoose");
require("dotenv/config");

const connectionString = process.env.CONNECTION_STRING;
const databaseName = "E-SHOP";

const dbconnect = async () => {
  try {
    const conn = await mongoose.connect(`${connectionString}/${databaseName}`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("DB connected successfully");
  } catch (error) {
    console.error("Database error:", error.message);
  }
};

module.exports = dbconnect;
