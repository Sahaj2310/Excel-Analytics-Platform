# Excel Analytics Platform

A full-stack MERN (MongoDB, Express.js, React, Node.js) application for uploading, parsing, and visualizing Excel data with interactive charts and analytics.

## 🚀 Features

- **User Authentication**: JWT-based login/signup with user and admin roles
- **Excel File Upload**: Support for .xls and .xlsx files with automatic parsing
- **Data Visualization**: Interactive 2D charts (Bar, Line, Pie, Scatter) and 3D charts using Chart.js and Three.js
- **Upload History**: View and manage previously uploaded files
- **Role-based Access**: Different features for users and admins
- **Responsive Design**: Modern UI with TailwindCSS

## 🛠️ Tech Stack

### Frontend
- **React** with Redux Toolkit for state management
- **TailwindCSS** for styling
- **Chart.js** and **react-chartjs-2** for 2D visualizations
- **Three.js** with **@react-three/fiber** for 3D charts
- **React Router** for navigation

### Backend
- **Express.js** server
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **SheetJS (xlsx)** for Excel parsing
- **bcryptjs** for password hashing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sahaj2310/Excel-Analytics-Platform.git
   cd Excel-Analytics-Platform
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env` file in the `server` directory:
   ```env
   MONGO_URI=mongodb://localhost:27017/excel_analytics
   JWT_SECRET=your_jwt_secret_here
   ```

4. **Start MongoDB**
   
   Make sure MongoDB is running on your system or use a cloud service like MongoDB Atlas.

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   The server will run on `http://localhost:3000`

2. **Start the frontend**
   ```bash
   cd client
   npm start
   ```
   The React app will run on `http://localhost:3001`

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:3001`

## 📊 Usage

### Authentication
1. **Sign Up**: Create a new account with email, password, and role (user/admin)
2. **Login**: Use your credentials to access the dashboard

### Excel File Upload
1. **Upload File**: Click "Upload Excel File" and select a .xls or .xlsx file
2. **View Parsed Data**: See the extracted columns and sample rows
3. **Generate Charts**: Select chart type and axes to visualize your data

### Chart Types Available
- **Bar Charts**: For categorical vs numerical data
- **Line Charts**: For time series or trend analysis
- **Pie Charts**: For percentage distributions
- **Scatter Plots**: For correlation analysis
- **3D Column Charts**: Interactive 3D visualizations

### Upload History
- **View All Uploads**: See all your previously uploaded files
- **Delete Files**: Remove unwanted uploads
- **Switch Between Files**: Click "View" to analyze different datasets

## 🗂️ Project Structure

```
Excel-Analytics-Platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── features/      # Redux slices and thunks
│   │   ├── pages/         # React components
│   │   └── app/          # Redux store
├── server/                # Express backend
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   └── uploads/          # File storage
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /users/signup` - User registration
- `POST /users/login` - User login
- `GET /users/dashboard` - Protected dashboard access

### File Management
- `POST /users/upload` - Upload Excel file
- `GET /users/uploads` - Get upload history
- `DELETE /users/uploads/:id` - Delete upload

## 🗄️ Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: String (user/admin),
  timestamps
}
```

### Uploads Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  filename: String,
  originalname: String,
  data: ObjectId (ref: ExcelData),
  uploadedAt: Date
}
```

### ExcelData Collection
```javascript
{
  _id: ObjectId,
  columns: [String],
  rows: [Object]
}
```

## 🚀 Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Configure MongoDB connection string
3. Deploy to platforms like Heroku, Railway, or Vercel

### Frontend Deployment
1. Build the React app: `npm run build`
2. Deploy to platforms like Netlify, Vercel, or GitHub Pages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Sahaj** - [GitHub](https://github.com/Sahaj2310)

## 🙏 Acknowledgments

- Chart.js for 2D charting capabilities
- Three.js for 3D visualizations
- TailwindCSS for modern styling
- MongoDB for data persistence 