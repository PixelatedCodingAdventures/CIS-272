import React, {useState} from 'react';


const UserHistory = () => {

    const [loans, setLoans] = useState([])
    const [equipment, setEquipment] = useState([])
    const [submitted, setSubmitted ] = useState(false)
    const [formData, setFormData] = useState({
              borrower_id: 0
        })
    const formatDate = (date) => {
        if (!date) return "N/A"
    
        return String(date).slice(0, 10)
    }
    const formatCondition = (condition) => {
        if (!condition) return "N/A"

        return condition
    }  
    const grabName = (id) => {
        const targetName = equipment.find(equipment => equipment.id === id)

        return targetName.name
    }
    const grabAssetTag = (id) => {
        const targetAssetTag = equipment.find(equipment => equipment.id === id)

        return targetAssetTag.asset_tag
    }
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
              
        });
          
    };
  
      const handleSubmit = async (e) => {
          e.preventDefault();
          setSubmitted(true)
          setLoans([])
          try {
              const API_URL = 'http://localhost:3000'
              const response1 = await fetch(`${API_URL}/loans/borrower/history/${formData.borrower_id}`, {
                  method: "GET",
                  credentials: "include",
                  headers: {
                      "Content-Type": "application/json"
                  },  
              })
              const data1 = await response1.json();
              if(!response1.ok) {
                  throw new Error(data1.message || "Failed to grab data.");   
              }
              const response2 = await fetch(`${API_URL}/equipment`, {
                  method: "GET",
                  credentials: "include",
                  headers: {
                      "Content-Type": "application/json"
                  },  
              })
              const data2 = await response2.json();
              if(!response2.ok) {
                  throw new Error(data2.message || "Failed to grab data.");   
              }
              setLoans(data1)
              setEquipment(data2)
          } catch (error) {   
              console.log(error)
          }   
      }
      const sortedLoans = [...loans].sort((a, b) => {
        return b.checkout_date - a.checkout_date
      })
  
      return(
          <div>
              <h2>User History</h2>
  
              <form onSubmit={handleSubmit}>
                  <div>
                      <label>User ID</label> - 
                      <input type="number" name="borrower_id" value={formData.borrower_id} onChange={handleChange}/>
                  </div>
                  <button type="submit">Check</button>
              </form>
              
              {submitted && (
                <div>
                    {sortedLoans.length === 0 ? (
                        <p>User ID provided does not have a history.</p>
                    ) : (
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
              <th>ID</th>
              <th>Equipment ID</th>
              <th>Name</th>
              <th>Asset Tag</th>
              <th>Checkout Date</th>
              <th>Due Date</th>
              <th>Return Date</th>
              <th>Return Condition</th>
            </tr>
          </thead>
          <tbody>
            
            {sortedLoans.map((item) => (
                <tr>
                    <td>{item.id}</td>
                    <td>{item.equipment_id}</td>
                    <td>{grabName(item.equipment_id)}</td>
                    <td>{grabAssetTag(item.equipment_id)}</td>
                    <td>{formatDate(item.checkout_date)}</td>
                    <td>{formatDate(item.due_date)}</td>
                    <td>{formatDate(item.return_date)}</td>
                    <td>{formatCondition(item.return_condition)}</td>
                </tr>
            ))}
          </tbody>
          
        </table>
        )}
                </div>
              )}
          </div>
      )
};

export default UserHistory;
