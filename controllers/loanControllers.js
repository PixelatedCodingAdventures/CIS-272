const pool = require("../db");

exports.checkoutEquipment = async(req, res) => {
    let connection;
    let transactionStarted = false;
    try {

        const { equipment_id, borrower_id, due_date } = req.body;

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;

        
       // Check equipment availability and lock the row.
    const [equipmentRows] = await connection.query(
        "SELECT * FROM equipment WHERE id = ? FOR UPDATE",
        [equipment_id]
    );

    if (equipmentRows.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
            message: "Equipment not found."
        });
    }
    
    if (equipmentRows[0].status !== "available") {
        await connection.rollback();
        transactionStarted = false;
        return res.status(409).json({
            message: "Equipment is not available."
        });
    }

    // Verify borrower exists.
    const [userRows] = await connection.query(
        "SELECT * FROM users WHERE id = ?",
        [borrower_id]
    );
    
    if (userRows.length === 0) {
        await connection.rollback();
        transactionStarted = false;
        return res.status(404).json({
            message: "Borrower not found."
        });
    }

    // Insert loan record.
    await connection.execute(
        `INSERT INTO loans
         (borrower_id, equipment_id, due_date)
         VALUES (?, ?, ?)`,
        [borrower_id, equipment_id, due_date]
    );

    // Update equipment status.
    await connection.execute(
        "UPDATE equipment SET status = ? WHERE id = ?",
        ["checked_out", equipment_id]
    );

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
        message: "Equipment checked out successfully!"
    });
        
    } catch  (error) {
        console.error(error)
        
        if(connection && transactionStarted) {
            try{
                await connection.rollback()
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError)
            }
        }

        return res.status(500).json({
        message: "An internal server error occurred."
        });
        
    } finally {
        if (connection) {
            connection.release();
        }
    }


}

exports.returnEquipment = async(req, res) => {
    let connection;
    let transactionStarted = false;
    try {
        const activeID = req.params.id
        const condition = req.body.condition
        

        connection = await pool.getConnection();
        await connection.beginTransaction();
        transactionStarted = true;
        
        
        const [loanRows] = await connection.query(
            "SELECT * FROM loans WHERE active_equipment_id = ? FOR UPDATE",
            [activeID]
        )
        
        if (loanRows.length === 0){
            await connection.rollback();
            transactionStarted = false;
            return res.status(404).json({
            message: "No active loans with the id provided."
        });
        }

        if (condition.toLowerCase() !== "damaged" && condition.toLowerCase() !== "poor" && condition.toLowerCase() !== "fair" && condition.toLowerCase() !== "good" && condition.toLowerCase() !== "excellent"){
            transactionStarted = false;
            return res.status(406).json({
                message: "Invalid condition. Condition must be damaged, poor, fair, good or excellent."
            })
        }

        await connection.execute(
            `UPDATE equipment 
             SET 
                 status = 'available', 
                 equipment_condition = ? 
             WHERE id = ?`,
             [condition.toLowerCase(), activeID]
             
        );

        await connection.execute(
            `UPDATE loans
             SET 
                 return_date = NOW(), 
                 return_condition = ? 
             WHERE active_equipment_id = ?`,
             [condition.toLowerCase(), activeID]
             
        );

        await connection.commit();
        transactionStarted = false;

        return res.status(200).json({
            message: "Equipment returned successfully!"
        });

        
    } catch  (error) {
        console.error(error)
        
        
        if(connection && transactionStarted) {
            try{
                await connection.rollback()
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError)
            }
        }

        return res.status(500).json({
        message: "An internal server error occurred."
        });
    } finally {
        if (connection) {
            connection.release()
        }
    }
}

exports.getOverdueLoans = async(req, res) => {
    try {
       
        const output = await pool.query(
            `SELECT *
            FROM loans
            WHERE due_date < NOW()
            AND return_date IS NULL
            ORDER BY due_date ASC;`)
        
        
        
        console.log(output)
        return res.status(200).json(output[0])
    } catch  (error) {
        console.error(error)
        return res.status(500).json({
        message: "An internal server error occurred."
        });
    }


}

exports.getEquipmentHistory = async(req, res) => {
    try {
        const equipmentID = req.params.id
        
        const check = await pool.query("SELECT * FROM equipment WHERE id = ?", [equipmentID])
        
        if (check[0].length === 0) {
            res.status(404).json({message: "No equipment found with id " + equipmentID})
        }
        
        const output = await pool.query("SELECT * FROM loans WHERE equipment_id = ?",  [equipmentID])
        if (output[0].length === 0){
            res.status(404).json({message: "No loan history found with id " + equipmentID})
        } else {
            
            res.status(200).json(output[0])
        }
    } catch (error) {
        console.error(error)
        return res.status(500).json({
        message: "An internal server error occurred."
        });
    }
}

