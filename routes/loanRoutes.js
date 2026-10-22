const express = require('express');
const router = express.Router();
const{ getOverdueLoans, getEquipmentHistory, returnEquipment, checkoutEquipment } = require('../controllers/loanControllers')

const app = express();
app.use(express.json())

router.get('/loans/overdue', getOverdueLoans)

router.get('/equipment/:id/history', getEquipmentHistory)

router.post('/loans/checkout', checkoutEquipment)

router.patch('/loans/:id/return', returnEquipment)

module.exports = router;