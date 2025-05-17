import React from 'react';
import { useFeed } from '../../context/FeedContext';
import { FiGlobe, FiUsers, FiFolder, FiLayers } from 'react-icons/fi';

const FeedFilter = () => {
  const { filter, changeFilter } = useFeed();

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
      <h3 className="text-white font-medium mb-3">Filter Posts</h3>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => changeFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FiGlobe size={18} />
          <span>All</span>
        </button>
        
        <button
          onClick={() => changeFilter('connections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filter === 'connections'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FiUsers size={18} />
          <span>Connections</span>
        </button>
        
        <button
          onClick={() => changeFilter('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filter === 'projects'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FiFolder size={18} />
          <span>Projects</span>
        </button>
        
        <button
          onClick={() => changeFilter('teams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            filter === 'teams'
              ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
              : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          <FiLayers size={18} />
          <span>Teams</span>
        </button>
      </div>
    </div>
  );
};

export default FeedFilter;