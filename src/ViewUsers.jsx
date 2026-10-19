
import React, { useState, useEffect } from "react";

const ViewUsers = () => {
    const [users, setUsers] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    "http://localhost:3000/users"
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch users");
                }

                const data = await response.json();
                setUsers(data);

            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Start editing a specific user
    const handleEdit = (user) => {
        setEditingId(user.id);
        setEditData({ ...user });
        setError("");
    };

    // Update form fields
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setEditData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Save changes to MySQL
    const handleSave = async (id) => {
        setSaving(true);
        setError("");

        try {
            const response = await fetch(
                `http://localhost:3000/users/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: editData.name,
                        email: editData.email,
                        role: editData.role,
                        is_active: editData.is_active
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || "Failed to update user"
                );
            }

            // Update the React table without reloading
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === id
                        ? { ...user, ...editData }
                        : user
                )
            );

            setEditingId(null);
            setEditData({});

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
        return <p>Loading users...</p>;
    }



    const handleDelete = async (id) => {

    // Ask for confirmation
    if (!window.confirm("Are you sure you want to delete this user?")) {
        return;
    }

    try {
        const response = await fetch(
            `http://localhost:3000/users/${id}`,
            {
                method: "DELETE"
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to delete user");
        }

        // Remove deleted user from React state
        setUsers((prev) =>
            prev.filter((user) => user.id !== id)
        );

    } catch (error) {
        setError(error.message);
    }
};


    return (
        <div>
            <h2>Manage Users</h2>

            {error && (
                <p style={{ color: "red" }}>{error}</p>
            )}

            <table border="1" cellPadding="10">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Active</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.id}</td>

                            <td>
                                {editingId === user.id ? (
                                    <input
                                        type="text"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    user.name
                                )}
                            </td>

                            <td>
                                {editingId === user.id ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={editData.email}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    user.email
                                )}
                            </td>

                            <td>
                                {editingId === user.id ? (
                                    <select
                                        name="role"
                                        value={editData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="borrower">
                                            Borrower
                                        </option>
                                        <option value="lab_staff">
                                            Lab Staff
                                        </option>
                                        <option value="department_lead">
                                            Department Lead
                                        </option>
                                    </select>
                                ) : (
                                    user.role
                                )}
                            </td>

                            <td>
                                {editingId === user.id ? (
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={Boolean(editData.is_active)}
                                        onChange={handleChange}
                                    />
                                ) : (
                                    user.is_active
                                        ? "Yes"
                                        : "No"
                                )}
                            </td>

                            <td>
                                {editingId === user.id ? (
                                    <>
                                        <button
                                            onClick={() => handleSave(user.id)}
                                            disabled={saving}
                                        >
                                            {saving ? "Saving..." : "Save"}
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
            onClick={() => handleEdit(user)}
            disabled={saving}
        >
            Edit
        </button>

        <button
            onClick={() => handleDelete(user.id)}
            disabled={saving}
            style={{
                backgroundColor: "red",
                color: "white",
                marginLeft: "5px"
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
        </div>
    );
};

export default ViewUsers;
