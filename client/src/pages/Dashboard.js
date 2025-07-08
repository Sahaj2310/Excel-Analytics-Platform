// Move all imports to the top
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { uploadExcel, fetchUploadHistory, deleteUpload } from '../features/auth/authThunks';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const { user, token, role } = useSelector((state) => state.auth);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    const fetchData = async () => {
      try {
        const res = await fetch('http://localhost:3000/users/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Unauthorized');
        setMessage(data.msg);
      } catch (err) {
        setError(err.message);
        dispatch(logout());
        navigate('/');
      }
    };
    fetchData();
  }, [token, dispatch, navigate]);

  // Fetch upload history on mount
  useEffect(() => {
    if (!token) return;
    setHistoryLoading(true);
    dispatch(fetchUploadHistory())
      .then(res => setHistory(res.payload || res))
      .catch(err => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false));
  }, [token, dispatch]);

  // Set latest upload as default after login or history refresh
  useEffect(() => {
    if (history.length > 0) {
      setUploadResult(history[0].data);
    }
  }, [history]);

  // Upload handler
  const handleFileChange = async (e) => {
    setUploadError('');
    setUploadResult(null);
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const data = await dispatch(uploadExcel(file));
      setUploadResult(data && data.payload ? data.payload : data);
      // Refresh history after upload
      const historyData = await dispatch(fetchUploadHistory());
      setHistory(historyData && historyData.payload ? historyData.payload : historyData);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    setHistoryError('');
    try {
      await dispatch(deleteUpload(id));
      // Refresh history after delete
      const historyData = await dispatch(fetchUploadHistory());
      setHistory(historyData && historyData.payload ? historyData.payload : historyData);
    } catch (err) {
      setHistoryError(err.message);
    }
  };

  // Helper to get chart data
  const getChartData = () => {
    if (!uploadResult || !xAxis || !yAxis) return null;
    
    // Filter out rows with invalid data
    const validRows = uploadResult.rows.filter(row => 
      row[xAxis] !== undefined && 
      row[yAxis] !== undefined && 
      !isNaN(Number(row[yAxis]))
    );
    
    if (validRows.length === 0) {
      console.log('No valid data found for chart');
      return null;
    }
    
    const labels = validRows.map(row => String(row[xAxis]));
    const data = validRows.map(row => Number(row[yAxis]));
    
    console.log('Chart data:', { labels, data, xAxis, yAxis });
    
    return {
      labels,
      datasets: [
        {
          label: `${yAxis} vs ${xAxis}`,
          data,
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Helper for scatter chart
  const getScatterData = () => {
    if (!uploadResult || !xAxis || !yAxis) return null;
    
    const validRows = uploadResult.rows.filter(row => 
      row[xAxis] !== undefined && 
      row[yAxis] !== undefined && 
      !isNaN(Number(row[xAxis])) && 
      !isNaN(Number(row[yAxis]))
    );
    
    if (validRows.length === 0) return null;
    
    return {
      datasets: [
        {
          label: `${yAxis} vs ${xAxis}`,
          data: validRows.map(row => ({ 
            x: Number(row[xAxis]), 
            y: Number(row[yAxis]) 
          })),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-2xl p-8 space-y-6 bg-white rounded shadow-md">
          <h2 className="text-2xl font-bold text-center text-red-600">Access Denied</h2>
          <p className="text-center text-red-600">{error}</p>
        </div>
      </div>
    );
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
          </ul>
        </nav>
        <div className="p-4 border-t">
          <button className="w-full py-2 bg-gray-700 text-white rounded" onClick={() => { dispatch(logout()); navigate('/'); }}>Logout</button>
        </div>
      </aside>
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 bg-white shadow flex items-center justify-between px-8">
          <div className="font-semibold text-lg">Dashboard</div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user?.name} ({role})</span>
          </div>
        </header>
        {/* Content Sections */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          <section id="upload" className="bg-white rounded shadow p-6">
            <h3 className="text-xl font-bold mb-2">Upload Excel File</h3>
            <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} disabled={uploading} className="mb-2" />
            {uploading && <div className="text-blue-600">Uploading...</div>}
            {uploadError && <div className="text-red-600">{uploadError}</div>}
            {uploadResult && (
              <div className="mt-4">
                <div className="font-semibold mb-2">Parsed Columns:</div>
                <div className="mb-2 flex flex-wrap gap-2">{uploadResult.columns?.map(col => <span key={col} className="bg-gray-200 px-2 py-1 rounded text-sm">{col}</span>)}</div>
                <div className="font-semibold mb-2">First 5 Rows:</div>
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(uploadResult.rows?.slice(0,5), null, 2)}</pre>
              </div>
            )}
          </section>
          <section id="history" className="bg-white rounded shadow p-6">
            <h3 className="text-xl font-bold mb-2">Upload History</h3>
            {historyLoading ? (
              <div>Loading...</div>
            ) : historyError ? (
              <div className="text-red-600">{historyError}</div>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="border-b px-2 py-1 text-left">File Name</th>
                    <th className="border-b px-2 py-1 text-left">Original Name</th>
                    <th className="border-b px-2 py-1 text-left">Uploaded At</th>
                    <th className="border-b px-2 py-1 text-left">Columns</th>
                    <th className="border-b px-2 py-1 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(upload => (
                    <tr key={upload._id}>
                      <td className="border-b px-2 py-1">{upload.filename}</td>
                      <td className="border-b px-2 py-1">{upload.originalname}</td>
                      <td className="border-b px-2 py-1">{new Date(upload.uploadedAt).toLocaleString()}</td>
                      <td className="border-b px-2 py-1">{upload.data?.columns?.join(', ')}</td>
                      <td className="border-b px-2 py-1">
                        <button className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" onClick={() => handleDelete(upload._id)}>Delete</button>
                        <button className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={() => setUploadResult(upload.data)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
          <section id="charts" className="bg-white rounded shadow p-6">
            <h3 className="text-xl font-bold mb-2">View Generated Charts</h3>
            {uploadResult && uploadResult.columns && (
              <div className="mb-4 flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm font-semibold mb-1">Chart Type</label>
                  <select className="border rounded px-2 py-1" value={chartType} onChange={e => setChartType(e.target.value)}>
                    <option value="bar">Bar</option>
                    <option value="line">Line</option>
                    <option value="pie">Pie</option>
                    <option value="scatter">Scatter</option>
                    <option value="3d">3D Column (Three.js)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">X Axis</label>
                  <select className="border rounded px-2 py-1" value={xAxis} onChange={e => setXAxis(e.target.value)}>
                    <option value="">Select</option>
                    {uploadResult.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Y Axis</label>
                  <select className="border rounded px-2 py-1" value={yAxis} onChange={e => setYAxis(e.target.value)}>
                    <option value="">Select</option>
                    {uploadResult.columns.map(col => <option key={col} value={col}>{col}</option>)}
                  </select>
                </div>
              </div>
            )}
            {/* Render Chart */}
            {uploadResult && xAxis && yAxis && chartType !== '3d' && (
              <div className="bg-gray-50 p-4 rounded" style={{ height: '400px' }}>
                {(() => {
                  const chartData = getChartData();
                  if (!chartData) {
                    return <div className="text-red-600">No valid data found for selected columns</div>;
                  }
                  console.log('Rendering chart:', chartType, chartData);
                  return (
                    <>
                      {chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
                      {chartType === 'line' && <Line data={chartData} options={chartOptions} />}
                      {chartType === 'pie' && <Pie data={{
                        labels: chartData.labels,
                        datasets: [{
                          data: chartData.datasets[0].data,
                          backgroundColor: [
                            'rgba(255, 99, 132, 0.5)',
                            'rgba(54, 162, 235, 0.5)',
                            'rgba(255, 206, 86, 0.5)',
                            'rgba(75, 192, 192, 0.5)',
                            'rgba(153, 102, 255, 0.5)',
                            'rgba(255, 159, 64, 0.5)'
                          ],
                        }],
                      }} options={chartOptions} />}
                      {chartType === 'scatter' && (() => {
                        const scatterData = getScatterData();
                        if (!scatterData) {
                          return <div className="text-red-600">No valid numeric data for scatter chart</div>;
                        }
                        return <Scatter data={scatterData} options={chartOptions} />;
                      })()}
                    </>
                  );
                })()}
              </div>
            )}
            {/* Debug Info */}
            {uploadResult && (
              <div className="mt-4 p-4 bg-gray-100 rounded text-xs">
                <h4 className="font-bold mb-2">Debug Info:</h4>
                <p>X Axis: {xAxis}</p>
                <p>Y Axis: {yAxis}</p>
                <p>Chart Type: {chartType}</p>
                <p>Rows Count: {uploadResult.rows?.length || 0}</p>
                <p>Columns: {uploadResult.columns?.join(', ')}</p>
              </div>
            )}
            {/* 3D Chart Placeholder */}
            {uploadResult && xAxis && yAxis && chartType === '3d' && (
              <div className="h-96 bg-gray-50 rounded">
                <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  {/* Simple 3D columns for demo */}
                  {getChartData().labels.map((label, i) => (
                    <mesh key={label} position={[i * 2 - getChartData().labels.length, getChartData().datasets[0].data[i] / 2, 0]}>
                      <boxGeometry args={[1, getChartData().datasets[0].data[i], 1]} />
                      <meshStandardMaterial color={'#36a2eb'} />
                    </mesh>
                  ))}
                  <OrbitControls />
                </Canvas>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard; 