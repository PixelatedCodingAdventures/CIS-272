const express = require("express");
const router = express.Router();
const {
  getOverdueLoans,
  getEquipmentHistory,
  returnEquipment,
  checkoutEquipment,
  getActiveLoans,
  getBorrowerActiveLoans,
  getBorrowerLoanHistory,
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


router.get(
  "/loans/borrower/:borrower_id",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  getBorrowerActiveLoans
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

router.get(
  "/loans/borrower/history/:borrower_id",
  requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
  getBorrowerLoanHistory,
);

module.exports = router;
