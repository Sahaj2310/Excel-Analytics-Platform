const mongoose = require('mongoose');

const UploadSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalname: { type: String, required: true },
  data: { type: mongoose.Schema.Types.ObjectId, ref: 'ExcelData' },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Upload', UploadSchema); 