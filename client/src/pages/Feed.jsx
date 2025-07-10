import React from 'react';
import '../styles/transitions.css';
import '../styles/animations.css';
import Dock from '../components/Dock';
import { FiHome, FiSearch, FiEdit, FiBell, FiBookmark, FiUser } from 'react-icons/fi';
import StoriesBar from '../components/StoriesBar';
import FeedPostList from '../components/FeedPostList';
import RightSidebar from '../components/RightSidebar';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const navigate = useNavigate();
  const dockItems = [
    { icon: <FiHome size={22} />, label: 'Home', onClick: () => navigate('/feed') },
    { icon: <FiSearch size={22} />, label: 'Search', onClick: () => navigate('/explore') },
    { icon: <FiEdit size={22} />, label: 'Create Post', onClick: () => navigate('/create') },
    { icon: <FiBell size={22} />, label: 'Notifications', onClick: () => navigate('/notifications') },
    { icon: <FiBookmark size={22} />, label: 'Saved', onClick: () => navigate('/saved') },
    { icon: <FiUser size={22} />, label: 'Profile', onClick: () => navigate('/profile') },
  ];

  return (
    <div className="relative min-h-screen w-full flex pt-20" style={{overflowX:'hidden'}}>
      {/* Fixed Background Video */}
      <video
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="/videos/NexusCrystal.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', filter: 'brightness(0.7) blur(1px)' }}
      />
      {/* Overlay for gradient effect */}
      <div className="fixed top-0 left-0 w-full h-full z-10 bg-gradient-to-br from-[#181c2f]/80 via-[#1a1836]/80 to-[#1e1b2b]/90 pointer-events-none" />
      {/* Layout */}
      <div className="flex w-full max-w-[1600px] mx-auto px-2 lg:px-8 gap-6 relative z-20">
        {/* Left Dock Sidebar */}
        <div className="hidden md:flex flex-shrink-0">
          <div className="fixed top-1/2 -translate-y-1/2 z-30" style={{ left: '2rem' }}>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl shadow-lg p-0 flex items-center justify-center">
              <Dock
                items={dockItems}
                vertical={true}
                panelHeight={60}
                baseItemSize={50}
                magnification={75}
                className="vertical-dock"
              />
            </div>
          </div>
        </div>
        {/* Center Feed */}
        <div className="flex-1 flex flex-col items-center">
          <div className="max-w-2xl w-full mx-auto lg:ml-[104px] lg:mr-[352px] px-2">
            <StoriesBar />
            <FeedPostList />
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <div className="fixed right-8 top-20 w-[320px] space-y-4 z-20">
            <RightSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feed;

