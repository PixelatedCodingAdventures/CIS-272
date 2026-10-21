
require("dotenv").config();

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("User Management CRUD Tests", () => {
    let userId;

    // Maintain the authenticated session across requests
    const agent = request.agent(app);

    const testEmail = `jest-test-user-${Date.now()}@example.com`;

    // Log in before running tests
    beforeAll(async () => {
        const response = await agent
            .post("/login")
            .send({
                email: process.env.TEST_STAFF_EMAIL,
                password: process.env.TEST_STAFF_PASSWORD
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.user.role).toMatch(
            /^(lab_staff|department_lead)$/
        );
    });

    // Clean up any leftover test user
    afterAll(async () => {
        try {
            await pool.execute(
                "DELETE FROM users WHERE email = ?",
                [testEmail]
            );
        } finally {
            await pool.end();
        }
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
        const response = await agent
            .get("/users");

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const user = response.body.find(
            user => user.id === userId
        );

        expect(user).toBeDefined();
        expect(user.name).toBe("Jest Test User");
        expect(user.email).toBe(testEmail);
        expect(user.role).toBe("borrower");
        expect(user.is_active).toBe(1);
    });

    test("GET /users - Does not expose passwords", async () => {
        const response = await agent
            .get("/users");

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

        const [rows] = await pool.execute(
            "SELECT name, role, is_active FROM users WHERE id = ?",
            [userId]
        );

        expect(rows[0].name).toBe("Updated Jest User");
        expect(rows[0].role).toBe("lab_staff");
        expect(rows[0].is_active).toBe(1);
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

        const [rows] = await pool.execute(
            "SELECT id FROM users WHERE id = ?",
            [userId]
        );

        expect(rows).toHaveLength(0);
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
