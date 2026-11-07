

jest.mock("../db", () => ({
  query: jest.fn(),
}));

const pool = require("../db");
const { getOverdueLoans } = require("../controllers/loanControllers");

describe("Epic 4 - Overdue Equipment Tracking", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {};

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  test("calculates the correct number of days overdue", async () => {
    const loans = [
      {
        id: 1,
        equipment_name: "Dell Laptop",
        days_overdue: 20,
        return_date: null,
      },
      {
        id: 2,
        equipment_name: "Canon Camera",
        days_overdue: 7,
        return_date: null,
      },
    ];

    pool.query.mockResolvedValue([loans, []]);

    await getOverdueLoans(req, res);

    expect(res.status).toHaveBeenCalledWith(200);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          equipment_name: "Dell Laptop",
          days_overdue: 20,
        }),
        expect.objectContaining({
          equipment_name: "Canon Camera",
          days_overdue: 7,
        }),
      ])
    );
  });

  test("excludes returned loans from the SQL query", async () => {
    pool.query.mockResolvedValue([[], []]);

    await getOverdueLoans(req, res);

    const sql = pool.query.mock.calls[0][0];

    expect(sql).toMatch(/return_date\s+IS\s+NULL/i);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("excludes loans that are not overdue", async () => {
    pool.query.mockResolvedValue([[], []]);

    await getOverdueLoans(req, res);

    const sql = pool.query.mock.calls[0][0];

    expect(sql).toMatch(
      /DATE\(l\.due_date\)\s*<\s*CURDATE\(\)/i
    );

    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("sorts most overdue equipment first", async () => {
    const loans = [
      { id: 1, days_overdue: 30 },
      { id: 2, days_overdue: 15 },
      { id: 3, days_overdue: 5 },
    ];

    pool.query.mockResolvedValue([loans, []]);

    await getOverdueLoans(req, res);

    const sql = pool.query.mock.calls[0][0];

    expect(sql).toMatch(/ORDER BY days_overdue DESC/i);

    const result = res.json.mock.calls[0][0];

    expect(result.map((loan) => loan.days_overdue)).toEqual([
      30, 15, 5,
    ]);
  });

  test("returns an empty array when no overdue loans exist", async () => {
    pool.query.mockResolvedValue([[], []]);

    await getOverdueLoans(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([]);
  });

  test("returns 500 when the database query fails", async () => {
    pool.query.mockRejectedValue(new Error("Database error"));

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      await getOverdueLoans(req, res);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        message: "An internal server error occurred.",
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
