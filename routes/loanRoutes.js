const express = require("express");
const router = express.Router();
const {
  getOverdueLoans,
  getEquipmentHistory,
  returnEquipment,
  checkoutEquipment,
  getActiveLoans,
} = require("../controllers/loanControllers");
const { ROLES, requireRole } = require("../middleware/auth");

// Allow authorized staff to view active equipment loans for check-in.
router.get(
  "/loans/active",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  getActiveLoans,
);

router.get(
  "/loans/overdue",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  getOverdueLoans,
);

router.get(
  "/equipment/:id/history",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  getEquipmentHistory,
);

router.post(
  "/loans/checkout",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  checkoutEquipment,
);

router.patch(
  "/loans/:id/return",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  returnEquipment,
);

module.exports = router;
