import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import About from './components/About'  
import Features from './components/Features'
import Story from './components/Story'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import Profile from './pages/Profile'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import TeamPage from './pages/TeamPage'
import OAuthSuccess from './pages/OAuthSuccess'
import ProtectedRoute from './components/auth/ProtectedRoute'

import { AuthProvider } from './context/AuthContext.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import { initializePageTransition, pageTransition } from './utils/pageTransitions'
import './styles/pageTransitions.css'

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/signup', '/profile', '/oauth-success'].includes(location.pathname);
  
  // Initialize page transition system once
  useEffect(() => {
    // Only initialize transitions if not on auth pages
    if (!isAuthPage) {
      initializePageTransition();
    }
    
    // No transition animation for initial load
    
    return () => {
      // No cleanup needed
    };
  }, [isAuthPage]);
  
  // Handle route changes
  useEffect(() => {
    // This effect runs on location changes after the initial render
    // If navigating to or from auth pages, ensure transitions are disabled
    const container = document.querySelector('.transition-container');
    if (container && isAuthPage) {
      container.style.display = 'none';
    }
  }, [location.pathname, isAuthPage]);

  // Custom Link component with transition
  const TransitionLink = ({ to, children, className }) => {
    const handleClick = (e) => {
      e.preventDefault();
      
      // Skip transitions for login and signup pages
      if (to === '/login' || to === '/signup' || ['/login', '/signup'].includes(location.pathname)) {
        navigate(to);
      } else {
        pageTransition.navigate(navigate, to);
      }
    };
    
    return (
      <a href={to} onClick={handleClick} className={className}>
        {children}
      </a>
    );
  };

  // Make TransitionLink available globally
  window.TransitionLink = TransitionLink;

  return (
    <div className='relative min-h-screen w-screen overflow-x-hidden'>
      {!isAuthPage && <Navbar />}
      <main className='w-full'>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />
          <Route path="/" element={
            <>
              <Navbar />
              <Hero />
              <About />
              <Features />
              <Story />
              <Contact />
            </>
          } />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/teams/:teamId" element={<TeamPage />} />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

const App = () => {
  // We'll let AppContent handle the transition initialization
  // This ensures we can check the current route before initializing
  useEffect(() => {
    console.log("App component mounted");
    // No longer initializing page transition here
    // It will be handled in AppContent based on the current route
  }, []);

  return (
    <Router>
      <AuthProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </AuthProvider>
    </Router>
  );
};

export default App
