jest.mock("../db", () => ({
  query: jest.fn(),
}));

const pool = require("../db");

const {
  getEquipmentHistory,
} = require("../controllers/loanControllers");

describe("Epic 5 - Equipment History", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      params: {
        id: "1",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper: mock equipment lookup and history query.
  function mockHistory(loans) {
    pool.query
      .mockResolvedValueOnce([[{ id: 1 }], []])
      .mockResolvedValueOnce([loans, []]);
  }

  test("returns the recorded return date and time for completed loans", async () => {
    const returnDate = new Date("2026-11-05T14:30:00Z");

    mockHistory([
      {
        id: 10,
        equipment_id: 1,
        borrower_id: 2,
        borrower_name: "John",
        checkout_date: new Date("2026-11-01T09:00:00Z"),
        return_date: returnDate,
        status: "returned",
      },
    ]);

    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const history = res.json.mock.calls[0][0];

    expect(history[0].return_date).toEqual(returnDate);
    expect(history[0].status).toBe("returned");
  });

  test("identifies active loans with a null return date", async () => {
    mockHistory([
      {
        id: 11,
        equipment_id: 1,
        borrower_id: 3,
        borrower_name: "Sarah",
        checkout_date: new Date("2026-11-08T10:00:00Z"),
        return_date: null,
        status: "active",
      },
    ]);

    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    const history = res.json.mock.calls[0][0];

    expect(history[0].return_date).toBeNull();
    expect(history[0].status).toBe("active");
  });

  test("associates return information with the correct checkout record", async () => {
    const returnedAt = new Date("2026-11-05T14:30:00Z");

    mockHistory([
      {
        id: 12,
        equipment_id: 1,
        borrower_id: 2,
        return_date: returnedAt,
        status: "returned",
      },
      {
        id: 13,
        equipment_id: 1,
        borrower_id: 3,
        return_date: null,
        status: "active",
      },
    ]);

    await getEquipmentHistory(req, res);

    const history = res.json.mock.calls[0][0];

    const completedLoan = history.find((loan) => loan.id === 12);
    const activeLoan = history.find((loan) => loan.id === 13);

    expect(completedLoan.return_date).toEqual(returnedAt);
    expect(activeLoan.return_date).toBeNull();

    expect(completedLoan.borrower_id).toBe(2);
    expect(activeLoan.borrower_id).toBe(3);
  });

  test("preserves previous return history after subsequent checkouts", async () => {
    mockHistory([
      {
        id: 15,
        equipment_id: 1,
        borrower_id: 4,
        return_date: null,
        status: "active",
      },
      {
        id: 10,
        equipment_id: 1,
        borrower_id: 2,
        return_date: new Date("2026-10-20T12:00:00Z"),
        status: "returned",
      },
      {
        id: 5,
        equipment_id: 1,
        borrower_id: 3,
        return_date: new Date("2026-09-15T15:30:00Z"),
        status: "returned",
      },
    ]);

    await getEquipmentHistory(req, res);

    const history = res.json.mock.calls[0][0];

    expect(history).toHaveLength(3);

    expect(history.map((loan) => loan.id)).toEqual([
      15, 10, 5,
    ]);

    expect(history[0].return_date).toBeNull();
    expect(history[1].return_date).not.toBeNull();
    expect(history[2].return_date).not.toBeNull();
  });

  test("returns an empty array when equipment has no loan history", async () => {
    mockHistory([]);

    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 404 when equipment does not exist", async () => {
    pool.query.mockResolvedValueOnce([[], []]);

    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);

    expect(res.json).toHaveBeenCalledWith({
      message: "Equipment not found.",
    });
  });

  test("queries loan history for the requested equipment ID", async () => {
    mockHistory([]);

    await getEquipmentHistory(req, res);

    expect(pool.query).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/FROM equipment WHERE id = \?/i),
      ["1"]
    );

    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/WHERE l\.equipment_id = \?/i),
      ["1"]
    );
  });

  test("returns 500 when the database query fails", async () => {
    pool.query.mockRejectedValueOnce(
      new Error("Database connection failed")
    );

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await getEquipmentHistory(req, res);

    expect(res.status).toHaveBeenCalledWith(500);

    expect(res.json).toHaveBeenCalledWith({
      message: "An internal server error occurred.",
    });

    consoleSpy.mockRestore();
  });
});
