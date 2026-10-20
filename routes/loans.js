const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ROLES, requireRole } = require("../middleware/auth");

// GET /loans/my - current loans (active or overdue) for the logged-in borrower.
// Registered before the original handler below, so it takes precedence.
// Pass ?status=all to also include returned loans.
router.get("/my", requireRole(ROLES.BORROWER), async (req, res) => {
  try {
    const includeReturned = req.query.status === "all";

    const [rows] = await pool.query(
      `SELECT
         e.name AS item_name,
         l.checkout_date,
         l.due_date,
         CASE
           WHEN l.return_date IS NOT NULL THEN 'returned'
           WHEN l.due_date < NOW() THEN 'overdue'
           ELSE 'active'
         END AS status
       FROM loans l
       JOIN equipment e ON e.id = l.equipment_id
       WHERE l.borrower_id = ?
         ${includeReturned ? "" : "AND l.return_date IS NULL"}
       ORDER BY l.due_date ASC`,
      [req.user.id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.json({
        message: "You currently have no active loans.",
        loans: []
      });
    }

    res.json({ loans: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

// GET /loans/my - borrowers see only their own loans
router.get("/my", requireRole(ROLES.BORROWER), async (req, res) => {
  try {
    const borrowerId = req.user.id;

    const [rows] = await pool.query(
      "SELECT item_name, checkout_date, due_date, status FROM loans WHERE borrower_id = ?",
      [borrowerId]
    );

    if (rows.length === 0) {
      return res.json({
        message: "You currently have no active loans.",
        loans: []
      });
    }

    res.json({ loans: rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

module.exports = router;
