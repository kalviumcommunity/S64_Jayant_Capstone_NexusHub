import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { TiLocationArrow } from "react-icons/ti";
import Button from '../Button';

const Login = () => {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const introVideoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const formContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  useEffect(() => {
    // Initial animation timeline
    const tl = gsap.timeline();

    // Start with the intro video
    if (introVideoRef.current) {
      introVideoRef.current.play();
      
      // Listen for video end
      introVideoRef.current.addEventListener('ended', () => {
        // Fade out intro video
        tl.to(introVideoRef.current, {
          opacity: 0,
          duration: 1,
          ease: 'power2.inOut',
          onComplete: () => {
            setShowLoginForm(true);
            // Play background video
            if (bgVideoRef.current) {
              bgVideoRef.current.play();
            }
          }
        });
      });
    }
  }, []);

  // Animation for login form entry
  useEffect(() => {
    if (showLoginForm) {
      if (formContainerRef.current) {
        gsap.from(formContainerRef.current, {
          opacity: 0,
          x: -50,
          duration: 1,
          ease: 'power3.out'
        });
      }

      if (contentRef.current) {
        gsap.from(contentRef.current, {
          opacity: 0,
          x: 50,
          duration: 1,
          ease: 'power3.out',
          delay: 0.3
        });
      }

      // Animate form elements
      gsap.from('.form-element', {
        opacity: 0,
        y: 20,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power2.out',
        delay: 0.5
      });
    }
  }, [showLoginForm]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login attempt with:', formData);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Navigation Buttons */}
      <div className="absolute top-4 left-4 z-50">
        <Link to="/">
          <img src="/img/logo.png" alt="logo" className="w-10 hover:scale-110 transition-transform" />
        </Link>
      </div>
      <div className="absolute top-4 right-4 z-50">
        <Link to="/signup">
          <Button
            id="signup-button"
            title="SIGN UP"
            rightIcon={<TiLocationArrow />}
            containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
          />
        </Link>
      </div>

      {/* Intro Video */}
      <video
        ref={introVideoRef}
        className="absolute inset-0 w-full h-full object-cover z-20"
        playsInline
        muted
      >
        <source src="/videos/Intro.mp4" type="video/mp4" />
      </video>

      {/* Background Video */}
      <video
        ref={bgVideoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        loop
      >
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

      {/* Content Container */}
      {showLoginForm && (
        <div className="absolute inset-0 z-10 container mx-auto flex items-center justify-between px-4 lg:px-8">
          {/* Login Form */}
          <div
            ref={formContainerRef}
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-sm bg-black/25 border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
          >
            <h2 className="form-element text-4xl font-zentry font-bold mb-8 text-white text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text transparent">
              Welcome Back
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-element">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50"
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="form-element">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="form-element w-full py-3 px-6 text-center text-white font-robert-medium bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg transition-transform duration-300 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign In
              </button>
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
  );
};

export default Login; 