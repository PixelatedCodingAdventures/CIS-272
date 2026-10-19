const express = require("express");
const router = express.Router();
const pool = require("../db");
const { ROLES, requireRole } = require("../middleware/auth");

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
