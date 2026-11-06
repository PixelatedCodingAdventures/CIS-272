const pool = require("../db");

exports.checkoutEquipment = async (req, res) => {
  let connection;
  let transactionStarted = false;
  try {
    const { equipment_id, borrower_id, due_date } = req.body;
    // Require a due date before attempting to create a loan.
    // Reject missing or empty values instead of allowing a database error.
    if (typeof due_date !== "string" || due_date.trim() === "") {
      return res.status(400).json({
        message: "A due date is required for equipment checkout.",
      });
    }

    // Verify the expected format before attempting to parse the date.
    // This prevents malformed input from reaching date conversion methods.
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!datePattern.test(due_date)) {
      return res.status(400).json({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    const parsedDate = new Date(`${due_date}T00:00:00Z`);

    // Reject invalid calendar dates, including dates such as February 30.
    // Check parsing succeeded before converting the date back to a string.
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== due_date
    ) {
      return res.status(400).json({
        message: "Due date must be a valid date in YYYY-MM-DD format.",
      });
    }

    // Ensure the due date is not earlier than the current checkout date.
    // This matches the database constraint requiring due_date >= checkout_date.
    const today = new Date().toISOString().slice(0, 10);

    // Date-only values are stored at midnight, so today's date would violate
    // the database constraint requiring the due date to follow checkout time.
    if (due_date <= today) {
      return res.status(400).json({
        // Explain that date-only checkout requests require a future due date.
        message: "Due date must be later than today's date.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Check equipment availability and lock the row.
    const [equipmentRows] = await connection.query(
      "SELECT * FROM equipment WHERE id = ? FOR UPDATE",
      [equipment_id],
    );

    if (equipmentRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({
        message: "Equipment not found.",
      });
    }

    if (equipmentRows[0].status !== "available") {
      await connection.rollback();
      transactionStarted = false;
      return res.status(409).json({
        message: "Equipment is not available.",
      });
    }

    // Verify borrower exists.
    const [userRows] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [borrower_id],
    );

    if (userRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({
        message: "Borrower not found.",
      });
    }

    // Insert loan record.
    await connection.execute(
      `INSERT INTO loans
         (borrower_id, equipment_id, due_date)
         VALUES (?, ?, ?)`,
      [borrower_id, equipment_id, due_date],
    );

    // Update equipment status.
    await connection.execute("UPDATE equipment SET status = ? WHERE id = ?", [
      "checked_out",
      equipment_id,
    ]);

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: "Equipment checked out successfully!",
    });
  } catch (error) {
    console.error(error);

    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

/**
 * Retrieve all active equipment loans for authorized staff.
 * A loan remains active until its return_date is recorded.
 */
exports.getActiveLoans = async (req, res) => {
  try {
    // Retrieve active loans along with equipment and borrower details.
    // Only loans without a return date are eligible for check-in.
    const [loans] = await pool.query(
      `SELECT
         l.id,
         l.borrower_id,
         l.equipment_id,
         l.checkout_date,
         l.due_date,
         e.name AS equipment_name,
         e.asset_tag,
         u.name AS borrower_name
       FROM loans AS l
       INNER JOIN equipment AS e ON l.equipment_id = e.id
       INNER JOIN users AS u ON l.borrower_id = u.id
       WHERE l.return_date IS NULL
       ORDER BY l.checkout_date ASC`,
    );

    // Return the active loans, including an empty list if none exist.
    return res.status(200).json(loans);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
};

exports.returnEquipment = async (req, res) => {
  let connection;
  let transactionStarted = false;
  try {
    // Identify the specific loan selected by staff for check-in.
    const loanId = req.params.id;
    // Normalize the staff-recorded return condition.
    const condition =
      typeof req.body.condition === "string"
        ? req.body.condition.trim().toLowerCase()
        : "";

    // Optional notes describing damage, missing parts, or other issues.
    const conditionNotes = req.body.conditionNotes;
    // Validate the return condition before opening a database transaction.
    // Reject missing or non-string values to prevent toLowerCase() errors.
    if (typeof condition !== "string" || condition.trim() === "") {
      return res.status(400).json({
        message: "A valid return condition is required.",
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    // Lock the selected active loan to prevent concurrent returns.
    const [loanRows] = await connection.query(
      "SELECT * FROM loans WHERE id = ? AND return_date IS NULL FOR UPDATE",
      [loanId],
    );

    if (loanRows.length === 0) {
      await connection.rollback();
      transactionStarted = false;
      return res.status(404).json({
        message: "No active loans with the id provided.",
      });
    }

    // Retrieve the equipment ID associated with the selected active loan.
    const equipmentId = loanRows[0].equipment_id;

    // Accept existing equipment conditions and the new check-in conditions.
    const validConditions = [
      "excellent",
      "good",
      "fair",
      "poor",
      "damaged",
      "working",
      "missing_parts",
    ];

    if (!validConditions.includes(condition)) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(406).json({
        message: "Invalid return condition.",
      });
    }

    // Condition notes are optional, but must be text when provided.
    if (
      conditionNotes !== undefined &&
      conditionNotes !== null &&
      typeof conditionNotes !== "string"
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: "Condition notes must be text.",
      });
    }

    // Preserve the existing equipment condition when the selected
    // return condition is not supported by the equipment table.
    const equipmentCondition = [
      "excellent",
      "good",
      "fair",
      "poor",
      "damaged",
    ].includes(condition)
      ? condition
      : null;

    await connection.execute(
      `UPDATE equipment
   SET
     status = 'available',
     equipment_condition = COALESCE(?, equipment_condition)
   WHERE id = ?`,
      [equipmentCondition, equipmentId],
    );

    // Record the return date, selected condition, and optional notes.
    // The generated active_equipment_id becomes NULL automatically.
    await connection.execute(
      `UPDATE loans
   SET
     return_date = NOW(),
     return_condition = ?,
     return_condition_notes = ?
   WHERE id = ? AND return_date IS NULL`,
      [condition, conditionNotes?.trim() || null, loanId],
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: "Equipment returned successfully!",
    });
  } catch (error) {
    console.error(error);

    if (connection && transactionStarted) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getOverdueLoans = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT
          l.*,
          e.name AS equipment_name,
          DATEDIFF(CURDATE(), DATE(l.due_date)) AS days_overdue
       FROM loans l
       JOIN equipment e ON l.equipment_id = e.id
       WHERE DATE(l.due_date) < CURDATE()
         AND l.return_date IS NULL
       ORDER BY days_overdue DESC, l.id ASC`,
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error retrieving overdue loans:", error);

    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
};

exports.getEquipmentHistory = async (req, res) => {
  try {
    const equipmentID = req.params.id;

    const check = await pool.query("SELECT * FROM equipment WHERE id = ?", [
      equipmentID,
    ]);

    if (check[0].length === 0) {
      // Stop execution after sending a 404 response for nonexistent equipment.
      // This prevents the controller from attempting to send another response.
      return res
        .status(404)
        .json({ message: "No equipment found with id " + equipmentID });
    }

    const output = await pool.query(
      "SELECT * FROM loans WHERE equipment_id = ?",
      [equipmentID],
    );
    if (output[0].length === 0) {
      // Stop execution after sending a 404 response when no loan history exists.
      return res
        .status(404)
        .json({ message: "No loan history found with id " + equipmentID });
    } else {
      // Return the equipment's loan history when records are found.
      return res.status(200).json(output[0]);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "An internal server error occurred.",
    });
  }
};
