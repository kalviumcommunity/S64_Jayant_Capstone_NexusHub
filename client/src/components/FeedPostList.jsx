import React, { useEffect, useState } from 'react';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark } from 'react-icons/fi';
import MediaCarousel from './MediaCarousel';
import api from '../utils/api.js';

const FeedPostList = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/posts');
        setPosts(res.data.posts || res.data); // handle both {posts:[]} and []
        setError(null);
      } catch (err) {
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  if (loading) return <div className="text-white text-center py-8">Loading posts...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;

  return (
    <div className="flex flex-col gap-8">
      {posts.map((post) => (
        <div key={post._id || post.id} className="bg-[#181818] rounded-xl p-0 shadow-xl min-w-0 overflow-hidden">
          {/* Top: Profile */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-2">
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div>
              <div className="text-white font-medium">{post.user?.username || post.user?.name || post.user?.email || 'User'}</div>
            </div>
          </div>
          {/* Media Carousel */}
          {post.media && <MediaCarousel media={post.media} />}
          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-6">
              <button className="hover:text-pink-500 transition text-white"><FiHeart size={22} /></button>
              <button className="hover:text-blue-400 transition text-white"><FiMessageCircle size={22} /></button>
              <button className="hover:text-blue-400 transition text-white"><FiSend size={22} /></button>
            </div>
            <button className="hover:text-yellow-400 transition text-white"><FiBookmark size={22} /></button>
          </div>
          {/* Likes, Caption, Comments */}
          <div className="px-6 pb-2">
            <div className="text-white font-medium text-sm mb-1">{(post.likes || 0).toLocaleString()} likes</div>
            <div className="text-white mb-1">
              <span className="font-medium mr-2">{post.user?.username || post.user?.name || post.user?.email || 'User'}</span>
              {post.caption && post.caption.length > 60 ? (
                <>
                  {post.caption.slice(0, 60)}<span className="text-blue-400 cursor-pointer">...read more</span>
                </>
              ) : post.caption}
            </div>
            {/* Comments preview */}
            {post.comments && post.comments.length > 2 && (
              <div className="text-white/60 text-xs mb-1 cursor-pointer flex items-center gap-1">
                <span>View all {post.comments.length} comments</span>
                <span className="inline-block rotate-90">▼</span>
              </div>
            )}
            {post.comments && post.comments.slice(0, 2).map((c) => (
              <div key={c._id || c.id} className="text-white/80 text-sm mb-1">
                <span className="font-medium mr-2">{c.user?.username || c.user?.name || c.user?.email || (typeof c.user === 'string' ? c.user : 'User')}</span>{c.text}
              </div>
            ))}
          </div>
          {/* Add comment */}
          <div className="px-6 pb-4">
            <input className="w-full bg-[#222] rounded-lg px-3 py-2 text-white text-sm" placeholder="Add a comment..." />
          </div>
        </div>
      ))}
      {posts.length === 0 && <div className="text-white/60 text-center py-8">No posts yet.</div>}
    </div>
  );
};

export default FeedPostList; 