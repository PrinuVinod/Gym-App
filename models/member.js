const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastpayment: {
        type: Date,
        default: Date.now
    },
    due: {
        type: Date,
        required: true
    },
    age: {
        type: Number,
        required: true,
        min: 0
    },
    activity: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model('Member', memberSchema);
