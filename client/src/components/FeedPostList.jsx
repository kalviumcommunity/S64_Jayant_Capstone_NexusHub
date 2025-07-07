import React from 'react';
import { FiHeart, FiMessageCircle, FiSend, FiBookmark } from 'react-icons/fi';
import MediaCarousel from './MediaCarousel';

const posts = [
  {
    id: 1,
    user: { username: 'alex_dev', avatar: '' },
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80' },
      { type: 'video', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    ],
    caption: 'Check out my new project! #react #nexushub',
    likes: 1200,
    comments: [
      { id: 1, user: 'sarah_tech', text: 'Awesome work!' },
      { id: 2, user: 'mike_coder', text: 'Congrats bro!' },
      { id: 3, user: 'jessica_ui', text: '🔥🔥' },
    ],
    saved: 5,
    shares: 10,
  },
  {
    id: 2,
    user: { username: 'sarah_tech', avatar: '' },
    media: [
      { type: 'image', url: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80' },
    ],
    caption: 'UI/UX design is all about details. #designlife',
    likes: 980,
    comments: [
      { id: 1, user: 'alex_dev', text: 'Clean design!' },
      { id: 2, user: 'david_js', text: 'Love this palette.' },
    ],
    saved: 3,
    shares: 7,
  },
];

const FeedPostList = () => (
  <div className="flex flex-col gap-8">
    {posts.map((post) => (
      <div key={post.id} className="bg-[#181818] rounded-xl p-0 shadow-xl min-w-0 overflow-hidden">
        {/* Top: Profile */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-2">
          <div className="w-10 h-10 rounded-full bg-gray-700" />
          <div>
            <div className="text-white font-medium">{post.user.username}</div>
          </div>
        </div>
        {/* Media Carousel */}
        <MediaCarousel media={post.media} />
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
          <div className="text-white font-medium text-sm mb-1">{post.likes.toLocaleString()} likes</div>
          <div className="text-white mb-1">
            <span className="font-medium mr-2">{post.user.username}</span>
            {post.caption.length > 60 ? (
              <>
                {post.caption.slice(0, 60)}<span className="text-blue-400 cursor-pointer">...read more</span>
              </>
            ) : post.caption}
          </div>
          {/* Comments preview */}
          {post.comments.length > 2 && (
            <div className="text-white/60 text-xs mb-1 cursor-pointer flex items-center gap-1">
              <span>View all {post.comments.length} comments</span>
              <span className="inline-block rotate-90">▼</span>
            </div>
          )}
          {post.comments.slice(0, 2).map((c) => (
            <div key={c.id} className="text-white/80 text-sm mb-1">
              <span className="font-medium mr-2">{c.user}</span>{c.text}
            </div>
          ))}
        </div>
        {/* Add comment */}
        <div className="px-6 pb-4">
          <input className="w-full bg-[#222] rounded-lg px-3 py-2 text-white text-sm" placeholder="Add a comment..." />
        </div>
      </div>
    ))}
  </div>
);

export default FeedPostList; 