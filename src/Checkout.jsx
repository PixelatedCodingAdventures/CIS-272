import React, { useState } from "react";


const Checkout = () => {

    const [formData, setFormData] = useState({
            equipment_id: 0,
            borrower_id: 0,
            due_date: ""
        })
    
    const [message, setMessage] = useState("")

    const [formError, setFormError] = useState("")

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
            
        });
        
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("")
        
         try {
            const API_URL = 'http://localhost:3000'
            const response = await fetch(`${API_URL}/loans/checkout`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json();

            if(!response.ok) {
                
                throw new Error(data.message || "Failed to checkout.");
                
                
            }

            setMessage("Checked out successfully!")

            setFormData({
                equipment_id: 0,
                borrower_id: 0,
                due_date: ""
            })
            
        } catch (error) {
            setMessage(error.toString())
            console.log(error)
        }
            
        //console.log(formData)
    }

    return(
        <div>
            <h2>Checkout Equipment</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Equipment ID</label> - 
                    <input type="number" name="equipment_id" value={formData.equipment_id} onChange={handleChange}/>
                </div>
                <div>
                    <label>User ID of Borrower</label> - 
                    <input type="number" name="borrower_id" value={formData.borrower_id} onChange={handleChange}/>
                </div>
                <div>
                    <label>Return Date</label> - 
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleChange}/>
                </div>
                <button type="submit">Checkout</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    )
}

export default Checkout;