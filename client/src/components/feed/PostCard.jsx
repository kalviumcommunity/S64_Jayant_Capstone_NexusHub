import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageSquare, FiShare, FiMoreVertical, FiTrash, FiGlobe, FiUsers, FiLock } from 'react-icons/fi';

const PostCard = ({ post }) => {
  const { likePost, unlikePost, addComment, deletePost, sharePost } = useFeed();
  const { user } = useAuth();
  const [comment, setComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const commentInputRef = useRef(null);
  const menuRef = useRef(null);
  const shareDialogRef = useRef(null);

  // Check if the current user has liked the post
  const isLiked = post.likes.some(like => like.user._id === user._id);

  // Handle like/unlike
  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        await unlikePost(post._id);
      } else {
        await likePost(post._id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    try {
      setIsSubmitting(true);
      await addComment(post._id, comment);
      setComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(post._id);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
    setShowMenu(false);
  };

  // Handle share post dialog
  const handleShareClick = () => {
    setShowShareDialog(true);
  };

  // Handle share post submission
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSharing(true);
      await sharePost(post._id, shareContent);
      setShareContent('');
      setShowShareDialog(false);
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Toggle comments visibility
  const toggleComments = () => {
    setShowComments(!showComments);
    if (!showComments) {
      // Focus the comment input when comments are shown
      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Close menu and share dialog when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (shareDialogRef.current && !shareDialogRef.current.contains(event.target)) {
        setShowShareDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Render media content
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;

    return (
      <div className={`mt-3 grid ${post.media.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
        {post.media.map((item, index) => (
          <div key={index} className="rounded-lg overflow-hidden bg-white/5">
            {item.type === 'image' ? (
              <img 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`} 
                alt="Post media" 
                className="w-full h-auto max-h-[400px] object-cover"
                loading="lazy"
              />
            ) : item.type === 'video' ? (
              <video 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`} 
                controls 
                className="w-full h-auto max-h-[400px]"
                poster={item.thumbnail ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.thumbnail}` : ''}
              />
            ) : (
              <a 
                href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-white font-medium">{item.name}</p>
                    <p className="text-white/50 text-sm">{(item.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render visibility icon
  const renderVisibilityIcon = () => {
    switch (post.visibility) {
      case 'public':
        return <FiGlobe className="text-white/50" size={14} />;
      case 'connections':
        return <FiUsers className="text-white/50" size={14} />;
      case 'private':
        return <FiLock className="text-white/50" size={14} />;
      default:
        return <FiGlobe className="text-white/50" size={14} />;
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/profile/${post.author._id}`} className="flex-shrink-0">
            <img 
              src={post.author.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.author.profilePicture}` : '/img/default-avatar.png'} 
              alt={post.author.name} 
              className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50"
            />
          </Link>
          <div className="ml-3">
            <div className="flex items-center">
              <Link to={`/profile/${post.author._id}`} className="text-white font-medium hover:text-purple-400 transition-colors">
                {post.author.name}
              </Link>
              {post.project && (
                <>
                  <span className="mx-2 text-white/50">•</span>
                  <Link to={`/projects/${post.project._id}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                    {post.project.title}
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center text-white/50 text-sm">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span className="mx-1">•</span>
              {renderVisibilityIcon()}
            </div>
          </div>
        </div>
        
        {/* Post Menu */}
        {post.author._id === user._id && (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="text-white/50 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <FiMoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl z-10">
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-2 w-full text-left p-3 text-red-400 hover:bg-white/5 transition-colors"
                >
                  <FiTrash size={16} />
                  <span>Delete Post</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Post Content */}
      <div className="mt-3">
        <p className="text-white whitespace-pre-wrap">{post.content}</p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {post.tags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/feed?tag=${tag}`}
                className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm hover:bg-purple-500/30 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Shared Post */}
        {post.sharedPost && (
          <div className="mt-4 p-3 border border-white/10 rounded-lg bg-white/5">
            <div className="flex items-center">
              <Link to={`/profile/${post.sharedPost.author._id}`} className="flex-shrink-0">
                <img 
                  src={post.sharedPost.author.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.sharedPost.author.profilePicture}` : '/img/default-avatar.png'} 
                  alt={post.sharedPost.author.name} 
                  className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
                />
              </Link>
              <div className="ml-2">
                <Link to={`/profile/${post.sharedPost.author._id}`} className="text-white font-medium hover:text-purple-400 transition-colors">
                  {post.sharedPost.author.name}
                </Link>
                <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(post.sharedPost.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
            <p className="text-white/80 mt-2 whitespace-pre-wrap">{post.sharedPost.content}</p>
            
            {/* Shared post media */}
            {post.sharedPost.media && post.sharedPost.media.length > 0 && (
              <div className={`mt-3 grid ${post.sharedPost.media.length > 1 ? 'grid-cols-2 gap-2' : 'grid-cols-1'}`}>
                {post.sharedPost.media.map((item, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-white/5">
                    {item.type === 'image' ? (
                      <img 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`} 
                        alt="Shared post media" 
                        className="w-full h-auto max-h-[200px] object-cover"
                        loading="lazy"
                      />
                    ) : item.type === 'video' ? (
                      <video 
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`} 
                        controls 
                        className="w-full h-auto max-h-[200px]"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Media */}
        {renderMedia()}
      </div>
      
      {/* Post Stats */}
      <div className="flex items-center justify-between mt-4 text-white/50 text-sm">
        <div>
          {post.likes.length > 0 && (
            <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
          )}
        </div>
        <div>
          {post.comments.length > 0 && (
            <button 
              onClick={toggleComments}
              className="hover:text-white transition-colors"
            >
              {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
            </button>
          )}
        </div>
      </div>
      
      {/* Post Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
        <button 
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 px-3 py-1 rounded-lg transition-colors ${
            isLiked ? 'text-red-400 bg-red-400/10' : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button 
          onClick={toggleComments}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <FiMessageSquare size={18} />
          <span>Comment</span>
        </button>
        
        <button 
          onClick={handleShareClick}
          className="flex items-center gap-2 px-3 py-1 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
        >
          <FiShare size={18} />
          <span>Share</span>
        </button>
      </div>
      
      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            ref={shareDialogRef}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl p-4 w-full max-w-lg"
          >
            <h3 className="text-white font-medium mb-4">Share this post</h3>
            <form onSubmit={handleShareSubmit}>
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Add a comment (optional)"
                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[100px]"
              />
              
              {/* Original post preview */}
              <div className="mt-4 p-3 border border-white/10 rounded-lg bg-white/5">
                <div className="flex items-center">
                  <img 
                    src={post.author.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.author.profilePicture}` : '/img/default-avatar.png'} 
                    alt={post.author.name} 
                    className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
                  />
                  <div className="ml-2">
                    <p className="text-white font-medium">{post.author.name}</p>
                    <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
                <p className="text-white/80 mt-2 line-clamp-2">{post.content}</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowShareDialog(false)}
                  className="px-4 py-2 rounded-lg font-medium bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    isSharing
                      ? 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                  } transition-colors`}
                >
                  {isSharing ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-3 border-t border-white/10">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-center gap-3 mb-4">
            <img 
              src={user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}` : '/img/default-avatar.png'} 
              alt={user?.name} 
              className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
            />
            <div className="flex-grow relative">
              <input
                type="text"
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !comment.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 rounded-full text-sm ${
                  isSubmitting || !comment.trim()
                    ? 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                } transition-colors`}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
          
          {/* Comments List */}
          <div className="space-y-3">
            {post.comments.map((comment, index) => (
              <div key={index} className="flex gap-3">
                <Link to={`/profile/${comment.user._id}`} className="flex-shrink-0">
                  <img 
                    src={comment.user.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${comment.user.profilePicture}` : '/img/default-avatar.png'} 
                    alt={comment.user.name} 
                    className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
                  />
                </Link>
                <div className="flex-grow">
                  <div className="bg-white/5 rounded-lg p-3">
                    <Link to={`/profile/${comment.user._id}`} className="text-white font-medium hover:text-purple-400 transition-colors">
                      {comment.user.name}
                    </Link>
                    <p className="text-white/90 mt-1">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;