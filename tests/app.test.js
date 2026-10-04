/* global describe, test, expect, afterAll */

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("Skeleton application", () => {
  test("GET / returns the application response", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Equipment Checkout API");
  });

  test("GET /health reports app and database are up", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.app).toBe("up");
    expect(response.body.database).toBe("up");
  });

  afterAll(async () => {
    await pool.end();
  });
});