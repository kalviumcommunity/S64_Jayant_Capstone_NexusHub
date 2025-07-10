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

const gradientRing = 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]';

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

  // Check if current user has an active story
  const myStory = stories.find(
    s => (s.user?._id || s.user?.id || s.user) === user?._id || s.username === user?.username
  );
  const myProfilePic = user?.profilePicture;
  const myDisplayName = truncateName(user?.name || user?.username);

  return (
    <div className="relative w-full bg-[#181818] rounded-xl p-4 flex items-center gap-4 mb-6">
      {/* Scrollable stories */}
      <div ref={scrollRef} className="flex items-center gap-4 overflow-x-auto scrollbar-hide w-full">
        {/* Your Story (with gradient if active) */}
        <div
          className="flex flex-col items-center min-w-[60px] cursor-pointer"
          onClick={() => {
            if (myStory) {
              navigate(`/story/${myStory._id || myStory.id}`);
            } else {
              navigate('/create?type=story');
            }
          }}
        >
          <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${myStory ? gradientRing : 'bg-[#222]'} p-[2.5px] transition-all duration-200`} style={{background: myStory ? 'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)' : undefined}}>
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {myProfilePic ? (
                <img src={myProfilePic} alt="profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-2xl text-white font-bold">{user?.name?.[0] || 'U'}</span>
              )}
              {!myStory && (
                <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#181818]">+</span>
              )}
            </div>
          </div>
          <span className="text-xs text-white/70 mt-1 w-16 text-center truncate">
            {myStory ? myDisplayName : 'Your Story'}
          </span>
        </div>
        {/* Other Stories */}
        {stories && stories.length > 0 ? stories.filter(story => !((story.user?._id || story.user?.id || story.user) === user?._id || story.username === user?.username)).map(story => {
          const displayName = truncateName(story.username || story.user?.username || story.user?.name);
          const profilePic = story.user?.profilePicture;
          return (
            <div key={story._id || story.id} className="flex flex-col items-center min-w-[60px] cursor-pointer" onClick={() => navigate(`/story/${story._id || story.id}`)}>
              <div className={`relative w-16 h-16 rounded-full flex items-center justify-center ${gradientRing} p-[2.5px]`} style={{background: 'linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%)'}}>
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt={displayName} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="text-2xl text-white font-bold">{displayName[0]}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-white/70 mt-1 w-16 text-center truncate">{displayName}</span>
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
      <style>{`
        .story-gradient {
          background: linear-gradient(135deg, #f9ce34 0%, #ee2a7b 50%, #6228d7 100%);
        }
      `}</style>
    </div>
  );
};

export default StoriesBar; 