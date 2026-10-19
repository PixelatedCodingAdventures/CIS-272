/* global describe, test, expect, jest */

jest.mock("../db", () => ({
  query: jest.fn().mockResolvedValue([[], []]),
  end: jest.fn()
}));

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

const as = (req, id, role) =>
  req.set("X-User-Id", String(id)).set("X-User-Role", role);

describe("Role-based access control", () => {
  test("missing credentials return 401", async () => {
    expect((await request(app).get("/loans/my")).statusCode).toBe(401);
    expect((await request(app).get("/staff/equipment")).statusCode).toBe(401);
  });

  test("unknown role returns 403", async () => {
    const res = await as(request(app).get("/loans/my"), 1, "hacker");
    expect(res.statusCode).toBe(403);
  });

  test("borrower can view own loans, scoped to their id", async () => {
    const res = await as(request(app).get("/loans/my"), 7, "borrower");
    expect(res.statusCode).toBe(200);
    expect(pool.query.mock.calls.at(-1)[1]).toEqual([7]);
  });

  test("borrower cannot access staff or department features", async () => {
    expect((await as(request(app).get("/staff/equipment"), 1, "borrower")).statusCode).toBe(403);
    expect((await as(request(app).get("/staff/department"), 1, "borrower")).statusCode).toBe(403);
  });

  test("lab staff can manage equipment but not department features", async () => {
    expect((await as(request(app).get("/staff/equipment"), 2, "lab_staff")).statusCode).toBe(200);
    expect((await as(request(app).get("/staff/department"), 2, "lab_staff")).statusCode).toBe(403);
  });

  test("lab staff cannot use borrower loan endpoint", async () => {
    expect((await as(request(app).get("/loans/my"), 2, "lab_staff")).statusCode).toBe(403);
  });

  test("department lead can access equipment and department features", async () => {
    expect((await as(request(app).get("/staff/equipment"), 3, "department_lead")).statusCode).toBe(200);
    expect((await as(request(app).get("/staff/department"), 3, "department_lead")).statusCode).toBe(200);
  });
});
