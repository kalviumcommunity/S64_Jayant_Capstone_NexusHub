import React, { useEffect, useState, useRef } from 'react';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

const truncateName = (name) => {
  if (!name) return 'User';
  const first = name.split(' ')[0];
  return first.length > 8 ? first.slice(0, 8) + '...' : first;
};

const StoriesBar = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const res = await api.get('/stories');
        setStories(res.data.stories || res.data); // handle both {stories:[]} and []
        setError(null);
      } catch (err) {
        setError('Failed to load stories');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, []);

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="text-white text-center py-4">Loading stories...</div>;
  if (error) return <div className="text-red-400 text-center py-4">{error}</div>;

  return (
    <div className="relative w-full bg-[#181818] rounded-xl p-4 flex items-center gap-4 mb-6">
      {/* Scrollable stories */}
      <div ref={scrollRef} className="flex items-center gap-4 overflow-x-auto scrollbar-hide w-full">
        {/* Your Story */}
        <div className="flex flex-col items-center min-w-[60px] cursor-pointer" onClick={() => navigate('/create?type=story')}>
          <div className="relative w-14 h-14 rounded-full bg-[#222] flex items-center justify-center overflow-hidden">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="profile" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-2xl text-white font-bold">{user?.name?.[0] || 'U'}</span>
            )}
            <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#181818]">+</span>
          </div>
          <span className="text-xs text-white/70 mt-1">Your Story</span>
        </div>
        {/* Other Stories */}
        {stories && stories.length > 0 ? stories.map(story => {
          const displayName = truncateName(story.username || story.user?.username || story.user?.name);
          const profilePic = story.user?.profilePicture;
          return (
            <div key={story._id || story.id} className="flex flex-col items-center min-w-[60px] cursor-pointer" onClick={() => navigate(`/story/${story._id || story.id}`)}>
              <div className={`relative w-14 h-14 rounded-full ${story.hasNew ? 'ring-2 ring-blue-500 p-[2px]' : ''} overflow-hidden bg-gray-700 flex items-center justify-center"`}>
                {profilePic ? (
                  <img src={profilePic} alt={displayName} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-2xl text-white font-bold">{displayName[0]}</span>
                )}
              </div>
              <span className="text-xs text-white/70 mt-1 truncate w-14 text-center">{displayName}</span>
            </div>
          );
        }) : (
          <span className="text-white/60 ml-4">No stories yet.</span>
        )}
      </div>
      {/* Right arrow for scroll */}
      <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#222] hover:bg-[#333] rounded-full p-2 z-10" onClick={handleScrollRight}>
        <FiChevronRight size={22} className="text-white" />
      </button>
    </div>
  );
};

export default StoriesBar; 