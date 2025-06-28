import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FeedProvider } from '../context/FeedContext.jsx';
import FeedFilter from '../components/feed/FeedFilter';
import PostList from '../components/feed/PostList';
import RightSidebar from '../components/feed/RightSidebar';
import Dock from '../components/dock/Dock';
import NotificationsPanel from '../components/panels/NotificationsPanel';
import MessagesPanel from '../components/panels/MessagesPanel';
import '../styles/transitions.css';
import '../styles/animations.css';
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
  FiBookmark
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pageTransition } from '../utils/pageTransitions';
import { motion, AnimatePresence } from 'framer-motion';

const Feed = () => {
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
      onClick: () => {
        setActivePanel(null);
      },
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
      onClick: () => handleNavigation('/create-post'),
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

        {/* Responsive Dock */}
        <div className="z-20">
          <Dock 
            items={dockItems}
            panelHeight={400}
            baseItemSize={50}
            magnification={70}
            className="vertical-dock"
            vertical={true}
            spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
            distance={200}
            mobileMode="drawer" // Can be "drawer" or "bottom"
          />
        </div>

        {/* Content */}
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-16 lg:pl-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="grid grid-cols-12 gap-6">
            {/* Main Feed Content - Full width on mobile, adjusted on desktop */}
            <div className="col-span-12 lg:col-span-8">
              {/* Feed Header */}
              <motion.div 
                className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div>
                  <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    Your Feed
                  </h1>
                </div>
              </motion.div>

              {/* Feed Content */}
              <div className="space-y-6">
                {/* Feed Filter */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-[#111111]/80 backdrop-blur-sm border border-[#222] rounded-xl p-4 shadow-xl"
                >
                  <FeedFilter />
                </motion.div>
                
                {/* Posts List */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <PostList />
                </motion.div>
              </div>
            </div>
            
            {/* Right Sidebar */}
            <div className="hidden lg:block lg:col-span-4">
              <RightSidebar />
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

export default Feed;