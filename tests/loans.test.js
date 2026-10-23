/**
 * @jest-environment node
 */
const { getOverdueLoans, getEquipmentHistory, returnEquipment, checkoutEquipment } = require('../controllers/loanControllers')

const db = require('../db')
const makeMockRes = require("../helpers/makeMockRes");
jest.mock('../db');

describe("Test for loanControllers.js", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    })
    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    })

    test("Database failure returns 500 for getOverdueLoans", async () => {
        




        const req = {}
        let res = makeMockRes()
        await getOverdueLoans(req, res);

        res.json.mock.calls[0][0];


        expect(res.status).toHaveBeenCalledWith(500)



    })

    test("Database failure returns 500 for getEquipmentHistory", async () => {
        




        const req = {}
        let res = makeMockRes()
        await getEquipmentHistory(req, res);

        


        expect(res.status).toHaveBeenCalledWith(500)



    })

    test("Database failure returns 500 for checkoutEquipment", async () => {
        




        const req = {}
        let res = makeMockRes()
        await checkoutEquipment(req, res);

        


        expect(res.status).toHaveBeenCalledWith(500)



    })
    test("Database failure returns 500 for returnEquipment", async () => {
        




        const req = {}
        let res = makeMockRes()
        await returnEquipment(req, res);

        


        expect(res.status).toHaveBeenCalledWith(500)



    })
    test("getOverdueLoans grabs all overdue loans", async () => {
        const mockData = [[
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 },
            { id: 20, borrower_id: 975, equipment_id: 20, checkout_date: "2026-09-30 00:00:00", due_date: "2026-10-15 00:00:00", return_date: null, return_condition: null, active_equipment_id: 20 }
        ]]

        const expectedData = [
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 },
            { id: 20, borrower_id: 975, equipment_id: 20, checkout_date: "2026-09-30 00:00:00", due_date: "2026-10-15 00:00:00", return_date: null, return_condition: null, active_equipment_id: 20 }
        ]

        db.query.mockResolvedValue(mockData);
        const req = {}
        let res = makeMockRes()
        await getOverdueLoans(req, res);

        const body = res.json.mock.calls[0][0];

        expect(res.status).toHaveBeenCalledWith(200)
        expect(body).toEqual(expectedData)



    }),

        test("getEquipmentHistory throws 404 when it finds specified equipment id doesnt exist in db", async () => {


            db.query.mockResolvedValue([[]])


            const req = {
                params: {
                    id: 19
                }
            }
            let res = makeMockRes()
            await getEquipmentHistory(req, res)

            const body = res.json.mock.calls[0][0];

            expect(res.status).toHaveBeenCalledWith(404)
            expect(body).toEqual({ message: 'No equipment found with id 19' })

        })

    test("getEquipmentHistory throws 404 when it finds no loan history for specific id", async () => {


        db.query.mockResolvedValueOnce([[{
            id: 19,
            name: 'test',
            asset_tag: 'testing',
            description: 'a test for api calls',
            status: 'checked_out',
            equipment_condition: 'good',
            created_at: "2026-10-21 00:00:00",
            updated_at: "2026-10-23 00:00:00"
        }]]).mockResolvedValueOnce([[]])


        const req = {
            params: {
                id: 19
            }
        }
        let res = makeMockRes()
        await getEquipmentHistory(req, res)

        const body = res.json.mock.calls[0][0];

        expect(res.status).toHaveBeenCalledWith(404)
        expect(body).toEqual({ message: 'No loan history found with id 19' })

    })

    test("getEquipmentHistory grabs all records for a specific id", async () => {




        const expectedData = [
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }
        ]

        db.query.mockResolvedValueOnce([[{
            id: 19,
            name: 'test',
            asset_tag: 'testing',
            description: 'a test for api calls',
            status: 'checked_out',
            equipment_condition: 'good',
            created_at: "2026-10-21 00:00:00",
            updated_at: "2026-10-23 00:00:00"
        }]]).mockResolvedValueOnce([[{ id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }]])

        const req = {
            params: {
                id: 19
            }
        }
        let res = makeMockRes()
        await getEquipmentHistory(req, res)

        const body = res.json.mock.calls[0][0];

        expect(body).toEqual(expectedData)
        expect(db.query).toHaveBeenCalledTimes(2);


    })


    test("returnEquipment returns 404 for no active loans with specific id", async () => {

        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[]])
        })

        await db.getConnection();

        const req = {
            params: {
                id: 19
            },
            body: {
                condition: "good"
            }
        }

        let res = makeMockRes()
        await returnEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(404)
        expect(body).toEqual({ message: 'No active loans with the id provided.' })
    })
    test("returnEquipment returns 406 for invalid condition", async () => {


        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[
                { id: 612, borrower_id: 25, equipment_id: 19, checkout_date: "2026-10-23 00:00:00", due_date: "2026-11-27 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19, created_at: "2026-10-23 00:00:00", updated_at: "2026-10-23 00:00:00" }
            ]])

        })

         await db.getConnection();





        const req = {
            params: {
                id: 19
            },
            body: {
                condition: "goo"
            }
        }

        let res = makeMockRes()
        await returnEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(406)
        expect(body).toEqual({ message: 'Invalid condition. Condition must be damaged, poor, fair, good or excellent.' })
    })
    test("returnEquipment returns checked out equipment", async () => {


        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[
                { id: 612, borrower_id: 25, equipment_id: 19, checkout_date: "2026-10-23 00:00:00", due_date: "2026-11-27 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19, created_at: "2026-10-23 00:00:00", updated_at: "2026-10-23 00:00:00" }
            ]]),
            execute: jest.fn()

        })

         await db.getConnection();





        const req = {
            params: {
                id: 19
            },
            body: {
                condition: "good"
            }
        }

        let res = makeMockRes()
        await returnEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(200)
        expect(body).toEqual({ message: 'Equipment returned successfully!' })
    })

    test("checkoutEquipment throws 404 for equipment not found", async () => {

        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[]])
        })

         await db.getConnection();

        const req = {

            body: {
                equipment_id: 19,
                borrower_id: 25,
                due_date: "11-05-2026 00:00:00"
            }
        }

        let res = makeMockRes()
        await checkoutEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(404)
        expect(body).toEqual({ message: 'Equipment not found.' })
    })

    test("checkoutEquipment throws 409 for equipment being checked out", async () => {

        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[
                { id: 19, name: 'test', asset_tag: 'testing', description: 'a test for api calls', status: 'checked_out', equipment_condition: 'good', created_at: "2026-10-21 00:00:00", updated_at: "2026-10-23 00:00:00" }
            ]])
        })


         await db.getConnection();

        const req = {

            body: {
                equipment_id: 19,
                borrower_id: 25,
                due_date: "11-05-2026 00:00:00"
            }
        }

        let res = makeMockRes()
        await checkoutEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(409)
        expect(body).toEqual({ message: 'Equipment is not available.' })
    })

    test("checkoutEquipment throws 404 for user not being found", async () => {

        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[
                { id: 19, name: 'test', asset_tag: 'testing', description: 'a test for api calls', status: 'available', equipment_condition: 'good', created_at: "2026-10-21 00:00:00", updated_at: "2026-10-23 00:00:00" }
            ]]).mockResolvedValueOnce([[]])
        })


         await db.getConnection();

        const req = {

            body: {
                equipment_id: 19,
                borrower_id: 25,
                due_date: "11-05-2026 00:00:00"
            }
        }

        let res = makeMockRes()
        await checkoutEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(404)
        expect(body).toEqual({ message: 'Borrower not found.' })
    })

    test("checkoutEquipment checks out available equipment to existing user", async () => {

        db.getConnection = jest.fn().mockResolvedValue({
            beginTransaction: jest.fn(),
            commit: jest.fn(),
            rollback: jest.fn(),
            release: jest.fn(),
            query: db.query.mockResolvedValueOnce([[
                { id: 19, name: 'test', asset_tag: 'testing', description: 'a test for api calls', status: 'available', equipment_condition: 'good', created_at: "2026-10-21 00:00:00", updated_at: "2026-10-23 00:00:00" }
            ]]).mockResolvedValueOnce([[
                { id: 25, name: 'John Doe', email: 'JohnDoe@test.com', password_hash: 'password', role: 'borrower', is_active: 1, created_at: "2026-10-21 00:00:00", updated_at: "2026-10-21 00:00:00" }
            ]]),
            execute: jest.fn()
        })


         await db.getConnection();

        const req = {

            body: {
                equipment_id: 19,
                borrower_id: 25,
                due_date: "11-05-2026 00:00:00"
            }
        }

        let res = makeMockRes()
        await checkoutEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(200)
        expect(body).toEqual({ message: 'Equipment checked out successfully!' })
    })

})