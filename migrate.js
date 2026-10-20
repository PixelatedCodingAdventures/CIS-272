require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./db");

async function migrate() {
  try {
    // Create a ttable to track completed database migrations.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Locate and sort all SQL migration files.
    const migrationsDirectory = path.join(__dirname, "migrations");

    const migrationFiles = fs.readdirSync(migrationsDirectory)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    // Retrieve the names of previously completed migrations.
    const [rows] = await pool.query(
      "SELECT filename FROM schema_migrations"
    );

    const completedMigrations = new Set(
      rows.map((row) => row.filename)
    );

    // Execute only migrations that have not been completed.
    for (const migrationFile of migrationFiles) {
      if (completedMigrations.has(migrationFile)) {
        console.log(`Skipping completed migration: ${migrationFile}`);
        continue;
      }

      const filePath = path.join(migrationsDirectory, migrationFile);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`Running migration: ${migrationFile}`);

      // Execute the migration before recording its completion.
      await pool.query(sql);

      await pool.query(
        "INSERT INTO schema_migrations (filename) VALUES (?)",
        [migrationFile]
      );

      console.log(`Completed migration: ${migrationFile}`);
    }

    console.log("All migrations completed successfully.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    // Close the database connection pool.
    await pool.end();
  }
}

migrate();
