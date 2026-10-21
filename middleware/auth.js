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
  const id = req.session.userId;
  const role = req.session.role;
  console.log("id: "+ id);
  console.log("role: "+ role);
  console.log(req.session)


  


  if (!id) {
    console.log(id)
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!VALID_ROLES.includes(role)) {
    return res.status(403).json({ error: "Unrecognized role" });
  }

  console.log("passed auth");
  req.user = { id, role };
  console.log(req.user)
  next();
}

function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required (require role)" });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}

module.exports = { ROLES, authenticate, requireRole };