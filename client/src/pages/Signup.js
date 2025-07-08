import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signupUser } from '../features/auth/authThunks';
import { useNavigate } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, role: userRole } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(signupUser(name, email, password, role));
  };

  React.useEffect(() => {
    if (token && userRole) {
      navigate('/dashboard');
    }
  }, [token, userRole, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">Sign Up</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input className="w-full px-3 py-2 border rounded" type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full px-3 py-2 border rounded" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="w-full px-3 py-2 border rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <select className="w-full px-3 py-2 border rounded" value={role} onChange={e => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button className="w-full py-2 font-semibold text-white bg-green-600 rounded hover:bg-green-700" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
        </form>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <p className="text-center text-sm">Already have an account? <a href="/" className="text-blue-600 hover:underline">Login</a></p>
      </div>
    </div>
  );
};

export default Signup; 