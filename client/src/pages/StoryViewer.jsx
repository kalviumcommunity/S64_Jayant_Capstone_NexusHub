import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FiEye, FiHeart, FiSend, FiPause, FiPlay, FiX, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';

const STORY_IMAGE_DURATION = 10; // seconds
const STORY_VIDEO_MAX = 30; // seconds

function groupStoriesByUser(stories) {
  const map = new Map();
  stories.forEach(story => {
    const userId = story.user._id || story.user.id || story.user;
    if (!map.has(userId)) {
      map.set(userId, { user: story.user, stories: [] });
    }
    map.get(userId).stories.push(story);
  });
  return Array.from(map.values());
}

const StoryViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allStories, setAllStories] = useState([]); // grouped by user
  const [userIdx, setUserIdx] = useState(0);
  const [storyIdx, setStoryIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressArr, setProgressArr] = useState([]); // array of progress for each story
  const [isPlaying, setIsPlaying] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comment, setComment] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const videoRef = useRef();
  const timerRef = useRef();

  // Fetch all stories and set initial indices
  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const res = await api.get('/stories');
        const grouped = groupStoriesByUser(res.data.stories || res.data);
        setAllStories(grouped);
        // Find the userIdx and storyIdx for the current story id
        let found = false;
        for (let u = 0; u < grouped.length; u++) {
          const sIdx = grouped[u].stories.findIndex(s => s._id === id);
          if (sIdx !== -1) {
            setUserIdx(u);
            setStoryIdx(sIdx);
            found = true;
            break;
          }
        }
        if (!found) setError('Story not found or expired.');
        setError(null);
      } catch (err) {
        setError('Story not found or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
    // eslint-disable-next-line
  }, [id]);

  // Set up progress array for current user's stories
  useEffect(() => {
    if (!allStories.length) return;
    const stories = allStories[userIdx]?.stories || [];
    setProgressArr(stories.map(() => 0));
  }, [allStories, userIdx]);

  // Progress bar logic for current story
  useEffect(() => {
    if (!allStories.length) return;
    const stories = allStories[userIdx]?.stories || [];
    if (!stories[storyIdx]) return;
    let duration = STORY_IMAGE_DURATION;
    if (stories[storyIdx].media[0].type === 'video') {
      duration = Math.min(stories[storyIdx].media[0].duration || STORY_VIDEO_MAX, STORY_VIDEO_MAX);
    }
    if (!isPlaying) return;
    setProgressArr(prev => prev.map((p, i) => (i < storyIdx ? 100 : i === storyIdx ? 0 : 0)));
    timerRef.current && clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgressArr(prev => {
        const newArr = [...prev];
        if (newArr[storyIdx] >= 100) {
          clearInterval(timerRef.current);
          handleNextStory();
          return newArr;
        }
        newArr[storyIdx] = Math.min(newArr[storyIdx] + 100 / (duration * 10), 100);
        return newArr;
      });
    }, 100);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line
  }, [allStories, userIdx, storyIdx, isPlaying]);

  // Play/pause for video
  useEffect(() => {
    const stories = allStories[userIdx]?.stories || [];
    if (stories[storyIdx] && stories[storyIdx].media[0].type === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.play();
      else videoRef.current.pause();
    }
  }, [isPlaying, allStories, userIdx, storyIdx]);

  // Like/unlike
  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const currStory = allStories[userIdx].stories[storyIdx];
      const res = await api.post(`/stories/${currStory._id}/like`);
      setIsLiked(!isLiked);
      setLikesCount(res.data.likes);
    } catch {}
    setLikeLoading(false);
  };

  // Comment submit (dummy, as backend not shown)
  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommentLoading(true);
    setTimeout(() => {
      setComment('');
      setCommentLoading(false);
    }, 500);
  };

  // Viewers/likers drawer (owner only)
  const fetchViewers = async () => {
    setViewersLoading(true);
    try {
      const currStory = allStories[userIdx].stories[storyIdx];
      const res = await api.get(`/stories/${currStory._id}/viewers`);
      setViewersList(res.data.viewers);
    } catch {}
    setViewersLoading(false);
  };

  const openViewers = () => {
    setShowViewers(true);
    fetchViewers();
  };

  const closeViewers = () => setShowViewers(false);

  // Helper: is owner
  const currStory = allStories[userIdx]?.stories?.[storyIdx];
  const currStoryUserId = String(currStory?.user?._id || currStory?.user?.id || currStory?.user);
  const myUserId = String(user?._id || user?.id || user);
  const isOwner = currStory && currStoryUserId === myUserId;

  // Helper: time ago
  function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // in seconds
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }
  console.log('currStoryUserId:', currStoryUserId, 'myUserId:', myUserId, 'isOwner:', isOwner, 'currStory:', currStory, 'user:', user);

  // Navigation logic
  const handleNextStory = () => {
    const stories = allStories[userIdx]?.stories || [];
    if (storyIdx < stories.length - 1) {
      setStoryIdx(storyIdx + 1);
    } else if (userIdx < allStories.length - 1) {
      setUserIdx(userIdx + 1);
      setStoryIdx(0);
    } else {
      navigate('/feed');
    }
  };

  const handlePrevStory = () => {
    if (storyIdx > 0) {
      setStoryIdx(storyIdx - 1);
    } else if (userIdx > 0) {
      const prevUserStories = allStories[userIdx - 1].stories;
      setUserIdx(userIdx - 1);
      setStoryIdx(prevUserStories.length - 1);
    }
  };

  // On storyIdx/userIdx change, reset like/comment state
  useEffect(() => {
    if (!currStory) return;
    setIsLiked(currStory.likes?.some(like => like.user === user?._id || like.user?._id === user?._id));
    setLikesCount(currStory.likes?.length || 0);
    setComment('');
    setShowEmoji(false);
    setIsPlaying(true);
  }, [currStory, user?._id]);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-white">Loading story...</div>;
  if (error || !currStory) return <div className="flex flex-col items-center justify-center min-h-screen text-red-400">{error || 'Story not found.'}<button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => navigate('/feed')}>Back to Feed</button></div>;

  // Main layout
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50 select-none">
      {/* Viewers Drawer (owner only) */}
      {isOwner && showViewers && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-80 max-w-[90vw] h-full bg-[#181828] border-r border-[#232347] shadow-2xl p-6 overflow-y-auto animate-slideInLeft">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-bold text-white">Viewers & Likes</span>
              <button onClick={closeViewers} className="text-white text-2xl"><FiX /></button>
            </div>
            {viewersLoading ? <div className="text-white">Loading...</div> : (
              <>
                {viewersList.length === 0 && <div className="text-white/60">No viewers yet.</div>}
                {viewersList.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 mb-4">
                    <img src={v.user.profilePicture || 'https://res.cloudinary.com/dyzfbhol5/image/upload/v1781064676/default-avatar_bbvlmt.avif'} alt={v.user.name} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50" />
                    <div className="flex-1">
                      <div className="text-white font-semibold text-base">{v.user.name}</div>
                      <div className="text-xs text-white/50">{v.user.email}</div>
                    </div>
                    {v.type === 'like' && <FiHeart className="text-pink-500 text-xl" />}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="flex-1" onClick={closeViewers} />
        </div>
      )}
      {/* Story Card */}
      <div className="relative flex flex-col items-center justify-between bg-[#181828] rounded-3xl shadow-2xl border border-[#232347] w-[440px] h-[780px] max-w-[98vw] max-h-[98vh] p-0 overflow-hidden transition-all duration-300">
        {/* Carousel Navigation Buttons */}
        {((allStories[userIdx]?.stories.length > 1 || allStories.length > 1) && storyIdx > 0) && (
          <button onClick={handlePrevStory} className="absolute left-2 top-1/2 -translate-y-1/2 bg-[#232347]/80 hover:bg-[#232347] text-white rounded-full p-2 z-20 shadow-lg"><FiChevronLeft size={28} /></button>
        )}
        {((allStories[userIdx]?.stories.length > 1 || allStories.length > 1) && (storyIdx < allStories[userIdx].stories.length - 1 || userIdx < allStories.length - 1)) && (
          <button onClick={handleNextStory} className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#232347]/80 hover:bg-[#232347] text-white rounded-full p-2 z-20 shadow-lg"><FiChevronRight size={28} /></button>
        )}
        {/* Top Bar */}
        <div className="w-full px-6 pt-6 pb-4 flex flex-col gap-3">
          {/* Progress Bars */}
          <div className="w-full flex gap-1">
            {allStories[userIdx]?.stories.map((s, i) => {
              let duration = STORY_IMAGE_DURATION;
              if (s.media[0].type === 'video') duration = Math.min(s.media[0].duration || STORY_VIDEO_MAX, STORY_VIDEO_MAX);
              return (
                <div key={s._id} className="flex-1 h-1.5 bg-[#232347] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all" style={{ width: `${progressArr[i] || 0}%`, transition: 'width 0.2s linear' }} />
                </div>
              );
            })}
          </div>
          {/* User Info Row & Close Button */}
          <div className="flex items-center justify-between mt-2">
            {/* Username and time ago in a column */}
            <div className="flex flex-col items-start gap-0">
            <div className="flex items-center gap-3">
              <img src={currStory.user.profilePicture || 'https://res.cloudinary.com/dyzfbhol5/image/upload/v1781064676/default-avatar_bbvlmt.avif'} alt={currStory.user.name} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50" />
              <span className="text-white font-semibold text-base">{currStory.user.name}</span>
            </div>
              <span className="text-xs text-white/50 ml-12 mt-0.5">{getTimeAgo(currStory.createdAt)}</span>
            </div>
            {/* Eye button (owner only), Play/Pause (if video), and Close */}
            <div className="flex items-center gap-2">
              {isOwner && (
                <button onClick={openViewers} className="text-2xl text-white/80 hover:text-blue-400 transition"><FiEye /></button>
              )}
              {currStory.media[0].type === 'video' && (
                <button onClick={() => setIsPlaying(p => !p)} className="text-white text-2xl ml-2">
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
              )}
              <button onClick={() => navigate('/feed')} className="text-white text-2xl ml-2 hover:text-red-400 transition"><FiX /></button>
            </div>
          </div>
        </div>
        {/* Media */}
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="w-full flex items-center justify-center aspect-[9/16] max-h-[540px]">
            {currStory.media[0].type === 'image' ? (
              <img src={currStory.media[0].url} alt="story" className="object-contain w-full h-full rounded-xl" />
            ) : (
              <video
                ref={videoRef}
                src={currStory.media[0].url}
                className="object-contain w-full h-full rounded-xl"
                autoPlay
                muted
                playsInline
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onLoadedMetadata={e => {
                  if (e.target.duration > STORY_VIDEO_MAX) e.target.currentTime = 0;
                }}
                onEnded={handleNextStory}
              />
            )}
          </div>
        </div>
        {/* Bottom Bar */}
        <div className="w-full px-6 pb-6 pt-4 flex flex-col gap-2">
          {/* Caption */}
          {currStory.caption && <div className="text-center text-white text-base mb-2">{currStory.caption}</div>}
          {/* Like and Comment (non-owner only) */}
          {!isOwner && (
            <div className="flex items-center gap-3 mt-2">
              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-white transition bg-[#232347] hover:bg-pink-600/80 ${isLiked ? 'text-pink-400' : 'text-white/80'}`}
              >
                <FiHeart className="text-lg" />
                <span className="text-sm">{likesCount}</span>
              </button>
              {/* Comment Box */}
              <form onSubmit={handleComment} className="flex-1 flex items-center bg-[#232347] rounded-full px-3 py-1.5">
                <input
                  type="text"
                  className="flex-1 bg-transparent outline-none text-white placeholder-white/50 text-sm"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  disabled={commentLoading}
                  maxLength={200}
                />
                <button type="submit" disabled={commentLoading || !comment.trim()} className="ml-2 text-blue-400 hover:text-blue-600 text-lg">
                  <FiSend />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      {/* Animations */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideInLeft { animation: slideInLeft 0.3s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
};

export default StoryViewer; 