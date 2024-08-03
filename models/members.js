const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: String,
    phone: {
        type: String,
        unique: true
    },
    lastpayment: Date,
    due: Date
});

module.exports = mongoose.model('Members', memberSchema);
