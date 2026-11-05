import { useEffect, useState } from "react";

/**
 * Displays active equipment loans for authorized staff.
 * Staff will use this page to select equipment for check-in.
 */
export default function CheckInEquipment() {
  const [loans, setLoans] = useState([]);
  // Track the loan selected by staff for equipment check-in.
  const [selectedLoan, setSelectedLoan] = useState(null);
  // Track the return condition required by the existing backend.
  const [condition, setCondition] = useState("");

  // Prevent duplicate submissions while processing a return.
  const [submitting, setSubmitting] = useState(false);

  // Display confirmation after a successful equipment return.
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Retrieve active loans when the component first loads.
    async function fetchActiveLoans() {
      try {
        const response = await fetch("http://localhost:3000/loans/active", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to retrieve active equipment loans.");
        }

        const data = await response.json();
        setLoans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveLoans();
  }, []);

  /**
   * Complete the selected equipment loan through the existing
   * staff-protected return endpoint.
   */
  async function handleCheckIn() {
    if (!selectedLoan || !condition || submitting) {
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // Use the loan's primary key, not the equipment ID.
      const response = await fetch(
        `http://localhost:3000/loans/${selectedLoan.id}/return`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ condition }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to check in equipment.");
      }

      // Remove the completed loan from the active-loans table.
      setLoans((currentLoans) =>
        currentLoans.filter((loan) => loan.id !== selectedLoan.id),
      );

      // Reset the form after a successful return.
      setSelectedLoan(null);
      setCondition("");

      setSuccess("Equipment checked in successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading active equipment loans...</p>;
  }

  return (
    <main>
      <h1>Equipment Check-In</h1>

      <p>Select an active equipment loan to process its return.</p>

      {/* Provide feedback after a check-in attempt. */}
      {success && <p role="status">{success}</p>}
      {error && <p role="alert">{error}</p>}

      {loans.length === 0 ? (
        <p>There are currently no active equipment loans.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Equipment</th>
              <th>Asset Tag</th>
              <th>Borrower</th>
              <th>Due Date</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.id}</td>
                <td>{loan.equipment_name}</td>
                <td>{loan.asset_tag}</td>
                <td>{loan.borrower_name}</td>
                <td>{new Date(loan.due_date).toLocaleDateString()}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset the condition and messages when selecting a loan.
                      setSelectedLoan(loan);
                      setCondition("");
                      setError("");
                      setSuccess("");
                    }}
                  >
                    Check In
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Show the selected equipment before completing its return. */}
      {selectedLoan && (
        <section>
          <h2>Confirm Equipment Check-In</h2>

          <p>Equipment: {selectedLoan.equipment_name}</p>
          <p>Asset Tag: {selectedLoan.asset_tag}</p>
          <p>Borrower: {selectedLoan.borrower_name}</p>

          {/* The current backend requires a condition to process a return. */}
          <div>
            <label htmlFor="return-condition">Return Condition: </label>

            <select
              id="return-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              disabled={submitting}
            >
              <option value="">Select condition</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleCheckIn}
            disabled={!condition || submitting}
          >
            {submitting ? "Processing..." : "Confirm Check-In"}
          </button>

          <button type="button" onClick={() => setSelectedLoan(null)}>
            Cancel
          </button>
        </section>
      )}
    </main>
  );
}
