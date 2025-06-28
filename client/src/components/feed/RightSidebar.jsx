import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus } from 'react-icons/fi';

const RightSidebar = () => {
  // Mock data for stories
  const stories = [
    { id: 1, username: 'alex_dev', avatar: '/avatars/user1.jpg', hasNewStory: true },
    { id: 2, username: 'sarah_tech', avatar: '/avatars/user2.jpg', hasNewStory: true },
    { id: 3, username: 'mike_coder', avatar: '/avatars/user3.jpg', hasNewStory: false },
    { id: 4, username: 'jessica_ui', avatar: '/avatars/user4.jpg', hasNewStory: true },
    { id: 5, username: 'david_js', avatar: '/avatars/user5.jpg', hasNewStory: false },
  ];

  // Mock data for suggestions
  const suggestions = [
    { id: 1, username: 'tech_innovator', avatar: '/avatars/user6.jpg', role: 'Full Stack Developer' },
    { id: 2, username: 'design_guru', avatar: '/avatars/user7.jpg', role: 'UI/UX Designer' },
    { id: 3, username: 'data_scientist', avatar: '/avatars/user8.jpg', role: 'Data Scientist' },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Stories Section */}
      <motion.div 
        className="bg-[#111111] rounded-xl p-4 border border-[#222]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
          <span>Stories</span>
          <button className="text-blue-400 text-sm">View All</button>
        </h3>
        
        <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Your Story */}
          <div className="flex flex-col items-center space-y-1 min-w-[60px]">
            <div className="relative w-14 h-14 rounded-full bg-[#222] flex items-center justify-center">
              <FiPlus className="text-blue-400" size={20} />
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <FiPlus className="text-white" size={12} />
              </div>
            </div>
            <span className="text-white text-xs">Your Story</span>
          </div>
          
          {/* User Stories */}
          {stories.map(story => (
            <div key={story.id} className="flex flex-col items-center space-y-1 min-w-[60px]">
              <div className={`relative w-14 h-14 rounded-full ${story.hasNewStory ? 'ring-2 ring-blue-500 p-[2px]' : ''}`}>
                <img 
                  src={story.avatar} 
                  alt={story.username}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
              </div>
              <span className="text-white text-xs truncate w-14">{story.username}</span>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Suggestions Section */}
      <motion.div 
        className="bg-[#111111] rounded-xl p-4 border border-[#222]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
          <span>Suggested for you</span>
          <button className="text-blue-400 text-sm">See All</button>
        </h3>
        
        <div className="space-y-4">
          {suggestions.map(suggestion => (
            <div key={suggestion.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={suggestion.avatar} 
                  alt={suggestion.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
                <div>
                  <p className="text-white text-sm font-medium">{suggestion.username}</p>
                  <p className="text-gray-400 text-xs">{suggestion.role}</p>
                </div>
              </div>
              <button className="text-blue-400 text-sm font-medium hover:text-blue-300 transition">
                Follow
              </button>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Trending Topics */}
      <motion.div 
        className="bg-[#111111] rounded-xl p-4 border border-[#222]"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h3 className="text-white font-semibold mb-4">Trending Topics</h3>
        
        <div className="space-y-3">
          {['#ReactJS', '#MachineLearning', '#WebDevelopment', '#AITrends', '#CloudComputing'].map((topic, index) => (
            <div key={index} className="bg-[#1a1a1a] rounded-lg p-2 hover:bg-[#222] transition cursor-pointer">
              <p className="text-blue-400 font-medium">{topic}</p>
              <p className="text-gray-400 text-xs">{Math.floor(Math.random() * 1000) + 100} posts</p>
            </div>
          ))}
        </div>
      </motion.div>
      
      {/* Footer */}
      <div className="text-gray-500 text-xs space-y-2">
        <div className="flex flex-wrap gap-2">
          <a href="#" className="hover:underline">About</a>
          <a href="#" className="hover:underline">Help</a>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Developers</a>
        </div>
        <p>© 2023 NexusHub</p>
      </div>
    </div>
  );
};

export default RightSidebar;