import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FeedProvider } from '../context/FeedContext.jsx';
import CreatePostComponent from '../components/feed/CreatePost';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { pageTransition } from '../utils/pageTransitions';
import { motion } from 'framer-motion';

const CreatePostPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const handleNavigation = (path) => {
    pageTransition.navigate(navigate, path);
  };

  return (
    <FeedProvider>
      <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
        {/* Background Video */}
        <video className="absolute inset-0 w-full h-full object-cover opacity-30" autoPlay muted loop>
          <source src="https://res.cloudinary.com/dyzfbhol5/video/upload/v1781063941/NexusCrystal_imby9z.mp4" type="video/mp4" />
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
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-12 lg:col-span-8">
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
      </div>
    </FeedProvider>
  );
};

export default CreatePostPage;