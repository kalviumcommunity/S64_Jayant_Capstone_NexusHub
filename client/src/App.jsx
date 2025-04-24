import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import Hero from './components/Hero'
import Navbar from './components/Navbar'
import About from './components/About'  
import Features from './components/Features'
import Story from './components/Story'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  return (
    <div className='relative min-h-screen w-screen overflow-x-hidden'>
      <Navbar />
      <main className='w-full'>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={
            <>
              <Hero />
              <About />
              <Features />
              <Story />
              <Contact />
            </>
          } />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App
