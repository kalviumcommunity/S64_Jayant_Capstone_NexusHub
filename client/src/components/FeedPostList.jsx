import React from 'react';
import PostCard from './feed/PostCard';
import { useFeed } from '../context/FeedContext';

const FeedPostList = () => {
  const { posts, loading, error } = useFeed();

  if (loading) return <div className="text-white text-center py-8">Loading posts...</div>;
  if (error) return <div className="text-red-400 text-center py-8">{error}</div>;

  return (
    <div className="flex flex-col gap-8">
      {posts.map((post) => (
        <PostCard key={post._id || post.id} post={post} />
      ))}
      {posts.length === 0 && <div className="text-white/60 text-center py-8">No posts yet.</div>}
    </div>
  );
};

export default FeedPostList; 