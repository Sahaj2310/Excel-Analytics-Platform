import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/auth/authSlice';
import { fetchAllUsers, fetchAdminStats, fetchUserUploads } from '../features/auth/authThunks';

const AdminPanel = () => {
  const { user, token, role } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userUploads, setUserUploads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || role !== 'admin') {
      navigate('/');
      return;
    }
    loadAdminData();
  }, [token, role, navigate]);

  const loadAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, statsData] = await Promise.all([
        dispatch(fetchAllUsers()),
        dispatch(fetchAdminStats())
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (userId) => {
    try {
      const userData = await dispatch(fetchUserUploads(userId));
      setSelectedUser(userData.user);
      setUserUploads(userData.uploads);
    } catch (err) {
      setError(err.message);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this panel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="h-16 flex items-center justify-center font-bold text-xl border-b">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-4">
          <div className="text-gray-700 font-semibold">Management</div>
          <ul className="space-y-2">
            <li><a href="#dashboard" className="block px-2 py-1 rounded hover:bg-blue-100">Dashboard</a></li>
            <li><a href="#users" className="block px-2 py-1 rounded hover:bg-blue-100">User Management</a></li>
            <li><a href="#storage" className="block px-2 py-1 rounded hover:bg-blue-100">Storage Analytics</a></li>
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
          <div className="font-semibold text-lg">Admin Dashboard</div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Admin: {user?.name}</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 space-y-8 overflow-y-auto">
          {loading && (
            <div className="text-center py-8">
              <div className="text-blue-600">Loading admin data...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Statistics Overview */}
          {stats && (
            <section className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
                  <div className="text-gray-600">Total Users</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalUploads}</div>
                  <div className="text-gray-600">Total Uploads</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatBytes(stats.totalStorageSize)}</div>
                  <div className="text-gray-600">Storage Used</div>
                </div>
              </div>
            </section>
          )}

          {/* User Management */}
          <section className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-bold mb-4">User Management</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Name</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Role</th>
                    <th className="text-left py-2">Uploads</th>
                    <th className="text-left py-2">Storage</th>
                    <th className="text-left py-2">Last Upload</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.userStats.map((userStat) => (
                    <tr key={userStat.user._id} className="border-b hover:bg-gray-50">
                      <td className="py-2">{userStat.user.name}</td>
                      <td className="py-2">{userStat.user.email}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${userStat.user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                          {userStat.user.role}
                        </span>
                      </td>
                      <td className="py-2">{userStat.uploads}</td>
                      <td className="py-2">{formatBytes(userStat.storageSize)}</td>
                      <td className="py-2">{userStat.lastUpload ? formatDate(userStat.lastUpload) : 'Never'}</td>
                      <td className="py-2">
                        <button 
                          onClick={() => handleUserClick(userStat.user._id)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* User Upload Details */}
          {selectedUser && (
            <section className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-4">Upload Details: {selectedUser.name}</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">File Name</th>
                      <th className="text-left py-2">Original Name</th>
                      <th className="text-left py-2">Columns</th>
                      <th className="text-left py-2">Rows</th>
                      <th className="text-left py-2">Size</th>
                      <th className="text-left py-2">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userUploads.map((upload) => (
                      <tr key={upload._id} className="border-b hover:bg-gray-50">
                        <td className="py-2">{upload.filename}</td>
                        <td className="py-2">{upload.originalname}</td>
                        <td className="py-2">{upload.columns}</td>
                        <td className="py-2">{upload.rows}</td>
                        <td className="py-2">{formatBytes(upload.storageSize)}</td>
                        <td className="py-2">{formatDate(upload.uploadedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel; 