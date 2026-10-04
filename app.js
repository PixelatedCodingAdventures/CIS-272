const express = require("express");
const pool = require("./db");

const app = express();

app.get("/", (req, res) => {
  res.send("Equipment Checkout API");
});

app.get("/health", async (req, res) => {
  try {

    await pool.query("SELECT 1");
    // Are you there and able to execute a query? (SELECT 1)

    res.status(200).json({
      app: "up",
      database: "up"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      app: "up",
      database: "down"
    });
  }
});

module.exports = app;