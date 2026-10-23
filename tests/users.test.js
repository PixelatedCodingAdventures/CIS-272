
require("dotenv").config();

// Mock the database before importing app.js
jest.mock("../db", () => ({
    execute: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
}));

const request = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const pool = require("../db");

describe("User Management CRUD Tests", () => {
    let userId;
    let nextId = 2;

    // Simulated database
    let mockUsers = [];

    // Maintain authenticated session
    const agent = request.agent(app);

    const testEmail = "jest-test-user@example.com";

    beforeAll(async () => {
        // Create mock admin account
        const passwordHash = await bcrypt.hash("password", 10);

        mockUsers = [
            {
                id: 1,
                name: "Test Admin",
                email: "admin@example.com",
                password_hash: passwordHash,
                role: "department_lead",
                is_active: 1
            }
        ];

        // Simulate MySQL queries
        pool.execute.mockImplementation(async (sql, params = []) => {
            const normalized = sql.replace(/\s+/g, " ").trim().toUpperCase();

            // SELECT user for login
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM USERS") &&
                normalized.includes("WHERE EMAIL = ?")
            ) {
                const user = mockUsers.find(
                    u => u.email === params[0]
                );

                return [user ? [{ ...user }] : [], []];
            }

            // SELECT all users
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM USERS") &&
                !normalized.includes("WHERE")
            ) {
                const users = mockUsers.map(u => {
    const user = { ...u };
    delete user.password_hash;
    return user;
});

                return [users, []];
            }

            // SELECT user by ID
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM USERS") &&
                normalized.includes("WHERE ID = ?")
            ) {
                const user = mockUsers.find(
                    u => u.id === Number(params[0])
                );

                return [user ? [{ ...user }] : [], []];
            }

            // INSERT user
            if (normalized.startsWith("INSERT INTO USERS")) {
                const email = params.find(
                    p => typeof p === "string" && p.includes("@")
                );

                if (mockUsers.some(u => u.email === email)) {
                    const error = new Error("Duplicate entry");
                    error.code = "ER_DUP_ENTRY";
                    throw error;
                }

                const name = params[0];
                const passwordHash = params.find(
                    p => typeof p === "string" && p.startsWith("$2")
                );
                const role = params.find(
                    p => ["borrower", "lab_staff", "department_lead"].includes(p)
                ) || "borrower";

                const newUser = {
                    id: nextId++,
                    name,
                    email,
                    password_hash: passwordHash,
                    role,
                    is_active: 1
                };

                mockUsers.push(newUser);

                return [{
                    insertId: newUser.id,
                    affectedRows: 1
                }, []];
            }

            // UPDATE user
            if (normalized.startsWith("UPDATE USERS")) {
                const id = Number(params[params.length - 1]);

                const user = mockUsers.find(u => u.id === id);

                if (!user) {
                    return [{ affectedRows: 0 }, []];
                }

                user.name = params[0];
                user.email = params[1];
                user.role = params[2];
                user.is_active = params[3] ? 1 : 0;

                return [{ affectedRows: 1 }, []];
            }

            // DELETE user
            if (normalized.startsWith("DELETE FROM USERS")) {
                const id = Number(params[0]);

                const index = mockUsers.findIndex(u => u.id === id);

                if (index === -1) {
                    return [{ affectedRows: 0 }, []];
                }

                mockUsers.splice(index, 1);

                return [{ affectedRows: 1 }, []];
            }

            throw new Error(`Unhandled mock SQL: ${sql}`);
        });

        // Support pool.query if app uses it
        pool.query.mockImplementation((sql, params) =>
            pool.execute(sql, params)
        );

        // Log in using mock admin
        const response = await agent
            .post("/login")
            .send({
                email: "admin@example.com",
                password: "password"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.user.role).toMatch(
            /^(lab_staff|department_lead)$/
        );
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    test("POST /users - Create user", async () => {
        const response = await agent
            .post("/users")
            .send({
                name: "Jest Test User",
                email: testEmail,
                password: "TestPassword123!",
                role: "borrower"
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.message).toBe(
            "User created successfully"
        );
        expect(response.body.userId).toBeDefined();

        userId = response.body.userId;
    });

    test("GET /users - List all users", async () => {
        const response = await agent.get("/users");

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const user = response.body.find(
            u => u.id === userId
        );

        expect(user).toBeDefined();
        expect(user.name).toBe("Jest Test User");
        expect(user.email).toBe(testEmail);
        expect(user.role).toBe("borrower");
        expect(user.is_active).toBe(1);
    });

    test("GET /users - Does not expose passwords", async () => {
        const response = await agent.get("/users");

        expect(response.statusCode).toBe(200);

        response.body.forEach(user => {
            expect(user.password_hash).toBeUndefined();
            expect(user.password).toBeUndefined();
        });
    });

    test("POST /users - Reject duplicate email", async () => {
        const response = await agent
            .post("/users")
            .send({
                name: "Duplicate User",
                email: testEmail,
                password: "TestPassword123!",
                role: "borrower"
            });

        expect(response.statusCode).toBe(409);
        expect(response.body.error).toBe(
            "Email already exists"
        );
    });

    test("POST /users - Reject missing fields", async () => {
        const response = await agent
            .post("/users")
            .send({
                name: "Missing Password",
                email: "missing@example.com",
                role: "borrower"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            "All fields are required"
        );
    });

    test("PUT /users/:id - Update user information", async () => {
        const response = await agent
            .put(`/users/${userId}`)
            .send({
                name: "Updated Jest User",
                email: testEmail,
                role: "lab_staff",
                is_active: true
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
            "User updated successfully"
        );

        const user = mockUsers.find(u => u.id === userId);

        expect(user.name).toBe("Updated Jest User");
        expect(user.role).toBe("lab_staff");
        expect(user.is_active).toBe(1);
    });

    test("PUT /users/:id - Reject invalid role", async () => {
        const response = await agent
            .put(`/users/${userId}`)
            .send({
                name: "Jest Test User",
                email: testEmail,
                role: "super_admin",
                is_active: true
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe(
            "Invalid user data"
        );
    });

    test("PUT /users/:id - User not found", async () => {
        const response = await agent
            .put("/users/999999999")
            .send({
                name: "Missing User",
                email: "missing@example.com",
                role: "borrower",
                is_active: true
            });

        expect(response.statusCode).toBe(404);
    });

    test("DELETE /users/:id - Delete user", async () => {
        const response = await agent
            .delete(`/users/${userId}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.message).toBe(
            "User deleted successfully"
        );

        const user = mockUsers.find(u => u.id === userId);

        expect(user).toBeUndefined();
    });

    test("DELETE /users/:id - User not found", async () => {
        const response = await agent
            .delete(`/users/${userId}`);

        expect(response.statusCode).toBe(404);
        expect(response.body.error).toBe(
            "User not found"
        );
    });
});
