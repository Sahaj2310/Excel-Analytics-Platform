import { authStart, authSuccess, authFailure } from './authSlice';

export const loginUser = (email, password) => async (dispatch) => {
  dispatch(authStart());
  try {
    const res = await fetch('http://localhost:3000/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Login failed');
    dispatch(authSuccess({ user: data.user, token: data.token, role: data.user.role }));
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  } catch (err) {
    dispatch(authFailure(err.message));
  }
};

export const signupUser = (name, email, password, role) => async (dispatch) => {
  dispatch(authStart());
  try {
    const res = await fetch('http://localhost:3000/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Signup failed');
    // Optionally, auto-login after signup
    dispatch(loginUser(email, password));
  } catch (err) {
    dispatch(authFailure(err.message));
  }
};

export const uploadExcel = (file) => async (dispatch, getState) => {
  dispatch(authStart());
  const { token } = getState().auth;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:3000/users/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Upload failed');
    // Optionally, you can dispatch a success action or return data
    return data;
  } catch (err) {
    dispatch(authFailure(err.message));
    throw err;
  }
};

export const fetchUploadHistory = () => async (dispatch, getState) => {
  const { token } = getState().auth;
  try {
    const res = await fetch('http://localhost:3000/users/uploads', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to fetch history');
    return data;
  } catch (err) {
    dispatch(authFailure(err.message));
    throw err;
  }
};

export const deleteUpload = (id) => async (dispatch, getState) => {
  const { token } = getState().auth;
  try {
    const res = await fetch(`http://localhost:3000/users/uploads/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.msg || 'Failed to delete upload');
    return data;
  } catch (err) {
    dispatch(authFailure(err.message));
    throw err;
  }
}; 