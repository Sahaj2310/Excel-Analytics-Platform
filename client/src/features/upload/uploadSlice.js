import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  uploads: [],
  currentUpload: null,
  loading: false,
  error: null,
  uploadProgress: 0
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    uploadStart: (state) => {
      state.loading = true;
      state.error = null;
      state.uploadProgress = 0;
    },
    uploadSuccess: (state, action) => {
      state.loading = false;
      state.currentUpload = action.payload;
      state.uploadProgress = 100;
      state.error = null;
    },
    uploadFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.uploadProgress = 0;
    },
    fetchUploadsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUploadsSuccess: (state, action) => {
      state.loading = false;
      state.uploads = action.payload;
      state.error = null;
    },
    fetchUploadsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUploadStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteUploadSuccess: (state, action) => {
      state.loading = false;
      state.uploads = state.uploads.filter(upload => upload._id !== action.payload);
      state.error = null;
    },
    deleteUploadFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentUpload: (state) => {
      state.currentUpload = null;
      state.uploadProgress = 0;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
    resetUploadState: (state) => {
      state.uploads = [];
      state.currentUpload = null;
      state.loading = false;
      state.error = null;
      state.uploadProgress = 0;
    }
  }
});

export const { 
  uploadStart, 
  uploadSuccess, 
  uploadFailure, 
  fetchUploadsStart, 
  fetchUploadsSuccess, 
  fetchUploadsFailure,
  deleteUploadStart,
  deleteUploadSuccess,
  deleteUploadFailure,
  clearError,
  clearCurrentUpload,
  setUploadProgress,
  resetUploadState
} = uploadSlice.actions;

export default uploadSlice.reducer; 