const mongoose = require('mongoose')

const emptySchema = new mongoose.Schema({}, { strict: false });
const Entry = mongoose.model('Entry', emptySchema, 'prod-comp');
module.exports = Entry;