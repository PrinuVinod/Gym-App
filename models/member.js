const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: String,
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastpayment: Date,
    due: Date,
    age: Number
});

module.exports = mongoose.model('Member', memberSchema);
