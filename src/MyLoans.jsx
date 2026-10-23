import { useEffect, useState } from 'react';

const formatDate = (value) => new Date(value).toLocaleDateString();

export default function MyLoans() {
  const [loans, setLoans] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/loans/my', {
      credentials: 'include',
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load loans');
        setLoans(data.loans);
        setMessage(data.message || '');
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>{error}</p>;
  if (!loans) return <p>Loading...</p>;

  return (
    <div>
      <h1>My Loans</h1>
      {loans.length === 0 ? (
        <p>{message || 'You currently have no active loans.'}</p>
      ) : (
        <ul>
          {loans.map((loan, i) => (
            <li key={i}>
              <strong>{loan.item_name}</strong> — checked out {formatDate(loan.checkout_date)},
              due {formatDate(loan.due_date)} ({loan.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
