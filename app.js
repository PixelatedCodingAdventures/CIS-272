const express = require("express");
const pool = require("./db");

const cors = require("cors");
const bcrypt = require("bcrypt");

const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);




const app = express();

// Allow requests from your React frontend
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


// Middleware to parse incoming JSON
app.use(express.json());

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));


// lightweight local file based database to store sessions
// The browser stores only the session ID in its cookie, 
// not the user's password. Express uses that ID to retrieve session
//  information from SQLite.
app.use(session({
    store: new SQLiteStore({
        db: "sessions.sqlite",
        dir: "./"
    }),

    name: "equipment.sid",

    secret: process.env.SESSION_SECRET || 'my-secret-ec',

    resave: false,
    
    saveUninitialized: false,

    cookie: {
        httpOnly: true,
        secure: false, // true with HTTPS in production
        sameSite: "lax",
        maxAge: 1000 * 60 * 60 * 24
    }
}));



app.get("/", (req, res) => {
  res.send("Equipment Checkout API");
});

app.get("/health", async (req, res) => {
  try {

    await pool.query("SELECT 1");
    // Are you there and able to execute a query? (SELECT 1)

    res.status(200).json({
      app: "up",
      database: "up"
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      app: "up",
      database: "down"
    });
  }
});



app.get("/users", async (req, res) => {
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


app.post("/users", async (req, res) => {
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




app.put("/users/:id", async (req, res) => {
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



app.delete("/users/:id", async (req, res) => {
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





app.post("/equipment", async (req, res) => {
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
app.get("/equipment", async (req, res) => {
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
app.put("/equipment/:id", async (req, res) => {
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
app.delete("/equipment/:id", async (req, res) => {
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






app.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email ||
            !password
        ) {
            return res.status(400).json({
                error: "Email and password are required"
            });
        }

        const [rows] = await pool.execute(
            `SELECT id, name, email, password_hash,
                    role, is_active
             FROM users
             WHERE email = ?`,
            [email]
        );

        const user = rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        const validPassword = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                error: "Invalid email or password"
            });
        }

        // Generate a fresh session ID after login
        req.session.regenerate((err) => {
            if (err) return next(err);

            req.session.userId = user.id;

            req.session.save((err) => {
                if (err) return next(err);

                res.json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                });
            });
        });

    } catch (error) {
        next(error);
    }
});


app.post("/logout", (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);

        res.clearCookie("equipment.sid", {
            path: "/"
        });

        res.json({
            message: "Logged out successfully"
        });
    });
});



app.get("/session", async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({
                loggedIn: false,
                user: null
            });
        }

        const [rows] = await pool.execute(
            `SELECT id, name, email, role
             FROM users
             WHERE id = ? AND is_active = 1`,
            [req.session.userId]
        );

        if (rows.length === 0) {
            return res.json({
                loggedIn: false,
                user: null
            });
        }

        res.json({
            loggedIn: true,
            user: rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to check session"
        });
    }
});

module.exports = app;