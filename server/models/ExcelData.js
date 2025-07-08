const mongoose = require('mongoose');

const ExcelDataSchema = new mongoose.Schema({
  columns: [String],
  rows: [Object],
});

module.exports = mongoose.model('ExcelData', ExcelDataSchema); 