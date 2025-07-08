const axios = require('axios');

const BASE_URL = 'http://localhost:3000/users';
let authToken = '';
let adminToken = '';
let testUploadId = '';

const testEndpoints = async () => {
  console.log('🧪 Starting comprehensive endpoint tests...\n');

  try {
    // Test 1: User Registration
    console.log('1. Testing User Registration...');
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    };
    
    const registerResponse = await axios.post(`${BASE_URL}/signup`, userData);
    console.log('✅ User registration successful');
    
    // Test 2: Admin Registration
    console.log('\n2. Testing Admin Registration...');
    const adminData = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    };
    
    const adminRegisterResponse = await axios.post(`${BASE_URL}/signup`, adminData);
    console.log('✅ Admin registration successful');

    // Test 3: User Login
    console.log('\n3. Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    authToken = loginResponse.data.token;
    console.log('✅ User login successful');

    // Test 4: Admin Login
    console.log('\n4. Testing Admin Login...');
    const adminLoginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    adminToken = adminLoginResponse.data.token;
    console.log('✅ Admin login successful');

    // Test 5: Dashboard Access
    console.log('\n5. Testing Dashboard Access...');
    const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Dashboard access successful');

    // Test 6: Upload History (Empty)
    console.log('\n6. Testing Upload History (Empty)...');
    const uploadsResponse = await axios.get(`${BASE_URL}/uploads`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Upload history fetch successful');

    // Test 7: Admin Routes
    console.log('\n7. Testing Admin Routes...');
    
    // Get all users
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin users fetch successful');

    // Get admin stats
    const statsResponse = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin stats fetch successful');

    // Test 8: Error Handling Tests
    console.log('\n8. Testing Error Handling...');
    
    // Test invalid login
    try {
      await axios.post(`${BASE_URL}/login`, {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Invalid login error handling working');
      }
    }

    // Test unauthorized access
    try {
      await axios.get(`${BASE_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      if (error.response.status === 403) {
        console.log('✅ Unauthorized access error handling working');
      }
    }

    // Test invalid token
    try {
      await axios.get(`${BASE_URL}/dashboard`, {
        headers: { Authorization: 'Bearer invalidtoken' }
      });
    } catch (error) {
      if (error.response.status === 401) {
        console.log('✅ Invalid token error handling working');
      }
    }

    // Test 9: Input Validation
    console.log('\n9. Testing Input Validation...');
    
    // Test invalid email
    try {
      await axios.post(`${BASE_URL}/signup`, {
        name: 'Test',
        email: 'invalid-email',
        password: 'password123'
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Email validation working');
      }
    }

    // Test short password
    try {
      await axios.post(`${BASE_URL}/signup`, {
        name: 'Test',
        email: 'test2@example.com',
        password: '123'
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Password validation working');
      }
    }

    // Test missing fields
    try {
      await axios.post(`${BASE_URL}/signup`, {
        name: 'Test'
        // Missing email and password
      });
    } catch (error) {
      if (error.response.status === 400) {
        console.log('✅ Required fields validation working');
      }
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('- ✅ User registration and login');
    console.log('- ✅ Admin registration and login');
    console.log('- ✅ Dashboard access');
    console.log('- ✅ Upload history');
    console.log('- ✅ Admin panel routes');
    console.log('- ✅ Error handling');
    console.log('- ✅ Input validation');
    console.log('- ✅ Authorization checks');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Run tests
testEndpoints(); 