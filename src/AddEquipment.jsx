
import React, { useState } from "react";

const AddEquipment = () => {
    const [formData, setFormData] = useState({
        name: "",
        asset_tag: "",
        description: "",
        status: "available",
        equipment_condition: "good"
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");
        setError("");

        try {
            const response = await fetch(
                "http://localhost:3000/equipment",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to add equipment"
                );
            }

            setMessage("Equipment added successfully!");

            setFormData({
                name: "",
                asset_tag: "",
                description: "",
                status: "available",
                equipment_condition: "good"
            });

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Add Equipment</h2>

            {message && (
                <p style={{ color: "green" }}>{message}</p>
            )}

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            <form onSubmit={handleSubmit}>

                <div>
                    <label>Equipment Name:</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        maxLength={150}
                        required
                    />
                </div>

                <div>
                    <label>Asset Tag:</label>
                    <input
                        type="text"
                        name="asset_tag"
                        value={formData.asset_tag}
                        onChange={handleChange}
                        maxLength={100}
                        required
                    />
                </div>

                <div>
                    <label>Description:</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>

                <div>
                    <label>Status:</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="available">Available</option>
                        <option value="checked_out">Checked Out</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="retired">Retired</option>
                    </select>
                </div>

                <div>
                    <label>Equipment Condition:</label>
                    <select
                        name="equipment_condition"
                        value={formData.equipment_condition}
                        onChange={handleChange}
                    >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="poor">Poor</option>
                        <option value="damaged">Damaged</option>
                    </select>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Equipment"}
                </button>

            </form>
        </div>
    );
};

export default AddEquipment;
