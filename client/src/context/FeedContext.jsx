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
      
      // Fetch posts and savedPosts in parallel
      const [postsRes, savedRes] = await Promise.all([
        api.get(`/posts${queryParams}`),
        api.get('/users/saved-posts')
      ]);
      
      // Handle different response structures
      let newPosts = [];
      if (postsRes.data && Array.isArray(postsRes.data.posts)) {
        newPosts = postsRes.data.posts;
      } else if (postsRes.data && Array.isArray(postsRes.data.data)) {
        newPosts = postsRes.data.data;
      } else if (postsRes.data && postsRes.data.success && Array.isArray(postsRes.data.data)) {
        newPosts = postsRes.data.data;
      } else {
        console.warn('Unexpected post data structure:', postsRes.data);
        newPosts = [];
      }
      
      // Get saved post IDs
      const savedIds = (savedRes.data?.savedPosts || []).map(p => (p._id || p.id));
      
      // Mark isSaved for each post
      newPosts = newPosts.map(post => ({ ...post, isSaved: savedIds.includes(post._id || post.id) }));
      
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
      // Optimistic update
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, isLiked: true } : post));
      const response = await api.post(`/posts/${postId}/like`);
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, likes: response.data.likes || post.likes } : post));
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to like post');
      throw error;
    }
  };

  // Unlike a post
  const unlikePost = async (postId) => {
    try {
      // Optimistic update
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, isLiked: false } : post));
      const response = await api.post(`/posts/${postId}/like`); // toggle like
      setPosts(prev => prev.map(post => post._id === postId ? { ...post, likes: response.data.likes || post.likes } : post));
      return response.data;
    } catch (error) {
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
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
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

  // Update a post
  const updatePost = async (postId, updateData) => {
    try {
      const response = await api.put(`/posts/${postId}`, updateData);
      // Update the post in state
      setPosts(prev => prev.map(post => post._id === postId ? response.data.post : post));
      return response.data.post;
    } catch (error) {
      console.error('Error updating post:', error);
      setError(error.response?.data?.message || 'Failed to update post');
      throw error;
    }
  };

  // Save a post
  const savePost = async (postId) => {
    // Optimistic update
    setPosts(prev => prev.map(post => post._id === postId ? { ...post, isSaved: true } : post));
    try {
      const response = await api.post(`/users/save/${postId}`);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save post');
      throw error;
    }
  };

  // Unsave a post
  const unsavePost = async (postId) => {
    // Optimistic update
    setPosts(prev => prev.map(post => post._id === postId ? { ...post, isSaved: false } : post));
    try {
      const response = await api.post(`/users/unsave/${postId}`);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to unsave post');
      throw error;
    }
  };

  // Get saved posts
  const getSavedPosts = async () => {
    try {
      const response = await api.get('/users/saved-posts');
      return response.data.savedPosts || [];
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch saved posts');
      return [];
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
    setError,
    updatePost,
    savePost,
    unsavePost,
    getSavedPosts
  };

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
};

export default FeedContext;