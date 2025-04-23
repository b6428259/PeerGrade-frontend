import axios from 'axios';

// Create an Axios instance for API requests
const API = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend URL
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
