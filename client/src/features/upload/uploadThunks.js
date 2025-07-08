import { 
  uploadStart, 
  uploadSuccess, 
  uploadFailure, 
  fetchUploadsStart, 
  fetchUploadsSuccess, 
  fetchUploadsFailure,
  deleteUploadStart,
  deleteUploadSuccess,
  deleteUploadFailure,
  setUploadProgress
} from './uploadSlice';

export const uploadFile = (file) => async (dispatch, getState) => {
  const { token } = getState().auth;
  const formData = new FormData();
  formData.append('file', file);
  
  dispatch(uploadStart());
  
  try {
    const res = await fetch('http://localhost:3000/users/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.msg || 'Upload failed');
    }
    
    dispatch(uploadSuccess(data));
    return data;
  } catch (err) {
    const errorMessage = err.message || 'Upload failed. Please try again.';
    dispatch(uploadFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const fetchUploads = () => async (dispatch, getState) => {
  const { token } = getState().auth;
  
  dispatch(fetchUploadsStart());
  
  try {
    const res = await fetch('http://localhost:3000/users/uploads', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.msg || 'Failed to fetch uploads');
    }
    
    dispatch(fetchUploadsSuccess(data));
    return data;
  } catch (err) {
    const errorMessage = err.message || 'Failed to fetch uploads. Please try again.';
    dispatch(fetchUploadsFailure(errorMessage));
    throw new Error(errorMessage);
  }
};

export const deleteUpload = (uploadId) => async (dispatch, getState) => {
  const { token } = getState().auth;
  
  dispatch(deleteUploadStart());
  
  try {
    const res = await fetch(`http://localhost:3000/users/uploads/${uploadId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.msg || 'Failed to delete upload');
    }
    
    dispatch(deleteUploadSuccess(uploadId));
    return data;
  } catch (err) {
    const errorMessage = err.message || 'Failed to delete upload. Please try again.';
    dispatch(deleteUploadFailure(errorMessage));
    throw new Error(errorMessage);
  }
}; 