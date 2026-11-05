import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import { useUser } from "./context/UserContext";

import Home from "./Home";
import About from "./About";
import Example from "./Example";
import MyLoans from "./MyLoans";
import AddUser from "./AddUser";
import ViewUsers from "./ViewUsers";
import AddEquipment from "./AddEquipment";
import ViewEquipment from "./ViewEquipment";
import Login from "./Login";
import Logout from "./Logout";

// Sprint 3 features: equipment check-in and overdue tracking.
import CheckInEquipment from "./CheckInEquipment";
import OverdueEquipment from "./OverdueEquipment";

import "./App.css";

// Protect routes that require login.
function ProtectedRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return <p>Checking session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Restrict staff functionality to authorized roles.
function StaffRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return <p>Checking session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!["lab_staff", "department_lead"].includes(user.role)) {
    return <p>Access denied.</p>;
  }

  return children;
}

// Restrict borrower loan information to borrower accounts.
function BorrowerRoute({ children }) {
  const { user, loading } = useUser();

  if (loading) {
    return <p>Checking session...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "borrower") {
    return <p>Access denied.</p>;
  }

  return children;
}

export default function App() {
  const { user, loading } = useUser();

  return (
    <BrowserRouter>
      {/* Navigation Bar */}
      <nav>
        <Link to="/">Home</Link> - <Link to="/about">About</Link> -{" "}
        <Link to="/example-page">Example</Link> -{" "}
        {!loading && ["lab_staff", "department_lead"].includes(user?.role) && (
          <>
            <Link to="/add-user">Add User</Link> -{" "}
            <Link to="/view-users">View Users</Link> -{" "}
            <Link to="/add-equipment">Add Equipment</Link> -{" "}
            <Link to="/overdue-equipment">Overdue Equipment</Link> -{" "}
            <Link to="/check-in-equipment">Check In Equipment</Link> -{" "}
          </>
        )}
        {!loading && user && (
          <>
            <Link to="/view-equipment">View Equipment</Link> -{" "}
          </>
        )}
        {!loading &&
          (user ? (
            <Link to="/logout">Logout</Link>
          ) : (
            <Link to="/login">Login</Link>
          ))}
        {!loading && user?.role === "borrower" && (
          <>
            {" "}
            - <Link to="/my-loans">My Loans</Link>
          </>
        )}
      </nav>

      {/* Route Switchboard */}
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/example-page" element={<Example />} />
        <Route path="/login" element={<Login />} />

        {/* Routes available to authenticated users */}
        <Route
          path="/view-equipment"
          element={
            <ProtectedRoute>
              <ViewEquipment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/logout"
          element={
            <ProtectedRoute>
              <Logout />
            </ProtectedRoute>
          }
        />

        {/* Staff-only routes */}
        <Route
          path="/add-user"
          element={
            <StaffRoute>
              <AddUser />
            </StaffRoute>
          }
        />

        <Route
          path="/view-users"
          element={
            <StaffRoute>
              <ViewUsers />
            </StaffRoute>
          }
        />

        <Route
          path="/add-equipment"
          element={
            <StaffRoute>
              <AddEquipment />
            </StaffRoute>
          }
        />

        {/* Cristian's overdue equipment feature */}
        <Route
          path="/overdue-equipment"
          element={
            <StaffRoute>
              <OverdueEquipment />
            </StaffRoute>
          }
        />

        {/* Staff equipment check-in feature */}
        <Route
          path="/check-in-equipment"
          element={
            <StaffRoute>
              <CheckInEquipment />
            </StaffRoute>
          }
        />

        {/* Borrower-only routes */}
        <Route
          path="/my-loans"
          element={
            <BorrowerRoute>
              <MyLoans />
            </BorrowerRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
