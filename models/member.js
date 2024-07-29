const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    name: String,
    phone: String,
    lastpayment: Date,
    due: Date,
    age: Number,
});

const Member = mongoose.model('Member', memberSchema);

module.exports = Member;
