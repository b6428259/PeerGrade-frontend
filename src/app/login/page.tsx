'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false); // New state to trigger navigation
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);
  
    try {
      const response = await axios.post('http://localhost:5000/api/users/login', {
        id,
        password
      });
  
      // Store the user data along with the token
      login(response.data.token, response.data.user); 
      setMessage('Login successful!');
      setLoginSuccess(true);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else {
        setError('An error occurred. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  // Use useEffect to handle navigation after login success
  useEffect(() => {
    if (loginSuccess) {
      router.push('/home');
    }
  }, [loginSuccess, router]); // Only runs when loginSuccess changes

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="w-full max-w-md px-8 py-10 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl">
        {/* Logo or Brand */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-blue-200">Login to access your dashboard</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/50 text-red-200">
            {error}
          </div>
        )}

        {/* Success Message */}
        {message && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/50 text-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-blue-200">
              ID
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-blue-800/50 text-white rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-blue-400/50 transition duration-200"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-blue-200">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-blue-800/50 text-white rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         placeholder-blue-400/50 transition duration-200"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg
                     hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 
                     focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform transition duration-200 ease-in-out hover:scale-[1.02]
                     flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>

        {/* Optional: Forgot Password Link */}
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-blue-300 hover:text-blue-200 transition duration-200">
            Forgot your password?
          </a>
        </div>
      </div>
    </div>
  );
}
