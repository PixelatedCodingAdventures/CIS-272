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
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
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


const { authenticate } = require("./middleware/auth");
const equipmentRouter = require("./routes/equipment");
app.use("/equipment", authenticate, equipmentRouter);

const usersRouter = require("./routes/users");
app.use("/users", authenticate, usersRouter);

//app.use("/equipment", equipmentRouter);



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
const loansRouter = require("./routes/loans");
const staffRouter = require("./routes/staff");
app.use("/loans", authenticate, loansRouter);
app.use("/staff", authenticate, staffRouter);








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
            req.session.role = user.role;

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