
const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("Equipment Management CRUD Tests", () => {
    let equipmentId;

    // Preserve login session across requests
    const agent = request.agent(app);

    const assetTag = `JEST-EQUIP-${Date.now()}`;

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

    // Clean up test equipment and database connection
    afterAll(async () => {
        try {
            await pool.execute(
                "DELETE FROM equipment WHERE asset_tag = ?",
                [assetTag]
            );
        } finally {
            await pool.end();
        }
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
        const response = await agent
            .get("/equipment");

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
