
const pool = require("../db");

describe("Database schema and migrations", () => {
  // Verify that all required application tables exist.
  test("Required database tables exist", async () => {
    const [rows] = await pool.query("SHOW TABLES");

    const tableNames = rows.map((row) => Object.values(row)[0]);

    expect(tableNames).toEqual(
      expect.arrayContaining([
        "users",
        "equipment",
        "loans",
        "schema_migrations",
      ]),
    );
  });

  // Verify that all four migration files were recorded.
  test("All database migrations are tracked", async () => {
    const [rows] = await pool.query(
      "SELECT filename FROM schema_migrations ORDER BY filename",
    );

    const migrationNames = rows.map((row) => row.filename);

    expect(migrationNames).toEqual(
      expect.arrayContaining([
        "001_initial.sql",
        "002_create_users.sql",
        "003_create_equipment.sql",
        "004_create_loans.sql",
      ]),
    );
  });

  // Verify that a loan cannot reference a nonexistent borrower.
  test("Loans reject invalid borrower IDs", async () => {
    await expect(
      pool.query(
        `INSERT INTO loans (borrower_id, equipment_id, due_date)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [999999999, 999999999],
      ),
    ).rejects.toMatchObject({
      code: "ER_NO_REFERENCED_ROW_2",
    });
  });

  // Verify that a loan cannot reference nonexistent equipment.
  test("Loans reject invalid equipment IDs", async () => {
    // Create a temporary borrower for the foreign key test.
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      ["Foreign Key Test", "fk-test@example.com", "test_hash"],
    );

    try {
      await expect(
        pool.query(
          `INSERT INTO loans (borrower_id, equipment_id, due_date)
           VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [result.insertId, 999999999],
        ),
      ).rejects.toMatchObject({
        code: "ER_NO_REFERENCED_ROW_2",
      });
    } finally {
      // Always remove the temporary borrower.
      await pool.query("DELETE FROM users WHERE id = ?", [result.insertId]);
    }
  });

  // Verify that a loan's due date cannot precede its checkout date.
  test("Loans reject due dates before checkout dates", async () => {
    // Create temporary borrower and equipment records.
    const [userResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      ["Date Test Borrower", "date-test@example.com", "test_hash"],
    );

    let equipmentId;

    try {
      const [equipmentResult] = await pool.query(
        `INSERT INTO equipment (name, asset_tag)
         VALUES (?, ?)`,
        ["Date Test Laptop", "DATE-TEST-001"],
      );

      equipmentId = equipmentResult.insertId;

      // Attempt a loan with an invalid due date.
      await expect(
        pool.query(
          `INSERT INTO loans
           (borrower_id, equipment_id, checkout_date, due_date)
           VALUES (?, ?, ?, ?)`,
          [
            userResult.insertId,
            equipmentId,
            "2026-10-15 12:00:00",
            "2026-10-14 12:00:00",
          ],
        ),
      ).rejects.toMatchObject({
        code: "ER_CHECK_CONSTRAINT_VIOLATED",
      });
    } finally {
      // Remove temporary records even if the test fails.
      if (equipmentId !== undefined) {
        await pool.query("DELETE FROM equipment WHERE id = ?", [equipmentId]);
      }

      await pool.query("DELETE FROM users WHERE id = ?", [userResult.insertId]);
    }
  });

  // Verify that equipment cannot have multiple active loans.
  test("Equipment cannot have duplicate active loans", async () => {
    const [userResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [
        "Duplicate Loan Test",
        `duplicate-${Date.now()}@example.com`,
        "test_hash",
      ],
    );

    let equipmentId;

    try {
      const [equipmentResult] = await pool.query(
        `INSERT INTO equipment (name, asset_tag)
         VALUES (?, ?)`,
        ["Duplicate Test Laptop", `DUP-${Date.now()}`],
      );

      equipmentId = equipmentResult.insertId;

      // Create the first active loan.
      await pool.query(
        `INSERT INTO loans (borrower_id, equipment_id, due_date)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userResult.insertId, equipmentId],
      );

      // A second active loan for the same equipment must fail.
      await expect(
        pool.query(
          `INSERT INTO loans (borrower_id, equipment_id, due_date)
           VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
          [userResult.insertId, equipmentId],
        ),
      ).rejects.toMatchObject({
        code: "ER_DUP_ENTRY",
      });
    } finally {
      // Remove loans before their referenced records.
      if (equipmentId !== undefined) {
        await pool.query("DELETE FROM loans WHERE equipment_id = ?", [
          equipmentId,
        ]);

        await pool.query("DELETE FROM equipment WHERE id = ?", [equipmentId]);
      }

      await pool.query("DELETE FROM users WHERE id = ?", [userResult.insertId]);
    }
  });

  // Verify returned equipment can be checked out again.
  test("Returned equipment can be checked out again", async () => {
    const [userResult] = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      ["Return Test Borrower", `return-${Date.now()}@example.com`, "test_hash"],
    );

    let equipmentId;

    try {
      const [equipmentResult] = await pool.query(
        `INSERT INTO equipment (name, asset_tag)
         VALUES (?, ?)`,
        ["Return Test Laptop", `RETURN-${Date.now()}`],
      );

      equipmentId = equipmentResult.insertId;

      // Create the original active loan.
      const [firstLoan] = await pool.query(
        `INSERT INTO loans (borrower_id, equipment_id, due_date)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userResult.insertId, equipmentId],
      );

      // Return the equipment.
      await pool.query(
        `UPDATE loans
         SET return_date = NOW(), return_condition = 'good'
         WHERE id = ?`,
        [firstLoan.insertId],
      );

      // The same equipment should now be available for another loan.
      const [secondLoan] = await pool.query(
        `INSERT INTO loans (borrower_id, equipment_id, due_date)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [userResult.insertId, equipmentId],
      );

      expect(secondLoan.affectedRows).toBe(1);

      // Confirm both loan records remain in the database.
      const [loans] = await pool.query(
        `SELECT id, return_date
         FROM loans
         WHERE equipment_id = ?
         ORDER BY id`,
        [equipmentId],
      );

      expect(loans).toHaveLength(2);
      expect(loans[0].return_date).not.toBeNull();
      expect(loans[1].return_date).toBeNull();
    } finally {
      // Remove temporary loans, equipment, and borrower.
      if (equipmentId !== undefined) {
        await pool.query("DELETE FROM loans WHERE equipment_id = ?", [
          equipmentId,
        ]);

        await pool.query("DELETE FROM equipment WHERE id = ?", [equipmentId]);
      }

      await pool.query("DELETE FROM users WHERE id = ?", [userResult.insertId]);
    }
  });

  // Close this test file's database connection pool.
  afterAll(async () => {
    await pool.end();
  });
});
