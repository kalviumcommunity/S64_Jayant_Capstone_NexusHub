import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FeedProvider } from '../context/FeedContext.jsx';
import CreatePost from '../components/feed/CreatePost';
import FeedFilter from '../components/feed/FeedFilter';
import PostList from '../components/feed/PostList';
import '../styles/transitions.css';
import { 
  FiHome, 
  FiBell, 
  FiSearch, 
  FiEdit, 
  FiUserPlus, 
  FiMessageSquare, 
  FiSettings, 
  FiUser 
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pageTransition } from '../utils/pageTransitions';
import { motion } from 'framer-motion';

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
  
  // Dock items configuration
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
      icon: <FiBell size={22} />, 
      label: 'Notifications', 
      onClick: () => togglePanel('notifications'),
      notificationCount: 3 // This would be dynamic in a real app
    },
    { 
      icon: <FiSearch size={22} />, 
      label: 'Search', 
      onClick: () => togglePanel('search'),
      notificationCount: 0
    },
    { 
      icon: <FiEdit size={22} />, 
      label: 'Create Post', 
      onClick: () => {
        // Scroll to create post section and focus
        const createPostElement = document.getElementById('create-post-section');
        if (createPostElement) {
          createPostElement.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            const textarea = createPostElement.querySelector('textarea');
            if (textarea) textarea.focus();
          }, 500);
        }
        setActivePanel(null);
      },
      notificationCount: 0
    },
    { 
      icon: <FiUserPlus size={22} />, 
      label: 'Connections', 
      onClick: () => togglePanel('connections'),
      notificationCount: 2 // This would be dynamic in a real app
    },
    { 
      icon: <FiMessageSquare size={22} />, 
      label: 'Messages', 
      onClick: () => togglePanel('messages'),
      notificationCount: 1 // This would be dynamic in a real app
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

        {/* Content */}
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="max-w-3xl mx-auto">
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
                <p className="text-white/60 font-robert-regular mt-1">
                  Stay updated with your connections, teams, and projects
                </p>
              </div>
            </motion.div>

            {/* Feed Content */}
            <div className="space-y-6">
              {/* Create Post */}
              <motion.div 
                id="create-post-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <CreatePost />
              </motion.div>
              
              {/* Feed Filter */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
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
        </motion.div>

        {/* Transition Loader */}
        <div className="loader"></div>
      </div>
    </FeedProvider>
  );
};

export default Feed;