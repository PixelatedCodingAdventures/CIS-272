
import React, { useState, useEffect } from "react";

const ViewEquipment = () => {
    const [equipment, setEquipment] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

useEffect(() => {
    const fetchEquipment = async () => {
        try {
            const response = await fetch(
                "http://localhost:3000/equipment",
                {
                    credentials: "include"
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch equipment");
            }

            const data = await response.json();
            setEquipment(data);

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    fetchEquipment();
}, []);

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditData({ ...item });
        setError("");
        setMessage("");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setEditData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async (id) => {
        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:3000/equipment/${id}`,
                {
                    
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                        
                    },
                    
                    body: JSON.stringify({
                        name: editData.name,
                        asset_tag: editData.asset_tag,
                        description: editData.description,
                        status: editData.status,
                        equipment_condition:
                            editData.equipment_condition
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to update equipment"
                );
            }

            setEquipment((prev) =>
                prev.map((item) =>
                    item.id === id
                        ? { ...item, ...editData }
                        : item
                )
            );

            setEditingId(null);
            setEditData({});
            setMessage("Equipment updated successfully!");

        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(
            "Are you sure you want to delete this equipment?"
        )) {
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch(
                `http://localhost:3000/equipment/${id}`,
                {
                    method: "DELETE",
                    credentials: "include"
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to delete equipment"
                );
            }

            setEquipment((prev) =>
                prev.filter((item) => item.id !== id)
            );

            setMessage("Equipment deleted successfully!");

        } catch (error) {
            setError(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditData({});
        setError("");
    };

    if (loading) {
        return <p>Loading equipment...</p>;
    }

    return (
        <div>
            <h2>Manage Equipment</h2>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            {message && (
                <p style={{ color: "green" }}>{message}</p>
            )}

            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Asset Tag</th>
                        <th>Description</th>
                        <th>Status</th>
                        <th>Condition</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {equipment.map((item) => (
                        <tr key={item.id}>
                            <td>{item.id}</td>

                            <td>
                                {editingId === item.id ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    item.name
                                )}
                            </td>

                            <td>
                                {editingId === item.id ? (
                                    <input
                                        type="text"
                                        name="asset_tag"
                                        value={editData.asset_tag}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    item.asset_tag
                                )}
                            </td>

                            <td>
                                {editingId === item.id ? (
                                    <textarea
                                        name="description"
                                        value={editData.description || ""}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    item.description || "N/A"
                                )}
                            </td>

                            <td>
                                {editingId === item.id ? (
                                    <select
                                        name="status"
                                        value={editData.status}
                                        onChange={handleChange}
                                    >
                                        <option value="available">
                                            Available
                                        </option>
                                        <option value="checked_out">
                                            Checked Out
                                        </option>
                                        <option value="maintenance">
                                            Maintenance
                                        </option>
                                        <option value="retired">
                                            Retired
                                        </option>
                                    </select>
                                ) : (
                                    item.status
                                )}
                            </td>

                            <td>
                                {editingId === item.id ? (
                                    <select
                                        name="equipment_condition"
                                        value={editData.equipment_condition}
                                        onChange={handleChange}
                                    >
                                        <option value="excellent">
                                            Excellent
                                        </option>
                                        <option value="good">
                                            Good
                                        </option>
                                        <option value="fair">
                                            Fair
                                        </option>
                                        <option value="poor">
                                            Poor
                                        </option>
                                        <option value="damaged">
                                            Damaged
                                        </option>
                                    </select>
                                ) : (
                                    item.equipment_condition
                                )}
                            </td>

                            <td>
                                {editingId === item.id ? (
                                    <>
                                        <button
                                            onClick={() => handleSave(item.id)}
                                            disabled={saving}
                                        >
                                            Save
                                        </button>

                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => handleEdit(item)}
                                            disabled={saving}
                                        >
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={saving}
                                            style={{
                                                marginLeft: "5px",
                                                color: "red"
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {equipment.length === 0 && (
                <p>No equipment found.</p>
            )}
        </div>
    );
};

export default ViewEquipment;
