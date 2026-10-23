const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ROLES, requireRole } = require("../middleware/auth");

// GET /loans/my - borrowers see only their own loans
router.get("/my", requireRole(ROLES.BORROWER), async (req, res) => {
  try {
    const borrowerId = req.user.id;

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
         AND l.return_date IS NULL
       ORDER BY l.due_date ASC`,
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
