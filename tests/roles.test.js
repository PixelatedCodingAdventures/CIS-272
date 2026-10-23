/* global describe, test, expect, jest */

jest.mock("../db", () => ({
  query: jest.fn().mockResolvedValue([[], []]),
  execute: jest.fn(),
  end: jest.fn()
}));
jest.mock("connect-sqlite3", () => (session) => session.MemoryStore);
jest.mock("bcrypt", () => ({ compare: jest.fn().mockResolvedValue(true) }));

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

async function as(role, id) {
  const agent = request.agent(app);
  pool.execute.mockResolvedValue([[
    {
      id,
      name: "Test User",
      email: "user@example.com",
      password_hash: "hash",
      role,
      is_active: 1
    }
  ], []]);
  const login = await agent.post("/login").send({
    email: "user@example.com",
    password: "password"
  });
  expect(login.statusCode).toBe(200);
  return agent;
}

describe("Role-based access control", () => {
  test("missing credentials return 401", async () => {
    expect((await request(app).get("/loans/my")).statusCode).toBe(401);
    expect((await request(app).get("/staff/equipment")).statusCode).toBe(401);
  });

  test("identity headers cannot authenticate a request", async () => {
    const res = await request(app)
      .get("/loans/my")
      .set("X-User-Id", "1")
      .set("X-User-Role", "borrower");
    expect(res.statusCode).toBe(401);
  });

  test("unknown role returns 403", async () => {
    const user = await as("hacker", 1);
    const res = await user.get("/loans/my");
    expect(res.statusCode).toBe(403);
  });

  test("borrower can view own loans, scoped to their id", async () => {
    const borrower = await as("borrower", 7);
    const res = await borrower.get("/loans/my");
    expect(res.statusCode).toBe(200);
    expect(pool.query.mock.calls.at(-1)[1]).toEqual([7]);
  });

  test("borrower cannot access staff or department features", async () => {
    const borrower = await as("borrower", 1);
    expect((await borrower.get("/staff/equipment")).statusCode).toBe(403);
    expect((await borrower.get("/staff/department")).statusCode).toBe(403);
  });

  test("lab staff can manage equipment but not department features", async () => {
    const staff = await as("lab_staff", 2);
    expect((await staff.get("/staff/equipment")).statusCode).toBe(200);
    expect((await staff.get("/staff/department")).statusCode).toBe(403);
  });

  test("lab staff cannot use borrower loan endpoint", async () => {
    const staff = await as("lab_staff", 2);
    expect((await staff.get("/loans/my")).statusCode).toBe(403);
  });

  test("department lead can access equipment and department features", async () => {
    const lead = await as("department_lead", 3);
    expect((await lead.get("/staff/equipment")).statusCode).toBe(200);
    expect((await lead.get("/staff/department")).statusCode).toBe(200);
  });
});
