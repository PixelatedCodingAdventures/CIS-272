
const express = require("express");

const router = express.Router();

const pool = require("../db");

const bcrypt = require("bcrypt");

const { ROLES, requireRole } = require("../middleware/auth");





router.get("/", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
 // gets list of users from the database

  try {
        const [rows] = await pool.execute(
            `SELECT
                id,
                name,
                email,
                role,
                is_active,
                created_at
             FROM users
             ORDER BY id DESC`
        );

        res.json(rows);

    } catch (error) {
        console.error("Database error:", error);

        res.status(500).json({
            error: "Failed to retrieve users"
        });
    }

    
});


router.post("/", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    // create user
 console.log(req.body);

   try {
        const { name, email, password, role} = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        // Hash password before saving
        const password_hash = await bcrypt.hash(password, 12);

        // New public registrations are always borrowers
    

        const [result] = await pool.execute(
            `INSERT INTO users
             (name, email, password_hash, role)
             VALUES (?, ?, ?, ?)`,
            [name, email, password_hash, role]
        );

        res.status(201).json({
            message: "User created successfully",
            userId: result.insertId
        });

    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Email already exists"
            });
        }

        res.status(500).json({
            error: "Internal server error"
        });
    }


// res.send("post / users ");
});




router.put("/:id", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    // update user info
    try {
        const { id } = req.params;
        const { name, email, role, is_active } = req.body;

        const validRoles = [
            "borrower",
            "lab_staff",
            "department_lead"
        ];

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.length > 100 ||
            typeof email !== "string" ||
            !email.trim() ||
            email.length > 255 ||
            !validRoles.includes(role) ||
            ![true, false, 0, 1].includes(is_active)
        ) {
            return res.status(400).json({
                error: "Invalid user data"
            });
        }

        const [result] = await pool.execute(
            `UPDATE users
             SET name = ?,
                 email = ?,
                 role = ?,
                 is_active = ?
             WHERE id = ?`,
            [
                name.trim(),
                email.trim(),
                role,
                Number(is_active),
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json({
            message: "User updated successfully"
        });

    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Email already exists"
            });
        }

        res.status(500).json({
            error: "Failed to update user"
        });
    }
});



router.delete("/:id", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    // delete user
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            "DELETE FROM users WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        res.json({
            message: "User deleted successfully"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to delete user"
        });
    }
});


module.exports = router;
