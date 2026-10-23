/* global describe, test, expect, jest, beforeEach */

jest.mock("../db", () => ({
  query: jest.fn(),
  execute: jest.fn(),
  end: jest.fn()
}));
jest.mock("connect-sqlite3", () => (session) => session.MemoryStore);
jest.mock("bcrypt", () => ({ compare: jest.fn().mockResolvedValue(true) }));

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

async function asBorrower(id) {
  const agent = request.agent(app);
  pool.execute.mockResolvedValue([[
    {
      id,
      name: "Test Borrower",
      email: "borrower@example.com",
      password_hash: "hash",
      role: "borrower",
      is_active: 1
    }
  ], []]);
  const login = await agent.post("/login").send({
    email: "borrower@example.com",
    password: "password"
  });
  expect(login.statusCode).toBe(200);
  return agent;
}

describe("GET /loans/my", () => {
  beforeEach(() => {
    pool.query.mockReset();
    pool.execute.mockReset();
  });

  test("returns item name, dates and status for the borrower's loans", async () => {
    const loans = [
      { item_name: "Laptop", checkout_date: "2026-10-01", due_date: "2026-10-15", status: "overdue" }
    ];
    pool.query.mockResolvedValue([loans, []]);

    const borrower = await asBorrower(7);
    const res = await borrower.get("/loans/my");

    expect(res.statusCode).toBe(200);
    expect(res.body.loans).toEqual(loans);
  });

  test("only queries the caller's own loans and excludes returned by default", async () => {
    pool.query.mockResolvedValue([[], []]);

    const borrower = await asBorrower(7);
    await borrower.get("/loans/my");

    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([7]);
    expect(sql).toContain("e.name AS item_name");
    expect(sql).toContain("JOIN equipment e ON e.id = l.equipment_id");
    expect(sql).toContain("CASE");
    expect(sql).toContain("l.borrower_id = ?");
    expect(sql).toContain("l.return_date IS NULL");
  });

  test("shows the empty message when there are no active loans", async () => {
    pool.query.mockResolvedValue([[], []]);

    const borrower = await asBorrower(7);
    const res = await borrower.get("/loans/my");

    expect(res.body).toEqual({ message: "You currently have no active loans.", loans: [] });
  });

  test("non-borrowers are rejected", async () => {
    const agent = request.agent(app);
    pool.execute.mockResolvedValue([[
      {
        id: 2,
        name: "Test Staff",
        email: "staff@example.com",
        password_hash: "hash",
        role: "lab_staff",
        is_active: 1
      }
    ], []]);
    await agent.post("/login").send({
      email: "staff@example.com",
      password: "password"
    });
    const res = await agent.get("/loans/my");

    expect(res.statusCode).toBe(403);
  });
});
