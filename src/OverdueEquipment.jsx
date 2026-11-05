
import { useEffect, useState } from "react";

function OverdueEquipment() {
  const [loans, setLoans] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOverdueEquipment() {
      try {
        const response = await fetch(
          "http://localhost:3000/loans/overdue",
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load overdue equipment.");
        }

        const data = await response.json();
        setLoans(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOverdueEquipment();
  }, []);

  // Sort overdue equipment by number of days late.
  const sortedLoans = [...loans].sort((a, b) => {
    if (sortOrder === "desc") {
      return b.days_overdue - a.days_overdue;
    }

    return a.days_overdue - b.days_overdue;
  });

  // Display MySQL dates without timezone conversion.
  const formatDate = (date) => {
    if (!date) return "N/A";

    return String(date).slice(0, 10);
  };

  if (loading) {
    return <p>Loading overdue equipment...</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Overdue Equipment</h1>

      <p>
        View equipment that has not been returned by its due date.
      </p>

      <label htmlFor="sortOrder">Sort by: </label>

      <select
        id="sortOrder"
        value={sortOrder}
        onChange={(e) => setSortOrder(e.target.value)}
      >
        <option value="desc">Most Overdue First</option>
        <option value="asc">Least Overdue First</option>
      </select>

      <p>Total overdue loans: {loans.length}</p>

      {sortedLoans.length === 0 ? (
        <p>No overdue equipment found.</p>
      ) : (
        <table
          border="1"
          cellPadding="10"
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "20px",
          }}
        >
          <thead>
            <tr>
              <th>Equipment ID</th>
              <th>Equipment Name</th>
              <th>Borrower ID</th>
              <th>Due Date</th>
              <th>Days Overdue</th>
            </tr>
          </thead>

          <tbody>
            {sortedLoans.map((loan) => (
              <tr key={loan.id}>
                <td>{loan.equipment_id}</td>
                <td>{loan.equipment_name}</td>
                <td>{loan.borrower_id}</td>
                <td>{formatDate(loan.due_date)}</td>
                <td style={{ color: "red", fontWeight: "bold" }}>
                  {loan.days_overdue} days
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OverdueEquipment;
