const ROLES = Object.freeze({
  BORROWER: "borrower",
  LAB_STAFF: "lab_staff",
  DEPARTMENT_LEAD: "department_lead"
});

const VALID_ROLES = Object.values(ROLES);

function authenticate(req, res, next) {
  const session = req.session;
  if (!session || !Number.isInteger(session.userId) || session.userId <= 0) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const { userId: id, role } = session;
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
