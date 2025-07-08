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
  try {
    const { name, email, password, role } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ msg: 'Name, email, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
    }
    
    if (!email.includes('@')) {
      return res.status(400).json({ msg: 'Please provide a valid email address' });
    }
    
    if (role && !['user', 'admin'].includes(role)) {
      return res.status(400).json({ msg: 'Role must be either user or admin' });
    }
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      name: name.trim(), 
      email: email.toLowerCase().trim(), 
      password: hashedPassword, 
      role: role || 'user' 
    });
    await user.save();
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ msg: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// Middleware to verify JWT
const auth = (roles = []) => (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ msg: 'Access denied - insufficient privileges' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Dashboard route (protected)
router.get('/dashboard', auth(['user', 'admin']), (req, res) => {
  try {
    res.json({ msg: `Welcome, user ${req.user.id} with role ${req.user.role}` });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Upload route (protected)
router.post('/upload', auth(['user', 'admin']), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file uploaded or invalid file type' });
    }
    
    // Validate file size (10MB limit)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ msg: 'File size too large. Maximum 10MB allowed.' });
    }
    
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
    
    // Validate data size
    const dataSize = JSON.stringify({ columns, rows }).length;
    if (dataSize > 5 * 1024 * 1024) { // 5MB limit for parsed data
      return res.status(400).json({ msg: 'Parsed data too large. Please use a smaller file.' });
    }
    
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
    console.error('Upload error:', err);
    res.status(500).json({ msg: 'Error parsing file', error: err.message });
  }
});

// Get upload data by ID (for chart generation)
router.get('/uploads/:id/data', auth(['user', 'admin']), async (req, res) => {
  try {
    const upload = await Upload.findOne({ _id: req.params.id, user: req.user.id })
      .populate('data');
    
    if (!upload) {
      return res.status(404).json({ msg: 'Upload not found' });
    }
    
    if (!upload.data) {
      return res.status(404).json({ msg: 'Upload data not found' });
    }
    
    res.json({
      columns: upload.data.columns,
      rows: upload.data.rows
    });
  } catch (err) {
    console.error('Fetch upload data error:', err);
    res.status(500).json({ msg: 'Error fetching upload data', error: err.message });
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
    console.error('Fetch uploads error:', err);
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
      if (err && err.code !== 'ENOENT') {
        console.error('File deletion error:', err);
      }
    });
    
    // Delete ExcelData document
    if (upload.data) {
      await ExcelData.findByIdAndDelete(upload.data);
    }
    
    await upload.deleteOne();
    res.json({ msg: 'Upload deleted successfully' });
  } catch (err) {
    console.error('Delete upload error:', err);
    res.status(500).json({ msg: 'Error deleting upload', error: err.message });
  }
});

// Admin-only routes
// Get all users (admin only)
router.get('/admin/users', auth(['admin']), async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ msg: 'Error fetching users', error: err.message });
  }
});

// Get user statistics and storage info (admin only)
router.get('/admin/stats', auth(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalUploads = await Upload.countDocuments();
    
    // Get uploads with populated data for file size calculation
    const uploads = await Upload.find().populate('data');
    
    // Calculate storage usage
    let totalStorageSize = 0;
    const userStats = [];
    
    // Group uploads by user
    const uploadsByUser = {};
    uploads.forEach(upload => {
      if (!uploadsByUser[upload.user]) {
        uploadsByUser[upload.user] = [];
      }
      uploadsByUser[upload.user].push(upload);
    });
    
    // Calculate stats for each user
    for (const [userId, userUploads] of Object.entries(uploadsByUser)) {
      const user = await User.findById(userId, { password: 0 });
      if (!user) continue;
      
      const userStorageSize = userUploads.reduce((total, upload) => {
        // Estimate storage size based on data complexity
        const dataSize = JSON.stringify(upload.data).length;
        return total + dataSize;
      }, 0);
      
      totalStorageSize += userStorageSize;
      
      userStats.push({
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        },
        uploads: userUploads.length,
        storageSize: userStorageSize,
        lastUpload: userUploads.length > 0 ? 
          userUploads.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0].uploadedAt : null
      });
    }
    
    res.json({
      totalUsers,
      totalUploads,
      totalStorageSize,
      userStats: userStats.sort((a, b) => b.uploads - a.uploads)
    });
  } catch (err) {
    console.error('Fetch admin stats error:', err);
    res.status(500).json({ msg: 'Error fetching admin stats', error: err.message });
  }
});

// Get detailed upload info for a specific user (admin only)
router.get('/admin/user/:userId/uploads', auth(['admin']), async (req, res) => {
  try {
    // Validate userId
    if (!req.params.userId || req.params.userId.length !== 24) {
      return res.status(400).json({ msg: 'Invalid user ID format' });
    }
    
    const uploads = await Upload.find({ user: req.params.userId })
      .populate('data')
      .sort({ uploadedAt: -1 });
    
    const user = await User.findById(req.params.userId, { password: 0 });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json({
      user,
      uploads: uploads.map(upload => ({
        _id: upload._id,
        filename: upload.filename,
        originalname: upload.originalname,
        uploadedAt: upload.uploadedAt,
        columns: upload.data?.columns?.length || 0,
        rows: upload.data?.rows?.length || 0,
        storageSize: JSON.stringify(upload.data).length
      }))
    });
  } catch (err) {
    console.error('Fetch user uploads error:', err);
    res.status(500).json({ msg: 'Error fetching user uploads', error: err.message });
  }
});

module.exports = router;
