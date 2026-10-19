const ROLES = Object.freeze({
  BORROWER: "borrower",
  LAB_STAFF: "lab_staff",
  DEPARTMENT_LEAD: "department_lead"
});

const VALID_ROLES = Object.values(ROLES);

// TEMPORARY identity source until real authentication exists:
// the caller supplies X-User-Id and X-User-Role headers.
// Swap this function for session/token logic later; requireRole stays the same.
function authenticate(req, res, next) {
  const id = Number.parseInt(req.get("X-User-Id"), 10);
  const role = req.get("X-User-Role");

  if (!Number.isInteger(id) || !role) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(403).json({ error: "Unrecognized role" });
  }

  req.user = { id, role };
  next();
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { ROLES, authenticate, requireRole };
