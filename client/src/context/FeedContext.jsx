import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';
import { getSocket } from '../utils/socket.js';

// Create the feed context
const FeedContext = createContext();

// Custom hook to use the feed context
export const useFeed = () => useContext(FeedContext);

export const FeedProvider = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'connections', 'teams', 'projects'

  // Fetch posts with pagination
  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      
      // Reset state if needed
      if (reset) {
        setPage(1);
        setPosts([]);
      }
      
      const currentPage = reset ? 1 : page;
      const limit = 10; // Number of posts per page
      
      // Build query parameters based on filter
      let queryParams = `?page=${currentPage}&limit=${limit}`;
      
      if (filter === 'connections') {
        queryParams += '&visibility=connections';
      } else if (filter === 'teams') {
        queryParams += '&type=team';
      } else if (filter === 'projects') {
        queryParams += '&type=project';
      }
      
      const response = await api.get(`/posts${queryParams}`);
      
      // Handle different response structures
      let newPosts = [];
      if (response.data && Array.isArray(response.data.posts)) {
        newPosts = response.data.posts;
      } else if (response.data && Array.isArray(response.data.data)) {
        newPosts = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        newPosts = response.data.data;
      } else {
        console.warn('Unexpected post data structure:', response.data);
        newPosts = [];
      }
      
      // Update state
      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setHasMore(newPosts.length === limit);
      setPage(currentPage + 1);
      
      return newPosts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      setError('Failed to load posts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Change filter and reset posts
  const changeFilter = (newFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      fetchPosts(true); // Reset and fetch with new filter
    }
  };

  // Create a new post
  const createPost = async (postData) => {
    try {
      // Handle FormData for media uploads
      let response;
      
      if (postData instanceof FormData) {
        response = await api.post('/posts', postData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await api.post('/posts', postData);
      }
      
      // Handle different response structures
      let newPost = null;
      if (response.data && response.data.post) {
        newPost = response.data.post;
      } else if (response.data && response.data.data) {
        newPost = response.data.data;
      } else if (response.data && response.data.success) {
        newPost = response.data.data || response.data;
      } else {
        console.warn('Unexpected post creation response structure:', response.data);
        newPost = response.data;
      }
      
      // Add the new post to the state
      setPosts(prev => [newPost, ...prev]);
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.response?.data?.message || 'Failed to create post');
      throw error;
    }
  };

  // Like a post
  const likePost = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/like`);
      
      // Update the post in state
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? 
            { 
              ...post, 
              likes: response.data.likes || post.likes,
              isLiked: true
            } : post
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      setError(error.response?.data?.message || 'Failed to like post');
      throw error;
    }
  };

  // Unlike a post
  const unlikePost = async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/unlike`);
      
      // Update the post in state
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? 
            { 
              ...post, 
              likes: response.data.likes || post.likes,
              isLiked: false
            } : post
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error unliking post:', error);
      setError(error.response?.data?.message || 'Failed to unlike post');
      throw error;
    }
  };

  // Add a comment to a post
  const addComment = async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/comment`, { content });
      
      // Update the post in state
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? 
            { 
              ...post, 
              comments: response.data.comments || [...post.comments, response.data.comment]
            } : post
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      setError(error.response?.data?.message || 'Failed to add comment');
      throw error;
    }
  };

  // Delete a post
  const deletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      
      // Remove the post from state
      setPosts(prev => prev.filter(post => post._id !== postId));
      
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      setError(error.response?.data?.message || 'Failed to delete post');
      throw error;
    }
  };

  // Share a post
  const sharePost = async (postId, content = '') => {
    try {
      const response = await api.post(`/posts/${postId}/share`, { content });
      
      // Add the shared post to state if returned
      if (response.data && response.data.post) {
        setPosts(prev => [response.data.post, ...prev]);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      setError(error.response?.data?.message || 'Failed to share post');
      throw error;
    }
  };

  // Initial load of posts
  useEffect(() => {
    if (user) {
      fetchPosts(true);
    }
  }, [user, filter]);
  
  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!user) return;
    
    const socket = getSocket();
    if (!socket) return;
    
    // Listen for new posts
    socket.on('new_post', (newPost) => {
      setPosts(prev => [newPost, ...prev]);
    });
    
    // Listen for post likes updates
    socket.on('post_like_update', ({ postId, likes }) => {
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? { ...post, likes } : post
        )
      );
    });
    
    // Listen for new comments
    socket.on('new_comment', ({ postId, comments }) => {
      setPosts(prev => 
        prev.map(post => 
          post._id === postId ? { ...post, comments } : post
        )
      );
    });
    
    // Listen for post deletions
    socket.on('post_deleted', (postId) => {
      setPosts(prev => prev.filter(post => post._id !== postId));
    });
    
    // Listen for post shares
    socket.on('post_shared', ({ originalPostId, sharedPost }) => {
      setPosts(prev => [sharedPost, ...prev]);
    });
    
    return () => {
      // Clean up event listeners
      socket.off('new_post');
      socket.off('post_like_update');
      socket.off('new_comment');
      socket.off('post_deleted');
      socket.off('post_shared');
    };
  }, [user]);

  // Context value
  const value = {
    posts,
    loading,
    error,
    hasMore,
    filter,
    fetchPosts,
    createPost,
    likePost,
    unlikePost,
    addComment,
    deletePost,
    sharePost,
    changeFilter,
    setError
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export default FeedContext;