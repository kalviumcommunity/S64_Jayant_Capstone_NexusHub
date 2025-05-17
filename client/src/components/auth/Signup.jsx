import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TiLocationArrow } from "react-icons/ti";
import Button from '../Button';
import { useAuth } from '../../context/AuthContext.jsx';
import { validateSignupForm } from '../..//utils/validation.js';
import OAuthButtons from './OAuthButtons';

const Signup = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  
  const introVideoRef = useRef(null);
  const bgVideoRef = useRef(null);
  const formContainerRef = useRef(null);
  const contentRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // No need for manual transition handling or animations
    // App.jsx will handle hiding the loader after route change
  
    // Start background video
    if (bgVideoRef.current) {
      bgVideoRef.current.play();
    }

    // Ensure content stays visible
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.opacity = '1';
      mainContent.style.visibility = 'visible';
    }

    // Make sure form elements are visible without animations
    if (formContainerRef.current) {
      formContainerRef.current.style.opacity = 1;
    }
    
    if (contentRef.current) {
      contentRef.current.style.opacity = 1;
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (signupError) setSignupError('');
    
    // Check password match when either password field changes
    if (name === 'password' || name === 'confirmPassword') {
      if (name === 'password') {
        setPasswordMatch(value === formData.confirmPassword || formData.confirmPassword === '');
      } else {
        setPasswordMatch(value === formData.password);
      }
    }
    
    // Generate username from name if username is empty
    if (name === 'name' && !formData.username) {
      const username = value.toLowerCase().replace(/\s+/g, '');
      setFormData(prev => ({
        ...prev,
        username
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const { isValid, errors } = validateSignupForm(formData);
    if (!isValid) {
      // Display the first error
      const firstError = Object.values(errors)[0];
      setSignupError(firstError);
      
      // If password mismatch is the error, also set the visual indicator
      if (errors.confirmPassword === 'Passwords do not match') {
        setPasswordMatch(false);
      }
      
      return;
    }
    
    setIsLoading(true);
    setSignupError('');
    
    try {
      // Create registration data object (exclude confirmPassword)
      const registrationData = {
        name: formData.name,
        username: formData.username,
        email: formData.email,
        password: formData.password
      };
      
      await register(registrationData);
      // Navigate directly without transition
      navigate('/dashboard');
    } catch (err) {
      setSignupError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto overflow-x-hidden">
      
      {/* Main Content Container - Increased z-index */}
      <div className="main-content absolute inset-0 z-[100] overflow-y-auto overflow-x-hidden">
        {/* Navigation Buttons - Higher z-index */}
        <div className="absolute top-4 left-4 z-50">
          <Link to="/">
            <img src="/img/logo.png" alt="logo" className="w-10 hover:scale-110 transition-transform" />
          </Link>
        </div>
        <div className="absolute top-4 right-4 z-[110]">
          <Link to="/login">
            <Button
              id="login-button"
              title="LOGIN"
              rightIcon={<TiLocationArrow />}
              containerClass="bg-blue-50 flex items-center justify-center gap-1"
            />
          </Link>
        </div>
        
        {/* Content Container */}
        <div className="container mx-auto min-h-screen py-20 flex items-center justify-between px-4 lg:px-8 z-[110] opacity-100">
          {/* Signup Form - Higher z-index */}
          <div
            ref={formContainerRef}
            className="w-full max-w-md p-8 rounded-2xl backdrop-blur-sm bg-black/25 border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
          >
            <h2 className="form-element text-5xl font-zentry font-bold mb-8 text-white text-center">
              CREATE ACCOUNT
            </h2>
            
            {signupError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {signupError}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-element">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
                  placeholder="Enter your full name"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-element">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
                  placeholder="Choose a username"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-element">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-element">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30"
                  placeholder="Create a password"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="form-element">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${!passwordMatch ? 'border-red-500' : 'border-white/10'} text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-white/30`}
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                {!passwordMatch && (
                  <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading || !passwordMatch}
                className="form-element w-full py-3 px-6 text-center text-white font-medium bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg transition-all duration-300 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:scale-[1.02] active:scale-[0.98] mt-8 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Sign Up'
                )}
              </button>
              
              {/* OAuth Buttons */}
              <OAuthButtons />
            </form>
          </div>

          {/* Right Side Content - Higher z-index */}
          <div
            ref={contentRef}
            className="hidden lg:flex flex-col items-start justify-center w-full max-w-xl text-white space-y-8 pl-12 backdrop-blur-sm bg-black/25 p-8 rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
          >
            <h1 className="text-6xl font-zentry font-bold text-white">
              JOIN NEXUSHUB TODAY
            </h1>
            <p className="text-xl font-robert-regular text-white/80 leading-relaxed">
              Start your journey with NexusHub and unlock a world of possibilities. Create, collaborate, and connect with professionals worldwide.
            </p>
            <ul className="space-y-4 text-lg font-general text-white/70">
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
      </div>

      {/* Background Video - Lowest z-index */}
      <video
        ref={bgVideoRef}
        className="absolute inset-0 w-full h-full object-cover z-0"
        playsInline
        muted
        loop
        autoPlay
      >
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay - Low z-index */}
      <div className="absolute inset-0 bg-black/50 z-10" />

      {/* Transition Loader - Highest z-index */}
      <div className="loader z-[120]"></div>
    </div>
  );
};

export default Signup; 




// import React, { useState, useEffect, useRef } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import { gsap } from 'gsap';
// import Button from '../Button';
// import { handlePageTransition } from '../../utils/transitions'; // Adjust import path if needed
// import '../../styles/transitions.css'; // Ensure CSS is correctly imported

// const Signup = () => {
//   const navigate = useNavigate();
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//   });

//   const formContainerRef = useRef(null);
//   const contentRef = useRef(null);

//   useEffect(() => {
//     handlePageTransition(); // Call transition function on mount

//     // Initial animation timeline for form entry
//     const tl = gsap.timeline();
//     tl.from(formContainerRef.current, {
//       opacity: 0,
//       x: -50,
//       duration: 1,
//       ease: 'power3.out',
//     });

//     if (contentRef.current) {
//       gsap.from(contentRef.current, {
//         opacity: 0,
//         x: 50,
//         duration: 1,
//         ease: 'power3.out',
//         delay: 0.3,
//       });

//       gsap.from('.form-element', {
//         opacity: 0,
//         y: 20,
//         duration: 0.8,
//         stagger: 0.15,
//         ease: 'power2.out',
//         delay: 0.5,
//       });
//     }
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       console.log('Signup submitted:', formData);
//       navigate('/dashboard');
//     } catch (error) {
//       console.error('Signup failed:', error);
//     }
//   };

//   return (
//     <div className="relative h-screen w-full overflow-hidden">
//       {/* Navigation Buttons */}
//       <div className="absolute top-4 left-4 z-50">
//         <Link to="/">
//           <img src="/img/logo.png" alt="logo" className="w-10 hover:scale-110 transition-transform" />
//         </Link>
//       </div>
//       <div className="absolute top-4 right-4 z-50">
//         <Link to="/login">
//           <Button
//             id="login-button"
//             title="LOGIN"
//             containerClass="bg-blue-50 md:flex hidden items-center justify-center gap-1"
//           />
//         </Link>
//       </div>

//       {/* Background Video */}
//       <video
//         className="absolute inset-0 w-full h-full object-cover"
//         playsInline
//         muted
//         loop
//       >
//         <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
//       </video>

//       {/* Overlay */}
//       <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

//       {/* Content Container */}
//       <div className="absolute inset-0 z-10 flex items-center justify-center px-4 lg:px-8">
//         <div
//           ref={formContainerRef}
//           className="w-full max-w-md p-8 rounded-2xl backdrop-blur-sm bg-black/25 border border-white/10 shadow-[0_0_50px_rgba(192,132,252,0.15)]"
//         >
//           <h2 className="form-element text-4xl font-zentry font-bold mb-8 text-white text-center bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text transparent">
//             Sign Up
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div className="form-element">
//               <label className="block text-sm font-medium text-white mb-2">
//                 Full Name
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 rounded-lg bg-white/10 border text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
//                 placeholder="Enter your name"
//                 required
//               />
//             </div>

//             <div className="form-element">
//               <label className="block text-sm font-medium text-white mb-2">
//                 Email
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 rounded-lg bg-white/10 border text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
//                 placeholder="Enter your email"
//                 required
//               />
//             </div>

//             <div className="form-element">
//               <label className="block text-sm font-medium text-white mb-2">
//                 Password
//               </label>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 className="w-full px-4 py-3 rounded-lg bg-white/10 border text-white font-circular-web focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
//                 placeholder="Enter your password"
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               className="w-full py-3 px-6 text-center text-white font-medium bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98]"
//             >
//               Register
//             </button>
//           </form>

//           <p className="mt-4 text-white text-center">
//             Already have an account?{' '}
//             <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
//           </p>
//         </div>
//       </div>

//       {/* Right Side Content (Optional) */}
//       <div ref={contentRef} className="hidden lg:flex flex-col items-start justify-center w-full max-w-xl text-white space-y-6 pl-8">
//         <h1 className="text-5xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
//           Connect & Collaborate
//         </h1>
//         <p className="text-xl font-robert-regular text-white/90 leading-relaxed">
//           Welcome to NexusHub, where innovation meets collaboration. Our platform brings together businesses, creators, and teams in one unified space.
//         </p>
//         <ul className="space-y-4 text-lg font-general text-white/80">
//           <li className="flex items-center space-x-2">
//             <span className="text-purple-400">✦</span>
//             <span>Real-time messaging and collaboration</span>
//           </li>
//           <li className="flex items-center space-x-2">
//             <span className="text-purple-400">✦</span>
//             <span>Smart project and task management</span>
//           </li>
//           <li className="flex items-center space-x-2">
//             <span className="text-purple-400">✦</span>
//             <span>Seamless file sharing and organization</span>
//           </li>
//         </ul>
//       </div>
//     </div>
//   );
// };

// export default Signup;

