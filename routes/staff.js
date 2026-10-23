const express = require("express");
const { ROLES, requireRole } = require("../middleware/auth");

const router = express.Router();

// Equipment management: lab staff and department leads
router.get(
  "/equipment",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  (req, res) => {
    res.json({ message: "Equipment management", equipment: [] });
  }
);

// Department features: department leads only
router.get("/department", requireRole(ROLES.DEPARTMENT_LEAD), (req, res) => {
  res.json({ message: "Department overview" });
});

module.exports = router;
