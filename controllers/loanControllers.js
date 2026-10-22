const express = require("express");
const mysql = require("mysql2");
const pool = require("../db");

const app = express();
app.use(express.json())



exports.checkoutEquipment = async(req, res) => {
    try {
        const equipment = req.body.equipment_id
        const borrower = req.body.borrower_id
        const dueDate = req.body.due_date 

        await pool.query("SELECT 1")
        const check = await pool.query("SELECT * FROM equipment WHERE id = " + equipment + " FOR UPDATE")
        
        if (check[0].length === 0 ){
            res.status(404).json({message: 'No equipment found with the equipment id of ' + equipment + '.'})
            await pool.query("COMMIT")
        } else {
            const userCheck = await pool.query("SELECT * FROM users WHERE id = " + borrower)
            if (userCheck[0].length === 0){
                res.status(404).json({message: 'User does not exist.'})
                await pool.query("COMMIT")
            } else {
                    const checked = JSON.parse(JSON.stringify(check[0]));
                    const status = checked[0].status
                    if (status == 'available') {
                        await pool.query("UPDATE equipment SET status = 'checked_out' WHERE id = " + equipment)
                        await pool.query("INSERT INTO loans (borrower_id, equipment_id, due_date) VALUES (" + borrower + ", " + equipment + ", '" + dueDate + "')")
                        await pool.query("COMMIT")
                        res.status(200).json({message: 'Equipment checked out successfully!'})
                        
                    } else {
                        res.status(500).json({message: 'That equipment is not available.'})
                        await pool.query("COMMIT")
                    }
            }
        }
        
    } catch  (error) {
        console.log(error)
    }
}

exports.returnEquipment = async(req, res) => {
    try {
        const activeID = req.params.id
        const condition = req.body.condition
        await pool.query("SELECT 1")
        const check = await pool.query("SELECT * FROM loans WHERE active_equipment_id = " + activeID + " FOR UPDATE")
        if (check[0].length === 0 ) {
            res.status(404).json({message: "There is no active loans with id " + activeID})
            await pool.query("COMMIT")
        } else {
            if (condition.toLowerCase() !== "damaged" && condition.toLowerCase() !== "poor" && condition.toLowerCase() !== "fair" && condition.toLowerCase() !== "good" && condition.toLowerCase() !== "excellent") {
                res.status(406).json({message: "Invalid Condition"})
            } else {
                await pool.query("UPDATE equipment SET status = 'available', equipment_condition = '" + condition.toLowerCase() + "' WHERE id = " + activeID)
                await pool.query("UPDATE loans SET return_date = NOW(), return_condition = '" + condition.toLowerCase() + "' WHERE active_equipment_id = " + activeID)
                await pool.query("COMMIT")
                res.status(200).json({message: "Equipment return successfully!"})
            }
        }
        
    } catch  (error) {
        console.log(error)
    }
}

exports.getOverdueLoans = async(req, res) => {
    try {
        await pool.query("SELECT 1")
        const output = await pool.query("SELECT * FROM loans WHERE due_date < NOW() ORDER BY due_date ASC;")
        
        const outputToShow = output.sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        
        
        return res.status(200).json(outputToShow[0])
    } catch  (error) {
        console.log(error)
    }


}

exports.getEquipmentHistory = async(req, res) => {
    try {
        const equipmentID = req.params.id
        
    
        await pool.query("SELECT 1")
        const output = await pool.query("SELECT * FROM loans WHERE equipment_id = " + equipmentID)
        if (output[0].length === 0){
            res.status(404).json({message: "No history found with id " + equipmentID})
        } else {
            
            res.status(200).json(output[0])
        }
    } catch (error) {
        console.log(error)
    }
}