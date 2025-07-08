// Move all imports to the top
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { uploadFile, fetchUploads, deleteUpload } from '../features/upload/uploadThunks';
import { clearError } from '../features/upload/uploadSlice';
import Chart from 'chart.js/auto';
import * as THREE from 'three';

const Dashboard = () => {
  const { user, token, role } = useSelector((state) => state.auth);
  const { uploads, currentUpload, loading, error, uploadProgress } = useSelector((state) => state.upload);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartInstance, setChartInstance] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    loadUploads();
  }, [token, navigate]);

  const loadUploads = async () => {
    try {
      await dispatch(fetchUploads());
    } catch (err) {
      console.error('Failed to load uploads:', err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['.xls', '.xlsx'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        alert('Please select only Excel files (.xls or .xlsx)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size too large. Maximum 10MB allowed.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    try {
      await dispatch(uploadFile(selectedFile));
      setSelectedFile(null);
      document.getElementById('fileInput').value = '';
      loadUploads();
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDelete = async (uploadId) => {
    if (window.confirm('Are you sure you want to delete this upload?')) {
      try {
        await dispatch(deleteUpload(uploadId));
        if (selectedUpload && selectedUpload._id === uploadId) {
          setSelectedUpload(null);
          setChartData(null);
        }
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  const handleUploadSelect = async (upload) => {
    try {
      const response = await fetch(`http://localhost:3000/users/uploads/${upload._id}/data`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch upload data');
      }
      
      const data = await response.json();
      setSelectedUpload(upload);
      setChartData(data);
      setXAxis(data.columns[0] || '');
      setYAxis(data.columns[1] || '');
    } catch (err) {
      console.error('Failed to load upload data:', err);
      alert('Failed to load upload data. Please try again.');
    }
  };

  useEffect(() => {
    // Auto-generate chart when all data is ready and canvas is rendered
    if (selectedUpload && chartData && xAxis && yAxis && document.getElementById('chartCanvas')) {
      generateChart();
    }
    // eslint-disable-next-line
  }, [selectedUpload, chartData, xAxis, yAxis, chartType]);

  // Helper to determine if a column is numeric
  const isColumnNumeric = (col) => {
    if (!chartData || !chartData.rows) return false;
    // At least one value must be a valid number (ignore empty strings)
    return chartData.rows.some(row => !isNaN(parseFloat(row[col])) && row[col] !== '');
  };

  const generateChart = () => {
    console.log('generateChart called', { chartData, xAxis, yAxis, chartType });
    if (!chartData || !xAxis || !yAxis) {
      alert('Please select both X and Y axes');
      return;
    }

    // Check if Y axis is numeric
    const isYAxisNumeric = chartData.rows.some(row => !isNaN(parseFloat(row[yAxis])) && row[yAxis] !== '');
    if (!isYAxisNumeric) {
      alert('Please select a numeric column for the Y axis.');
      return;
    }

    const ctxElem = document.getElementById('chartCanvas');
    if (!ctxElem) {
      alert('Chart canvas not found');
      return;
    }
    const ctx = ctxElem.getContext('2d');

    // Destroy previous chart if exists
    if (chartInstance) {
      chartInstance.destroy();
    }

    const labels = chartData.rows.map(row => row[xAxis]);
    const data = chartData.rows.map(row => {
      const value = row[yAxis];
      return isNaN(value) ? 0 : parseFloat(value);
    });

    console.log('Chart labels:', labels);
    console.log('Chart data:', data);

    const newChart = new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          label: yAxis,
          data: data,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: `${chartType.toUpperCase()} Chart: ${xAxis} vs ${yAxis}`
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    setChartInstance(newChart);
  };

  const generate3DChart = () => {
    console.log('generate3DChart called', { chartData, xAxis, yAxis });
    if (!chartData || !xAxis || !yAxis) {
      alert('Please select both X and Y axes');
      return;
    }

    const container = document.getElementById('threeContainer');
    if (!container) {
      alert('3D chart container not found');
      return;
    }

    // Clear previous scene
    container.innerHTML = '';

    // Set explicit size if needed
    container.style.width = '100%';
    container.style.height = '400px';

    const width = container.offsetWidth || 600;
    const height = container.offsetHeight || 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const xIndex = chartData.columns.indexOf(xAxis);
    const yIndex = chartData.columns.indexOf(yAxis);

    if (xIndex === -1 || yIndex === -1) {
      alert('Selected axes not found in data');
      return;
    }

    const data = chartData.rows.slice(0, 20).map((row, index) => ({
      x: index,
      y: isNaN(row[yAxis]) ? 0.1 : Math.max(parseFloat(row[yAxis]), 0.1),
      z: 0
    }));

    console.log('3D Chart data:', data);

    data.forEach((point, index) => {
      const geometry = new THREE.BoxGeometry(0.5, point.y / 10, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(point.x * 2 - data.length, point.y / 20, 0);
      scene.add(cube);
    });

    camera.position.z = 50;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);

    function animate() {
      requestAnimationFrame(animate);
      scene.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    animate();
  };

  const downloadChart = async (format) => {
    if (!chartInstance) {
      alert('No chart to download');
      return;
    }

    try {
      const canvas = chartInstance.canvas;
      const link = document.createElement('a');
      
      if (format === 'png') {
        link.download = `chart_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
      } else if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF();
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 100);
        pdf.save(`chart_${Date.now()}.pdf`);
        return;
      }
      
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download chart');
    }
  };

  const clearErrorHandler = () => {
    dispatch(clearError());
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b">Excel Analytics</div>
        <nav className="flex-1 p-4 space-y-4">
          <div className="text-gray-700 font-semibold">Menu</div>
          <ul className="space-y-2">
            <li><a href="#upload" className="block px-2 py-1 rounded hover:bg-blue-100">Upload Excel File</a></li>
            <li><a href="#history" className="block px-2 py-1 rounded hover:bg-blue-100">Upload History</a></li>
            <li><a href="#charts" className="block px-2 py-1 rounded hover:bg-blue-100">View Generated Charts</a></li>
            {role === 'admin' && (
              <li><a href="/admin" className="block px-2 py-1 rounded hover:bg-red-100 text-red-700 font-semibold">🔧 Admin Panel</a></li>
            )}
          </ul>
        </nav>
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Welcome, {user?.name}</div>
          <button className="w-full py-2 bg-gray-700 text-white rounded" onClick={() => { dispatch(logout()); navigate('/'); }}>Logout</button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white shadow flex items-center justify-between px-8">
          <div className="font-semibold text-lg">Dashboard</div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Role: {role}</span>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex justify-between items-center">
              <span>{error}</span>
              <button onClick={clearErrorHandler} className="text-red-700 hover:text-red-900">
                ✕
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center py-4">
              <div className="text-blue-600">Loading...</div>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          )}

          {/* File Upload Section */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Upload Excel File</h3>
            <div className="space-y-4">
              <input
                type="file"
                id="fileInput"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={!selectedFile || loading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload File'}
              </button>
            </div>
          </section>

          {/* Upload History */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">Upload History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">File Name</th>
                    <th className="text-left py-2">Upload Date</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr key={upload._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{upload.originalname}</td>
                      <td className="py-2">{new Date(upload.uploadedAt).toLocaleString()}</td>
                      <td className="py-2 space-x-2">
                        <button
                          onClick={() => handleUploadSelect(upload)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >
                          View Data
                        </button>
                        <button
                          onClick={() => handleDelete(upload._id)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Chart Generation */}
          {selectedUpload && chartData && (
            <section className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Generate Charts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                    <option value="pie">Pie Chart</option>
                    <option value="doughnut">Doughnut Chart</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X Axis</label>
                  <select
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select X Axis</option>
                    {chartData.columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Y Axis</label>
                  <select
                    value={yAxis}
                    onChange={(e) => setYAxis(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="">Select Y Axis</option>
                    {chartData && chartData.columns
                      .filter(col => isColumnNumeric(col))
                      .map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                  </select>
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={generateChart}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Generate 2D Chart
                  </button>
                  <button
                    onClick={generate3DChart}
                    className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Generate 3D Chart
                  </button>
                </div>
              </div>

              {/* Chart Display */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold mb-2">2D Chart</h4>
                  <div className="relative">
                    <canvas id="chartCanvas" width="400" height="200"></canvas>
                    {chartInstance && (
                      <div className="mt-4 space-x-2">
                        <button
                          onClick={() => downloadChart('png')}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Download PNG
                        </button>
                        <button
                          onClick={() => downloadChart('pdf')}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                        >
                          Download PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-2">3D Chart</h4>
                  <div id="threeContainer" className="w-full h-64 border border-gray-300 rounded"></div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 