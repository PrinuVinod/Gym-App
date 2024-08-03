const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: String,
    phone: {
        type: String,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastpayment: Date,
    due: Date,
    age: Number,
});

module.exports = mongoose.model('Members', memberSchema);
