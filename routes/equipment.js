
const express = require("express");

const router = express.Router();

const pool = require("../db");

const { ROLES, requireRole } = require("../middleware/auth");


router.get("/test", async (req, res) => {
   console.log(req.session.userId)
        res.send("test");

   
});


router.get("/test2",requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
   console.log(req.session.userId)
        res.send("test2");

   
});


router.post("/", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    // add equipment
    try {
        const {
            name,
            asset_tag,
            description,
            status = "available",
            equipment_condition = "good"
        } = req.body;

        // Validate required fields
        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.length > 150 ||
            typeof asset_tag !== "string" ||
            !asset_tag.trim() ||
            asset_tag.length > 100
        ) {
            return res.status(400).json({
                error: "Valid equipment name and asset tag are required"
            });
        }

        const validStatuses = [
            "available",
            "checked_out",
            "maintenance",
            "retired"
        ];

        const validConditions = [
            "excellent",
            "good",
            "fair",
            "poor",
            "damaged"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                error: "Invalid equipment status"
            });
        }

        if (!validConditions.includes(equipment_condition)) {
            return res.status(400).json({
                error: "Invalid equipment condition"
            });
        }

        if (
            description != null &&
            typeof description !== "string"
        ) {
            return res.status(400).json({
                error: "Description must be text"
            });
        }

        const [result] = await pool.execute(
            `INSERT INTO equipment
             (name, asset_tag, description, status, equipment_condition)
             VALUES (?, ?, ?, ?, ?)`,
            [
                name.trim(),
                asset_tag.trim(),
                description || null,
                status,
                equipment_condition
            ]
        );

        res.status(201).json({
            message: "Equipment added successfully",
            equipmentId: result.insertId
        });

    } catch (error) {
        console.error("Database error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Asset tag already exists"
            });
        }

        res.status(500).json({
            error: "Failed to add equipment"
        });
    }
});




const validStatuses = [
    "available",
    "checked_out",
    "maintenance",
    "retired"
];

const validConditions = [
    "excellent",
    "good",
    "fair",
    "poor",
    "damaged"
];

// GET - Retrieve all equipment
// requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD),
router.get("/", async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT
                id,
                name,
                asset_tag,
                description,
                status,
                equipment_condition,
                created_at,
                updated_at
             FROM equipment
             ORDER BY id DESC`
        );

        res.json(rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve equipment"
        });
    }
});

// PUT - Update equipment
router.put("/:id",requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    console.log("put");
    console.log(req.params);
    try {
        const { id } = req.params;

        const {
            name,
            asset_tag,
            description,
            status,
            equipment_condition
        } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.length > 150 ||
            typeof asset_tag !== "string" ||
            !asset_tag.trim() ||
            asset_tag.length > 100 ||
            (description != null && typeof description !== "string") ||
            !validStatuses.includes(status) ||
            !validConditions.includes(equipment_condition)
        ) {
            return res.status(400).json({
                error: "Invalid equipment data"
            });
        }

        const [result] = await pool.execute(
            `UPDATE equipment
             SET name = ?,
                 asset_tag = ?,
                 description = ?,
                 status = ?,
                 equipment_condition = ?
             WHERE id = ?`,
            [
                name.trim(),
                asset_tag.trim(),
                description || null,
                status,
                equipment_condition,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Equipment not found"
            });
        }

        res.json({
            message: "Equipment updated successfully"
        });

    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                error: "Asset tag already exists"
            });
        }

        res.status(500).json({
            error: "Failed to update equipment"
        });
    }
});

// DELETE - Delete equipment
router.delete("/:id", requireRole(ROLES.LAB_STAFF, ROLES.DEPARTMENT_LEAD), async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.execute(
            "DELETE FROM equipment WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                error: "Equipment not found"
            });
        }

        res.json({
            message: "Equipment deleted successfully"
        });

    } catch (error) {
        console.error(error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                error: "Equipment has related records and cannot be deleted"
            });
        }

        res.status(500).json({
            error: "Failed to delete equipment"
        });
    }
});



module.exports = router;