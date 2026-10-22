/* global describe, test, expect, afterAll */
const { getOverdueLoans, getEquipmentHistory, returnEquipment, checkoutEquipment } = require('../controllers/loanControllers')

const db = require('../db')
const makeMockRes = require("../helpers/makeMockRes");
jest.mock('../db')

const express = require('express');
const app = express();

app.use(express.json())







describe("Test for loanControllers.js", () => {
    test("getOverdueLoans grabs all overdue loans", async () => {
        const mockData = [[
            { id: 20, borrower_id: 975, equipment_id: 20, checkout_date: "2026-09-30 00:00:00", due_date: "2026-10-15 00:00:00", return_date: null, return_condition: null, active_equipment_id: 20 },
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }
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


        expect(body).toEqual(expect.arrayContaining(expectedData))
        expect(db.query).toHaveBeenCalledTimes(2);
        expect(db.query).toHaveBeenCalledWith('SELECT * FROM loans WHERE due_date < NOW() ORDER BY due_date ASC;')

    }),

        test("getEquipmentHistory throws 404 when it finds no records for specified id", async () => {
            const mockData = [[]]

            db.query.mockResolvedValue(mockData)


            const req = {
                params: {
                    id: 19
                }
            }
            let res = makeMockRes()
            await getEquipmentHistory(req, res)

            const body = res.json.mock.calls[0][0];

            expect(res.status).toHaveBeenCalledWith(404)
            expect(body).toEqual({ message: 'No history found with id 19' })

        })

    test("getEquipmentHistory grabs all records for a specific id", async () => {
        const mockData = [[
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }
        ]]

        const expectedData = [
            { id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }
        ]

        db.query.mockResolvedValue(mockData);

        const req = {
            params: {
                id: 19
            }
        }
        let res = makeMockRes()
        await getEquipmentHistory(req, res)

        const body = res.json.mock.calls[0][0];

        expect(body).toEqual(expectedData)
        expect(db.query).toHaveBeenCalledTimes(6);
        expect(db.query).toHaveBeenCalledWith("SELECT * FROM loans WHERE equipment_id = 19")

    })


    test("returnEquipment returns 404 for no active loans with specific id", async () => {
        const mockData = [[]]

        db.query.mockResolvedValue(mockData)

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
        expect(body).toEqual({ message: 'There is no active loans with id 19' })
    })

    test("returnEquipment returns 406 for invalid status", async () => {
        const mockData = [[{ id: 19, borrower_id: 579, equipment_id: 19, checkout_date: "2026-09-20 00:00:00", due_date: "2026-10-05 00:00:00", return_date: null, return_condition: null, active_equipment_id: 19 }]]

        db.query.mockResolvedValue(mockData)

        const req = {
            params: {
                id: 19
            },
            body: {
                condition: "ass"
            }
        }

        let res = makeMockRes()
        await returnEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(406)
        expect(body).toEqual({ message: 'Invalid Condition' })
    })


    test("returnEquipment returns 404 for no active loans with specific id", async () => {
        const mockData = [[]]

        db.query.mockResolvedValue(mockData)

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
        expect(body).toEqual({ message: 'There is no active loans with id 19' })
    })

    test("checkoutEquipment returns 404 for no active loans with specific id", async () => {
        const equipmentMockData = [[]]
        const usersMockData = [[]]

        db.query.mockResolvedValue(equipmentMockData)
        db.query.mockResolvedValue(usersMockData)

        const req = {
            body: {
                "equipment_id": 19,
                "borrower_id": 25,
                "due_date": "2026-11-25 20:00:00"
            }
        }

        let res = makeMockRes()
        await checkoutEquipment(req, res)

        const body = res.json.mock.calls[0][0]
        expect(res.status).toHaveBeenCalledWith(404)
        expect(body).toEqual({ message: 'No equipment found with the equipment id of 19.' })
    }),

        test("checkoutEquipment returns 404 for user not existing", async () => {
            const equipmentMockData = [[{
                id: 19,
                name: 'test',
                asset_tag: 'testing',
                description: 'a test for api calls',
                status: 'available',
                equipment_condition: 'good',
                created_at: "2026-10-21 03:32:29",
                updated_at: "2026-10-22 07:24:32"
            }]]
            const usersMockData = [[]]

            db.execute.mockResolvedValueOnce(equipmentMockData)

            const req = {
                body: {
                    "equipment_id": 19,
                    "borrower_id": 25,
                    "due_date": "2026-11-25 20:00:00"
                }
            }

            let res = makeMockRes()
            await checkoutEquipment(req, res)

            const body = res.json.mock.calls[0][0]
            expect(db.query).toHaveBeenCalledTimes(2)
            expect(res.status).toHaveBeenCalledWith(404)
            expect(body).toEqual({ message: 'User does not exist.' })
        })
})