

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

describe("Equipment Management CRUD Tests", () => {
    let equipmentId;
    let nextId = 1;

    // Simulated equipment database
    let mockEquipment = [];

    // Simulated users database
    let mockUsers = [];

    // Maintain authenticated session
    const agent = request.agent(app);

    const assetTag = "JEST-EQUIP-001";

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

        // Simulate MySQL database operations
        pool.execute.mockImplementation(async (sql, params = []) => {
            const normalized = sql
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

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

            // INSERT equipment
            if (normalized.startsWith("INSERT INTO EQUIPMENT")) {
                const [
                    name,
                    asset_tag,
                    description,
                    status,
                    equipment_condition
                ] = params;

                // Check duplicate asset tag
                if (
                    mockEquipment.some(
                        item => item.asset_tag === asset_tag
                    )
                ) {
                    const error = new Error("Duplicate entry");
                    error.code = "ER_DUP_ENTRY";
                    throw error;
                }

                const newEquipment = {
                    id: nextId++,
                    name,
                    asset_tag,
                    description,
                    status,
                    equipment_condition
                };

                mockEquipment.push(newEquipment);

                return [{
                    insertId: newEquipment.id,
                    affectedRows: 1
                }, []];
            }

            // SELECT equipment by asset tag
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM EQUIPMENT") &&
                normalized.includes("WHERE ASSET_TAG = ?")
            ) {
                const equipment = mockEquipment.find(
                    item => item.asset_tag === params[0]
                );

                return [equipment ? [{ ...equipment }] : [], []];
            }

            // SELECT equipment by ID
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM EQUIPMENT") &&
                normalized.includes("WHERE ID = ?")
            ) {
                const equipment = mockEquipment.find(
                    item => item.id === Number(params[0])
                );

                return [equipment ? [{ ...equipment }] : [], []];
            }

            // SELECT all equipment
            if (
                normalized.startsWith("SELECT") &&
                normalized.includes("FROM EQUIPMENT") &&
                !normalized.includes("WHERE")
            ) {
                return [
                    mockEquipment.map(item => ({ ...item })),
                    []
                ];
            }

            // UPDATE equipment
            if (normalized.startsWith("UPDATE EQUIPMENT")) {
                const id = Number(params[params.length - 1]);

                const equipment = mockEquipment.find(
                    item => item.id === id
                );

                if (!equipment) {
                    return [{ affectedRows: 0 }, []];
                }

                equipment.name = params[0];
                equipment.asset_tag = params[1];
                equipment.description = params[2];
                equipment.status = params[3];
                equipment.equipment_condition = params[4];

                return [{ affectedRows: 1 }, []];
            }

            // DELETE equipment
            if (normalized.startsWith("DELETE FROM EQUIPMENT")) {
                const id = Number(params[0]);

                const index = mockEquipment.findIndex(
                    item => item.id === id
                );

                if (index === -1) {
                    return [{ affectedRows: 0 }, []];
                }

                mockEquipment.splice(index, 1);

                return [{ affectedRows: 1 }, []];
            }

            throw new Error(`Unhandled mock SQL: ${sql}`);
        });

        // Support pool.query() if the application uses it
        pool.query.mockImplementation((sql, params) =>
            pool.execute(sql, params)
        );

        // Log in with mock admin
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

    test("POST /equipment - Create equipment", async () => {
        const response = await agent
            .post("/equipment")
            .send({
                name: "Test Laptop",
                asset_tag: assetTag,
                description: "Laptop for automated testing",
                status: "available",
                equipment_condition: "good"
            });

        expect(response.statusCode).toBe(201);

        const [rows] = await pool.execute(
            "SELECT * FROM equipment WHERE asset_tag = ?",
            [assetTag]
        );

        expect(rows).toHaveLength(1);
        expect(rows[0].name).toBe("Test Laptop");
        expect(rows[0].status).toBe("available");

        equipmentId = rows[0].id;
    });

    test("GET /equipment - List equipment", async () => {
        const response = await agent.get("/equipment");

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const equipment = response.body.find(
            item => item.id === equipmentId
        );

        expect(equipment).toBeDefined();
        expect(equipment.name).toBe("Test Laptop");
        expect(equipment.asset_tag).toBe(assetTag);
    });

    test("POST /equipment - Reject duplicate asset tag", async () => {
        const response = await agent
            .post("/equipment")
            .send({
                name: "Duplicate Laptop",
                asset_tag: assetTag,
                description: "Duplicate equipment",
                status: "available",
                equipment_condition: "good"
            });

        expect(response.statusCode).toBe(409);
    });

    test("POST /equipment - Reject missing required fields", async () => {
        const response = await agent
            .post("/equipment")
            .send({
                description: "Missing name and asset tag"
            });

        expect(response.statusCode).toBe(400);
    });

    test("PUT /equipment/:id - Update equipment", async () => {
        const response = await agent
            .put(`/equipment/${equipmentId}`)
            .send({
                name: "Updated Test Laptop",
                asset_tag: assetTag,
                description: "Updated description",
                status: "maintenance",
                equipment_condition: "fair"
            });

        expect(response.statusCode).toBe(200);

        const [rows] = await pool.execute(
            "SELECT * FROM equipment WHERE id = ?",
            [equipmentId]
        );

        expect(rows[0].name).toBe("Updated Test Laptop");
        expect(rows[0].status).toBe("maintenance");
        expect(rows[0].equipment_condition).toBe("fair");
    });

    test("PUT /equipment/:id - Equipment not found", async () => {
        const response = await agent
            .put("/equipment/999999999")
            .send({
                name: "Missing Laptop",
                asset_tag: "MISSING-EQUIP-999",
                description: "Not found",
                status: "available",
                equipment_condition: "good"
            });

        expect(response.statusCode).toBe(404);
    });

    test("DELETE /equipment/:id - Delete equipment", async () => {
        const response = await agent
            .delete(`/equipment/${equipmentId}`);

        expect(response.statusCode).toBe(200);

        const [rows] = await pool.execute(
            "SELECT id FROM equipment WHERE id = ?",
            [equipmentId]
        );

        expect(rows).toHaveLength(0);
    });

    test("DELETE /equipment/:id - Equipment not found", async () => {
        const response = await agent
            .delete(`/equipment/${equipmentId}`);

        expect(response.statusCode).toBe(404);
    });
});
