/* global describe, test, expect, jest, beforeEach */

jest.mock("../db", () => ({
  query: jest.fn(),
  end: jest.fn()
}));

const request = require("supertest");
const app = require("../app");
const pool = require("../db");

const asBorrower = (id) =>
  request(app).get("/loans/my").set("X-User-Id", String(id)).set("X-User-Role", "borrower");

describe("GET /loans/my", () => {
  beforeEach(() => pool.query.mockReset());

  test("returns item name, dates and status for the borrower's loans", async () => {
    const loans = [
      { item_name: "Laptop", checkout_date: "2026-10-01", due_date: "2026-10-15", status: "overdue" }
    ];
    pool.query.mockResolvedValue([loans, []]);

    const res = await asBorrower(7);

    expect(res.statusCode).toBe(200);
    expect(res.body.loans).toEqual(loans);
  });

  test("only queries the caller's own loans and excludes returned by default", async () => {
    pool.query.mockResolvedValue([[], []]);

    await asBorrower(7);

    const [sql, params] = pool.query.mock.calls[0];
    expect(params).toEqual([7]);
    expect(sql).toContain("l.borrower_id = ?");
    expect(sql).toContain("l.return_date IS NULL");
  });

  test("shows the empty message when there are no active loans", async () => {
    pool.query.mockResolvedValue([[], []]);

    const res = await asBorrower(7);

    expect(res.body).toEqual({ message: "You currently have no active loans.", loans: [] });
  });

  test("non-borrowers are rejected", async () => {
    const res = await request(app)
      .get("/loans/my")
      .set("X-User-Id", "2")
      .set("X-User-Role", "lab_staff");

    expect(res.statusCode).toBe(403);
  });
});
