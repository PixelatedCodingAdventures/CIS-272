require("dotenv").config();

const fs = require("fs");
const pool = require("./db");

async function migrate() {
  try {
    const sql = fs.readFileSync(
      "./migrations/001_initial.sql",
      "utf8"
    );

    await pool.query(sql);

    console.log("Migration completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();