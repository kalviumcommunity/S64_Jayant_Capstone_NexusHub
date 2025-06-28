import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FeedProvider } from '../context/FeedContext.jsx';
import CreatePostComponent from '../components/feed/CreatePost';
import Dock from '../components/dock/Dock';
import { 
  FiHome, 
  FiBell, 
  FiSearch, 
  FiEdit, 
  FiUserPlus, 
  FiMessageSquare, 
  FiSettings, 
  FiUser,
  FiCompass,
  FiBookmark,
  FiArrowLeft
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pageTransition } from '../utils/pageTransitions';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsPanel from '../components/panels/NotificationsPanel';
import MessagesPanel from '../components/panels/MessagesPanel';

const CreatePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State for active panel
  const [activePanel, setActivePanel] = useState(null);
  
  // Toggle panel visibility
  const togglePanel = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };
  
  // Handle navigation
  const handleNavigation = (path) => {
    pageTransition.navigate(navigate, path);
  };
  
  // Dock items configuration for the left dock
  const dockItems = [
    { 
      icon: <FiHome size={22} />, 
      label: 'Home', 
      onClick: () => handleNavigation('/feed'),
      notificationCount: 0
    },
    { 
      icon: <FiCompass size={22} />, 
      label: 'Explore', 
      onClick: () => togglePanel('explore'),
      notificationCount: 0
    },
    { 
      icon: <FiEdit size={22} />, 
      label: 'Create Post', 
      onClick: () => {},
      className: 'active-dock-item',
      notificationCount: 0
    },
    { 
      icon: <FiBell size={22} />, 
      label: 'Notifications', 
      onClick: () => togglePanel('notifications'),
      notificationCount: 3 // This would be dynamic in a real app
    },
    { 
      icon: <FiMessageSquare size={22} />, 
      label: 'Messages', 
      onClick: () => togglePanel('messages'),
      notificationCount: 2 // This would be dynamic in a real app
    },
    { 
      icon: <FiBookmark size={22} />, 
      label: 'Saved', 
      onClick: () => togglePanel('saved'),
      notificationCount: 0
    },
    { 
      icon: <FiUser size={22} />, 
      label: 'Profile', 
      onClick: () => handleNavigation('/profile'),
      notificationCount: 0
    },
    { 
      icon: <FiSettings size={22} />, 
      label: 'Settings', 
      onClick: () => togglePanel('settings'),
      notificationCount: 0
    }
  ];

  return (
    <FeedProvider>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
        {/* Background Video */}
        <video className="absolute inset-0 w-full h-full object-cover opacity-30" autoPlay muted loop>
          <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

        {/* Left Dock */}
        <div className="fixed left-0 top-0 h-full z-20 flex items-center">
          <Dock 
            items={dockItems}
            panelHeight={400}
            baseItemSize={50}
            magnification={70}
            className="vertical-dock"
            vertical={true}
            spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
            distance={200}
          />
        </div>

        {/* Content */}
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-12 gap-6">
            {/* Left Spacer (20% width) */}
            <div className="col-span-2 hidden lg:block">
              {/* This is just a spacer for the dock */}
            </div>
            
            {/* Main Content (60% width) */}
            <div className="col-span-12 md:col-span-8 lg:col-span-7">
              {/* Header */}
              <motion.div 
                className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleNavigation('/feed')}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <FiArrowLeft size={20} className="text-white" />
                  </button>
                  <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Create Post
                  </h1>
                </div>
              </motion.div>

              {/* Create Post Form */}
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-[#111111]/80 backdrop-blur-sm border border-[#222] rounded-xl p-4 shadow-xl"
              >
                <CreatePostComponent />
              </motion.div>
            </div>
            
            {/* Right Sidebar (20% width) */}
            <div className="hidden md:block md:col-span-4 lg:col-span-3">
              <div className="bg-[#111111]/80 backdrop-blur-sm border border-[#222] rounded-xl p-4 shadow-xl mb-6">
                <h3 className="text-xl font-zentry font-bold text-white mb-4">Posting Tips</h3>
                <ul className="space-y-3 text-white/70">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Add images or videos to increase engagement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Use tags to help others discover your post</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Choose the right visibility for your audience</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>Keep your post concise and engaging</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Panels that appear when dock items are clicked */}
        <AnimatePresence>
          {activePanel === 'notifications' && (
            <NotificationsPanel onClose={() => setActivePanel(null)} />
          )}
          
          {activePanel === 'messages' && (
            <MessagesPanel onClose={() => setActivePanel(null)} />
          )}
        </AnimatePresence>

        {/* Transition Loader */}
        <div className="loader"></div>
      </div>
    </FeedProvider>
  );
};

export default CreatePostPage;