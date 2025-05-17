import React, { useEffect, useRef, useCallback } from 'react';
import { useFeed } from '../../context/FeedContext';
import PostCard from './PostCard';
import { FiAlertCircle } from 'react-icons/fi';

const PostList = () => {
  const { posts, loading, error, hasMore, fetchPosts } = useFeed();
  const observer = useRef();

  // Setup intersection observer for infinite scrolling
  const lastPostElementRef = useCallback(node => {
    if (loading) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchPosts();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, fetchPosts]);

  // Render loading state
  const renderLoading = () => (
    <div className="flex-center py-8">
      <div className="three-body">
        <div className="three-body__dot"></div>
        <div className="three-body__dot"></div>
        <div className="three-body__dot"></div>
      </div>
    </div>
  );

  // Render error state
  const renderError = () => (
    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center">
      <FiAlertCircle className="text-red-400 mr-3" size={24} />
      <div>
        <h3 className="text-white font-medium">Error Loading Posts</h3>
        <p className="text-white/70">{error || 'Something went wrong. Please try again.'}</p>
      </div>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6 text-center">
      <div className="w-16 h-16 bg-white/5 rounded-full flex-center mx-auto mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-white text-xl font-medium mb-2">No Posts Yet</h3>
      <p className="text-white/70 max-w-md mx-auto">
        Be the first to share something with your network. Create a post to get started!
      </p>
    </div>
  );

  return (
    <div>
      {error && renderError()}
      
      {posts.length > 0 ? (
        <div>
          {posts.map((post, index) => {
            if (posts.length === index + 1) {
              return <div ref={lastPostElementRef} key={post._id}><PostCard post={post} /></div>;
            } else {
              return <PostCard key={post._id} post={post} />;
            }
          })}
        </div>
      ) : !loading && !error ? (
        renderEmpty()
      ) : null}
      
      {loading && renderLoading()}
    </div>
  );
};

export default PostList;