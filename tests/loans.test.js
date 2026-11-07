/**
 * @jest-environment node
 */
const {
  getOverdueLoans,
  getEquipmentHistory,
  returnEquipment,
  checkoutEquipment,
  getActiveLoans,
} = require("../controllers/loanControllers");

const db = require("../db");
const makeMockRes = require("../helpers/makeMockRes");

function getFutureDate(days = 60) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().split("T")[0];
}

jest.mock("../db");

describe("Test for loanControllers.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Suppress expected server error logs during controller unit tests.
    jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    // Restore the original console.error function after each test.
    jest.restoreAllMocks();
  });

  test("Database failure returns 500 for getOverdueLoans", async () => {
    const req = {};
    let res = makeMockRes();
    await getOverdueLoans(req, res);

    res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("Database failure returns 500 for getEquipmentHistory", async () => {
    const req = {};
    let res = makeMockRes();
    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("Database failure returns 500 for checkoutEquipment", async () => {
    const req = {};
    let res = makeMockRes();
    await checkoutEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  test("Database failure returns 500 for returnEquipment", async () => {
    const req = {};
    let res = makeMockRes();
    await returnEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
  });
  (test("getOverdueLoans grabs all overdue loans", async () => {
    const mockData = [
      [
        {
          id: 19,
          borrower_id: 579,
          equipment_id: 19,
          checkout_date: "2026-09-20 00:00:00",
          due_date: getFutureDate(60),
          return_date: null,
          return_condition: null,
          active_equipment_id: 19,
        },
        {
          id: 20,
          borrower_id: 975,
          equipment_id: 20,
          checkout_date: "2026-09-30 00:00:00",
          due_date: getFutureDate(60),
          return_date: null,
          return_condition: null,
          active_equipment_id: 20,
        },
      ],
    ];

    const expectedData = [
      {
        id: 19,
        borrower_id: 579,
        equipment_id: 19,
        checkout_date: "2026-09-20 00:00:00",
        due_date: getFutureDate(60),
        return_date: null,
        return_condition: null,
        active_equipment_id: 19,
      },
      {
        id: 20,
        borrower_id: 975,
        equipment_id: 20,
        checkout_date: "2026-09-30 00:00:00",
        due_date: getFutureDate(60),
        return_date: null,
        return_condition: null,
        active_equipment_id: 20,
      },
    ];

    db.query.mockResolvedValue(mockData);
    const req = {};
    let res = makeMockRes();
    await getOverdueLoans(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).toEqual(expectedData);
  }),
    test("getEquipmentHistory throws 404 when it finds specified equipment id doesnt exist in db", async () => {
      db.query.mockResolvedValue([[]]);

      const req = {
        params: {
          id: 19,
        },
      };
      let res = makeMockRes();
      await getEquipmentHistory(req, res);

      const body = res.json.mock.calls[0][0];

      expect(res.status).toHaveBeenCalledWith(404);
      expect(body).toEqual({ message: "No equipment found with id 19" });
    }));

  test("getEquipmentHistory throws 404 when it finds no loan history for specific id", async () => {
    db.query
      .mockResolvedValueOnce([
        [
          {
            id: 19,
            name: "test",
            asset_tag: "testing",
            description: "a test for api calls",
            status: "checked_out",
            equipment_condition: "good",
            created_at: "2026-10-21 00:00:00",
            updated_at: "2026-10-23 00:00:00",
          },
        ],
      ])
      .mockResolvedValueOnce([[]]);

    const req = {
      params: {
        id: 19,
      },
    };
    let res = makeMockRes();
    await getEquipmentHistory(req, res);

    const body = res.json.mock.calls[0][0];

    expect(res.status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ message: "No loan history found with id 19" });
  });

  test("getEquipmentHistory grabs all records for a specific id", async () => {
    const expectedData = [
      {
        id: 19,
        borrower_id: 579,
        equipment_id: 19,
        checkout_date: "2026-09-20 00:00:00",
        due_date: getFutureDate(60),
        return_date: null,
        return_condition: null,
        active_equipment_id: 19,
      },
    ];

    db.query
      .mockResolvedValueOnce([
        [
          {
            id: 19,
            name: "test",
            asset_tag: "testing",
            description: "a test for api calls",
            status: "checked_out",
            equipment_condition: "good",
            created_at: "2026-10-21 00:00:00",
            updated_at: "2026-10-23 00:00:00",
          },
        ],
      ])
      .mockResolvedValueOnce([
        [
          {
            id: 19,
            borrower_id: 579,
            equipment_id: 19,
            checkout_date: "2026-09-20 00:00:00",
            due_date: getFutureDate(60),
            return_date: null,
            return_condition: null,
            active_equipment_id: 19,
          },
        ],
      ]);

    const req = {
      params: {
        id: 19,
      },
    };
    let res = makeMockRes();
    await getEquipmentHistory(req, res);

    const body = res.json.mock.calls[0][0];

    expect(body).toEqual(expectedData);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test("returnEquipment returns 404 for no active loans with specific id", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([[]]),
    });

    await db.getConnection();

    const req = {
      params: {
        // Use a nonexistent loan ID to verify the 404 response.
        id: 999,
      },
      body: {
        condition: "good",
      },
    };

    let res = makeMockRes();
    await returnEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ message: "No active loans with the id provided." });
  });
  test("returnEquipment returns 406 for invalid condition", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([
        [
          {
            id: 612,
            borrower_id: 25,
            equipment_id: 19,
            checkout_date: "2026-10-23 00:00:00",
            due_date: getFutureDate(60),
            return_date: null,
            return_condition: null,
            active_equipment_id: 19,
            created_at: "2026-10-23 00:00:00",
            updated_at: "2026-10-23 00:00:00",
          },
        ],
      ]),
    });

    await db.getConnection();

    const req = {
      params: {
        // Identify the loan using its primary key, not the equipment ID.
        id: 612,
      },
      body: {
        condition: "goo",
      },
    };

    let res = makeMockRes();
    await returnEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(406);
    expect(body).toEqual({
      message: "Invalid return condition.",
    });
  });
  test("returnEquipment returns checked out equipment", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([
        [
          {
            id: 612,
            borrower_id: 25,
            equipment_id: 19,
            checkout_date: "2026-10-23 00:00:00",
            due_date: getFutureDate(60),
            return_date: null,
            return_condition: null,
            active_equipment_id: 19,
            created_at: "2026-10-23 00:00:00",
            updated_at: "2026-10-23 00:00:00",
          },
        ],
      ]),
      execute: jest.fn(),
    });

    await db.getConnection();

    const req = {
      params: {
        // Identify the loan using its primary key, not the equipment ID.
        id: 612,
      },
      body: {
        condition: "good",
      },
    };

    let res = makeMockRes();
    await returnEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).toEqual({ message: "Equipment returned successfully!" });

    // Retrieve the mocked database connection used during check-in.
    const connection = await db.getConnection();

    // Working equipment becomes available and keeps its equipment condition.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE equipment"),
      ["available", "good", 19],
    );

    // Verify the loan was completed using its primary key.
    // No condition notes were supplied, so the database receives NULL.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE loans"),
      ["good", null, 612],
    );

    // Verify both updates were committed successfully.
    expect(connection.commit).toHaveBeenCalledTimes(1);

    // Verify the database connection was released.
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("returnEquipment records missing parts and condition notes", async () => {
    // Simulate an active loan for equipment being returned.
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValueOnce([
        [
          {
            id: 613,
            borrower_id: 25,
            equipment_id: 20,
            return_date: null,
          },
        ],
      ]),
      execute: jest.fn(),
    };

    db.getConnection = jest.fn().mockResolvedValue(connection);

    const req = {
      params: { id: 613 },
      body: {
        condition: "missing_parts",
        conditionNotes: "Power adapter is missing.",
      },
    };

    const res = makeMockRes();

    await returnEquipment(req, res);

    // Confirm the check-in succeeded.
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment returned successfully!",
    });

    // Missing parts require repair, while the existing equipment condition
    // remains unchanged because missing_parts is a loan return condition.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE equipment"),
      ["maintenance", null, 20],
    );

    // The loan records the exact return condition and optional notes.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE loans"),
      ["missing_parts", "Power adapter is missing.", 613],
    );

    // Both updates must complete within the transaction.
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("returnEquipment accepts working condition without notes", async () => {
    // Simulate an active loan being returned in working condition.
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValueOnce([
        [
          {
            id: 614,
            borrower_id: 25,
            equipment_id: 21,
            return_date: null,
          },
        ],
      ]),
      execute: jest.fn(),
    };

    db.getConnection = jest.fn().mockResolvedValue(connection);

    const req = {
      params: { id: 614 },
      body: {
        condition: "working",
      },
    };

    const res = makeMockRes();

    await returnEquipment(req, res);

    // Verify the check-in succeeded.
    expect(res.status).toHaveBeenCalledWith(200);

    // Working equipment is available, while its existing equipment condition
    // remains unchanged because working is a loan return condition.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE equipment"),
      ["available", null, 21],
    );

    // Verify the loan records "working" with NULL notes.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE loans"),
      ["working", null, 614],
    );

    // Verify the transaction completed successfully.
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("returnEquipment records damaged condition and notes", async () => {
    // Simulate an active loan for equipment returned damaged.
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValueOnce([
        [
          {
            id: 615,
            borrower_id: 25,
            equipment_id: 22,
            return_date: null,
          },
        ],
      ]),
      execute: jest.fn(),
    };

    db.getConnection = jest.fn().mockResolvedValue(connection);

    const req = {
      params: { id: 615 },
      body: {
        condition: "damaged",
        conditionNotes: "Screen cracked during checkout.",
      },
    };

    const res = makeMockRes();

    await returnEquipment(req, res);

    // Verify the check-in succeeded.
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment returned successfully!",
    });

    // Damaged equipment remains unavailable for checkout while it is repaired.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE equipment"),
      ["maintenance", "damaged", 22],
    );

    // Verify both the return condition and notes are recorded.
    expect(connection.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE loans"),
      ["damaged", "Screen cracked during checkout.", 615],
    );

    // Verify the transaction completed successfully.
    expect(connection.commit).toHaveBeenCalledTimes(1);
    expect(connection.rollback).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("returnEquipment rejects non-text condition notes", async () => {
    // Simulate an active loan before validating condition notes.
    const connection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: jest.fn().mockResolvedValueOnce([
        [
          {
            id: 616,
            borrower_id: 25,
            equipment_id: 23,
            return_date: null,
          },
        ],
      ]),
      execute: jest.fn(),
    };

    db.getConnection = jest.fn().mockResolvedValue(connection);

    const req = {
      params: { id: 616 },
      body: {
        condition: "damaged",
        conditionNotes: 12345, // Invalid: notes must be text.
      },
    };

    const res = makeMockRes();

    await returnEquipment(req, res);

    // Verify the request is rejected.
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Condition notes must be text.",
    });

    // No equipment or loan records should be updated.
    expect(connection.execute).not.toHaveBeenCalled();

    // Verify the transaction is rolled back and the connection released.
    expect(connection.rollback).toHaveBeenCalledTimes(1);
    expect(connection.commit).not.toHaveBeenCalled();
    expect(connection.release).toHaveBeenCalledTimes(1);
  });

  test("checkoutEquipment throws 404 for equipment not found", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([[]]),
    });

    await db.getConnection();

    const req = {
      body: {
        equipment_id: 19,
        borrower_id: 25,
        due_date: getFutureDate(60),
      },
    };

    let res = makeMockRes();
    await checkoutEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ message: "Equipment not found." });
  });

  test("checkoutEquipment throws 409 for equipment being checked out", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([
        [
          {
            id: 19,
            name: "test",
            asset_tag: "testing",
            description: "a test for api calls",
            status: "checked_out",
            equipment_condition: "good",
            created_at: "2026-10-21 00:00:00",
            updated_at: "2026-10-23 00:00:00",
          },
        ],
      ]),
    });

    await db.getConnection();

    const req = {
      body: {
        equipment_id: 19,
        borrower_id: 25,
        // Use a valid future due date to test the equipment availability check.
        due_date: getFutureDate(60),
      },
    };

    let res = makeMockRes();
    await checkoutEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(409);
    expect(body).toEqual({ message: "Equipment is not available." });
  });

  test("checkoutEquipment rejects equipment marked for maintenance", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query.mockResolvedValueOnce([
        [
          {
            id: 20,
            name: "Damaged equipment",
            asset_tag: "DAMAGED-001",
            status: "maintenance",
            equipment_condition: "damaged",
          },
        ],
      ]),
    });

    const req = {
      body: {
        equipment_id: 20,
        borrower_id: 25,
        due_date: getFutureDate(60),
      },
    };

    const res = makeMockRes();
    await checkoutEquipment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment is not available.",
    });
  });

  test("checkoutEquipment throws 404 for user not being found", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query
        .mockResolvedValueOnce([
          [
            {
              id: 19,
              name: "test",
              asset_tag: "testing",
              description: "a test for api calls",
              status: "available",
              equipment_condition: "good",
              created_at: "2026-10-21 00:00:00",
              updated_at: "2026-10-23 00:00:00",
            },
          ],
        ])
        .mockResolvedValueOnce([[]]),
    });

    await db.getConnection();

    const req = {
      body: {
        equipment_id: 19,
        borrower_id: 25,
        // Use a valid future due date so the test reaches borrower validation.
        due_date: getFutureDate(60),
      },
    };

    let res = makeMockRes();
    await checkoutEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(404);
    expect(body).toEqual({ message: "Borrower not found." });
  });

  test("checkoutEquipment checks out available equipment to existing user", async () => {
    db.getConnection = jest.fn().mockResolvedValue({
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn(),
      query: db.query
        .mockResolvedValueOnce([
          [
            {
              id: 19,
              name: "test",
              asset_tag: "testing",
              description: "a test for api calls",
              status: "available",
              equipment_condition: "good",
              created_at: "2026-10-21 00:00:00",
              updated_at: "2026-10-23 00:00:00",
            },
          ],
        ])
        .mockResolvedValueOnce([
          [
            {
              id: 25,
              name: "John Doe",
              email: "JohnDoe@test.com",
              password_hash: "password",
              role: "borrower",
              is_active: 1,
              created_at: "2026-10-21 00:00:00",
              updated_at: "2026-10-21 00:00:00",
            },
          ],
        ]),
      execute: jest.fn(),
    });

    await db.getConnection();

    const req = {
      body: {
        equipment_id: 19,
        borrower_id: 25,
        // Use a valid future due date to test a successful equipment checkout.
        due_date: getFutureDate(60),
      },
    };

    let res = makeMockRes();
    await checkoutEquipment(req, res);

    const body = res.json.mock.calls[0][0];
    expect(res.status).toHaveBeenCalledWith(200);
    expect(body).toEqual({ message: "Equipment checked out successfully!" });
  });

  test("getActiveLoans returns active loans with equipment and borrower details", async () => {
    // Simulate an active loan returned by the database.
    const activeLoans = [
      {
        id: 612,
        borrower_id: 25,
        equipment_id: 19,
        checkout_date: "2026-10-23 00:00:00",
        due_date: "2026-11-27 00:00:00",
        equipment_name: "Laptop",
        asset_tag: "LAP-019",
        borrower_name: "John Doe",
      },
    ];

    db.query.mockResolvedValueOnce([activeLoans]);

    const req = {};
    const res = makeMockRes();

    await getActiveLoans(req, res);

    // Verify successful retrieval and the expected loan details.
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(activeLoans);

    // Verify that only loans without a return date are requested.
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("WHERE l.return_date IS NULL"),
    );
  });

  test("getActiveLoans returns 500 when the database query fails", async () => {
    // Simulate a database failure during active-loan retrieval.
    db.query.mockRejectedValueOnce(new Error("Database connection failed"));

    const req = {};
    const res = makeMockRes();

    await getActiveLoans(req, res);

    // Verify that database errors do not expose internal details.
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "An internal server error occurred.",
    });
  });
});
