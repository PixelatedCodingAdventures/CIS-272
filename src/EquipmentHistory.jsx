
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3000";

function EquipmentHistoryPage() {
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  // Load equipment inventory.
  useEffect(() => {
    async function loadEquipment() {
      try {
        const response = await fetch(`${API_URL}/equipment`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load equipment.");
        }

        const data = await response.json();
        setEquipment(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadEquipment();
  }, []);

  // Load history for the selected equipment.
  useEffect(() => {
    if (!selectedEquipment) return;

    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      setHistoryError("");
      setHistory([]);

      try {
        const response = await fetch(
          `${API_URL}/loans/history/${selectedEquipment.id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to load equipment history.");
        }

        const data = await response.json();

        if (!cancelled) {
          setHistory(data);
        }
      } catch (err) {
        if (!cancelled) {
          setHistoryError(err.message);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedEquipment]);

  // Format MySQL dates.
  const formatDate = (date) => {
    if (!date) return "Not Returned";

    return new Date(date).toLocaleString();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Equipment History</h1>

      <p>
        Select an equipment item to view its checkout and return history.
      </p>

      {loading && <p>Loading equipment...</p>}

      {error && (
        <p style={{ color: "red" }}>{error}</p>
      )}

      {!loading && !error && (
        <table
          border="1"
          cellPadding="10"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "30px",
          }}
        >
          <thead>
            <tr>
              <th>Equipment ID</th>
              <th>Name</th>
              <th>Asset Tag</th>
              <th>Status</th>
              <th>Condition</th>
              <th>History</th>
            </tr>
          </thead>

          <tbody>
            {equipment.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.name}</td>
                <td>{item.asset_tag}</td>
                <td>{item.status}</td>
                <td>{item.equipment_condition}</td>
                <td>
                  <button
                    onClick={() => setSelectedEquipment(item)}
                  >
                    View History
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedEquipment && (
        <div>
          <h2>
            History for {selectedEquipment.name}
          </h2>

          <p>
            Asset Tag: {selectedEquipment.asset_tag}
          </p>

          <button
            onClick={() => setSelectedEquipment(null)}
            style={{ marginBottom: "20px" }}
          >
            Close History
          </button>

          {historyLoading && (
            <p>Loading checkout history...</p>
          )}

          {historyError && (
            <p style={{ color: "red" }}>
              {historyError}
            </p>
          )}

          {!historyLoading &&
            !historyError &&
            history.length === 0 && (
              <p>No checkout history found.</p>
            )}

          {!historyLoading &&
            !historyError &&
            history.length > 0 && (
              <table
                border="1"
                cellPadding="10"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Borrower</th>
                    <th>Checkout Date</th>
                    <th>Due Date</th>
                    <th>Return Date</th>
                    <th>Return Condition</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((loan) => (
                    <tr key={loan.id}>
                      <td>{loan.id}</td>

                      <td>
                        {loan.borrower_name ??
                          loan.borrower_id}
                      </td>

                      <td>
                        {formatDate(loan.checkout_date)}
                      </td>

                      <td>
                        {formatDate(loan.due_date)}
                      </td>

                      <td>
                        {formatDate(loan.return_date)}
                      </td>

                      <td>
                        {loan.return_condition ?? "N/A"}
                      </td>

                      <td>
                        <strong
                          style={{
                            color:
                              loan.return_date === null
                                ? "orange"
                                : "green",
                          }}
                        >
                          {loan.return_date === null
                            ? "Active"
                            : "Returned"}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      )}
    </div>
  );
}

export default EquipmentHistoryPage;
