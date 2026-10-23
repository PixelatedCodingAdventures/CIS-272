
import React, { useState } from "react";


const Users = () => {

  


    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "borrower"
    });

    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:3000/users", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create user");
            }

            setMessage("User created successfully!");

            setFormData({
                name: "",
                email: "",
                password: "",
                role: "borrower"
            });

        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <div>

        
            
            <h2>Create User</h2>

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Role:</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="borrower">Borrower</option>
                        <option value="lab_staff">Lab Staff</option>
                        <option value="department_lead">
                            Department Lead
                        </option>
                    </select>
                </div>

                <button type="submit">Create User</button>
            </form>

            {message && <p>{message}</p>}
        </div>
    );
};

export default Users;
