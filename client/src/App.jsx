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
import CreatePost from './pages/CreatePost'
import TeamPage from './pages/TeamPage'
import OAuthSuccess from './pages/OAuthSuccess'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Explore from './pages/Explore'
import ViewProfile from './pages/ViewProfile'

import { AuthProvider } from './context/AuthContext.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import './styles/pageTransitions.css'

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ['/login', '/signup', '/profile', '/oauth-success'].includes(location.pathname);
  
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
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/teams/:teamId" element={<TeamPage />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/profile/:username" element={<ViewProfile />} />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

const App = () => {
  useEffect(() => {
    console.log("App component mounted");
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
