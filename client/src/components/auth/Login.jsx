import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TiLocationArrow } from "react-icons/ti";
import Button from '../Button';
import { useAuth } from '../../context/AuthContext.jsx';
import { validateLoginForm } from '../../utils/validation.js';
import OAuthButtons from './OAuthButtons';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, error } = useAuth();
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const introVideoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const formContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });


  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // No need for manual transition handling or animations
    
    // Start with the intro video
    if (introVideoRef.current) {
      introVideoRef.current.play();
      
      // Listen for video end
      introVideoRef.current.addEventListener('ended', () => {
        // Immediately show login form without animation
        setShowLoginForm(true);
        
        // Set intro video opacity to 0
        if (introVideoRef.current) {
          introVideoRef.current.style.opacity = 0;
        }

        // Play background video
        if (bgVideoRef.current) {
          bgVideoRef.current.play();
        }
      });
    }
  }, []);

  // No animation for login form entry
  useEffect(() => {
    // Simply ensure elements are visible without animations
    if (showLoginForm) {
      if (formContainerRef.current) {
        formContainerRef.current.style.opacity = 1;
      }
      
      if (contentRef.current) {
        contentRef.current.style.opacity = 1;
      }
      
      // Make sure form elements are visible
      document.querySelectorAll('.form-element').forEach(el => {
        el.style.opacity = 1;
      });
    }
  }, [showLoginForm]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (loginError) setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, errors } = validateLoginForm(formData);
    if (!isValid) {
      // Display the first error
      const firstError = Object.values(errors)[0];
      setLoginError(firstError);
      return;
    }
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      await login(formData);
      // Navigate directly without transition
      navigate('/dashboard');
    } catch (err) {
      setLoginError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Intro Video */}
      <video
        ref={introVideoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        playsInline
        muted
      >
        <source src="/videos/Intro.mp4" type="video/mp4" />
      </video>

      {/* Background Video */}
      <video
        ref={bgVideoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        playsInline
        muted
        loop
      >
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-20" />
      
      {/* Main Content Container - Increased z-index */}
      <div className="main-content absolute inset-0 z-[100]">
        {/* Navigation Buttons - Higher z-index */}
        <div className="absolute top-4 left-4 z-[110]">
          <Link to="/">
            <img src="/img/logo.png" alt="logo" className="w-10 hover:scale-110 transition-transform" />
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-[110]">
          <Link to="/signup">
            <Button
              id="signup-button"
              title="SIGN UP"
              rightIcon={<TiLocationArrow />}
              containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
            />
          </Link>
        </div>

        {/* Content Container */}
        {showLoginForm && (
          <div className="container mx-auto h-full flex items-center justify-between px-4 lg:px-8 z-[110] opacity-100 mt-5 ml-1">
            {/* Login Form - Higher z-index */}
            <div
              ref={formContainerRef}
              className="w-full max-w-md p-8 rounded-2xl backdrop-blur-sm bg-black/25 border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
            >
            <h2 className="form-element text-4xl font-zentry font-bold mb-8 text-white text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text transparent">
              Welcome Back
            </h2>
            
            {loginError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-40">
              <div className="form-element relative">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50 relative z-40"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
              
              <div className="form-element relative">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50 relative z-40"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                  style={{ pointerEvents: 'auto' }}
                />
              </div>
              
              <div className="form-element text-right relative z-40">
                <Link to="/forgot-password" className="text-sm text-purple-300 hover:text-purple-200 transition-colors relative z-40" style={{ pointerEvents: 'auto' }}>
                  Forgot password?
                </Link>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="form-element w-full py-3 px-6 text-center text-white font-robert-medium bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg transition-transform duration-300 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 relative z-40"
                style={{ pointerEvents: 'auto' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
              
              {/* OAuth Buttons */}
              <OAuthButtons />
            </form>
            </div>

            {/* Right Side Content */}
            <div
              ref={contentRef}
              className="hidden lg:flex flex-col items-start justify-center w-full max-w-xl text-white space-y-6 pl-8"
            >
              <h1 className="text-5xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Connect & Collaborate
              </h1>
              <p className="text-xl font-robert-regular text-white/90 leading-relaxed">
                Welcome to NexusHub, where innovation meets collaboration. Our platform brings together businesses, creators, and teams in one unified space.
              </p>
              <ul className="space-y-4 text-lg font-general text-white/80">
                <li className="flex items-center space-x-2">
                  <span className="text-purple-400">✦</span>
                  <span>Real-time messaging and collaboration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-purple-400">✦</span>
                  <span>Smart project and task management</span>
                </li>
                <li className="flex items-center space-x-2">
                  <span className="text-purple-400">✦</span>
                  <span>Seamless file sharing and organization</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login; 