import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { TiLocationArrow } from "react-icons/ti";

const Signup = () => {
  const [showSignupForm, setShowSignupForm] = useState(false);
  const introVideoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const formContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
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
            setShowSignupForm(true);
            // Play background video
            if (bgVideoRef.current) {
              bgVideoRef.current.play();
            }
          }
        });
      });
    }
  }, []);

  // Animation for signup form entry
  useEffect(() => {
    if (showSignupForm) {
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
  }, [showSignupForm]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Signup attempt with:', formData);
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
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
      {showSignupForm && (
        <div className="absolute inset-0 z-10 container mx-auto flex items-center justify-between px-4 lg:px-8">
          {/* Signup Form */}
          <div
            ref={formContainerRef}
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-sm bg-black/25 border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
          >
            <h2 className="form-element text-4xl font-zentry font-bold mb-8 text-white text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text transparent">
              Create Account
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-element">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50"
                  placeholder="Enter your full name"
                  required
                />
              </div>

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
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="form-element">
                <label className="block text-sm font-robert-regular font-medium text-white mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-purple-500/20 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/50"
                  placeholder="Confirm your password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="form-element w-full py-3 px-6 text-center text-white font-robert-medium bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg transition-transform duration-300 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign Up
              </button>
            </form>
          </div>

          {/* Right Side Content */}
          <div
            ref={contentRef}
            className="hidden lg:flex flex-col items-start justify-center w-full max-w-xl text-white space-y-6 pl-8"
          >
            <h1 className="text-5xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Join NexusHub Today
            </h1>
            <p className="text-xl font-robert-regular text-white/90 leading-relaxed">
              Start your journey with NexusHub and unlock a world of possibilities. Create, collaborate, and connect with professionals worldwide.
            </p>
            <ul className="space-y-4 text-lg font-general text-white/80">
              <li className="flex items-center space-x-2">
                <span className="text-purple-400">✦</span>
                <span>Create your professional portfolio</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-400">✦</span>
                <span>Connect with like-minded professionals</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-400">✦</span>
                <span>Access powerful collaboration tools</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup; 