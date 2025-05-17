import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { FeedProvider } from '../context/FeedContext.jsx';
import CreatePost from '../components/feed/CreatePost';
import FeedFilter from '../components/feed/FeedFilter';
import PostList from '../components/feed/PostList';
import '../styles/transitions.css';

const Feed = () => {
  const { user } = useAuth();

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
        <div className="relative z-10 container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto">
            {/* Feed Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Welcome to Your Feed, {user?.name || 'User'}
                </h1>
                <p className="text-white/60 font-robert-regular mt-1">
                  Stay updated with your connections, teams, and projects
                </p>
              </div>
            </div>

            {/* Feed Content */}
            <div className="space-y-6">
              {/* Create Post */}
              <CreatePost />
              
              {/* Feed Filter */}
              <FeedFilter />
              
              {/* Posts List */}
              <PostList />
            </div>
          </div>
        </div>

        {/* Transition Loader */}
        <div className="loader"></div>
      </div>
    </FeedProvider>
  );
};

export default Feed;