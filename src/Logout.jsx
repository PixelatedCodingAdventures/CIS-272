
import React, { useState } from "react";
import { useUser } from "./context/UserContext";
import { useNavigate } from 'react-router-dom';

const Logout = () => {
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const { setUser } = useUser();
    

    const handleLogout = async () => {
        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                "http://localhost:3000/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Logout failed"
                );
            }

            setMessage("Logged out successfully!");
            setUser(null);
            navigate('/login');
            // Redirect to login page
      

        } catch (error) {
            setMessage(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleLogout}
                disabled={loading}
            >
                {loading ? "Logging out..." : "Logout"}
            </button>

            {message && <p>{message}</p>}
        </div>
    );
};

export default Logout;
