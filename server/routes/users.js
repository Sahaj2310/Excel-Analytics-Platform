const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const Upload = require('../models/Upload');
const fs = require('fs');
const ExcelData = require('../models/ExcelData');

// Multer storage and file filter
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.xls' || ext === '.xlsx') {
    cb(null, true);
  } else {
    cb(new Error('Only .xls and .xlsx files are allowed'));
  }
};

const upload = multer({ storage, fileFilter });

// Signup route
router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, role: role || 'user' });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Middleware to verify JWT
const auth = (roles = []) => (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Dashboard route (protected)
router.get('/dashboard', auth(['user', 'admin']), (req, res) => {
  res.json({ msg: `Welcome, user ${req.user.id} with role ${req.user.role}` });
});

// Upload route (protected)
router.post('/upload', auth(['user', 'admin']), upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded or invalid file type' });
  }
  try {
    // Parse Excel file
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    if (jsonData.length === 0) {
      return res.status(400).json({ msg: 'Excel file is empty or has no data' });
    }
    
    // Extract column names from the first row
    const columns = Object.keys(jsonData[0]);
    const rows = jsonData;
    
    // Save parsed data to ExcelData
    const excelDataDoc = new ExcelData({ columns, rows });
    await excelDataDoc.save();
    
    // Store metadata and reference to ExcelData in MongoDB
    const uploadDoc = new Upload({
      user: req.user.id,
      filename: req.file.filename,
      originalname: req.file.originalname,
      data: excelDataDoc._id,
    });
    await uploadDoc.save();
    res.json({ msg: 'File uploaded and parsed successfully', columns, rows });
  } catch (err) {
    console.error('Excel parsing error:', err);
    res.status(500).json({ msg: 'Error parsing file', error: err.message });
  }
});

// Get upload history for user
router.get('/uploads', auth(['user', 'admin']), async (req, res) => {
  try {
    const uploads = await Upload.find({ user: req.user.id })
      .sort({ uploadedAt: -1 })
      .populate('data');
    res.json(uploads);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching uploads', error: err.message });
  }
});

// Delete upload by ID (user can only delete their own uploads)
router.delete('/uploads/:id', auth(['user', 'admin']), async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user.id });
    if (!upload) return res.status(404).json({ msg: 'Upload not found' });
    // Remove file from uploads directory
    const filePath = path.join(__dirname, '../uploads', upload.filename);
    fs.unlink(filePath, (err) => {
      // Ignore error if file doesn't exist
    });
    await upload.deleteOne();
    res.json({ msg: 'Upload deleted successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting upload', error: err.message });
  }
});

module.exports = router;
