import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageSquare, FiShare, FiMoreVertical, FiTrash, FiGlobe, FiUsers, FiLock, FiEdit2 } from 'react-icons/fi';

const PostCard = ({ post }) => {
  const { likePost, unlikePost, addComment, deletePost, sharePost, updatePost } = useFeed();
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editTags, setEditTags] = useState(post.tags || []);
  const [editVisibility, setEditVisibility] = useState(post.visibility || 'public');
  const [isEditing, setIsEditing] = useState(false);

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

  // Handle post update
  const handleEditPost = async (e) => {
    e.preventDefault();
    try {
      setIsEditing(true);
      await updatePost(post._id, {
        content: editContent,
        tags: editTags,
        visibility: editVisibility
      });
      setShowEditModal(false);
    } catch (error) {
      // Optionally show error
    } finally {
      setIsEditing(false);
    }
  };

  // Utility to get aspect ratio label and value
  const getAspectRatio = (width, height) => {
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.05) return { label: '1:1', value: 1 };
    if (Math.abs(ratio - 0.8) < 0.05) return { label: '4:5', value: 4 / 5 };
    if (Math.abs(ratio - 16 / 9) < 0.05) return { label: '16:9', value: 16 / 9 };
    if (Math.abs(ratio - 9 / 16) < 0.05) return { label: '9:16', value: 9 / 16 };
    // Default to 1:1
    return { label: '1:1', value: 1 };
  };

  // Responsive MediaCard component
  const MediaCard = ({ url, type }) => {
    const [aspect, setAspect] = React.useState({ label: '1:1', value: 1 });
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
      if (type === 'image') {
        const img = new window.Image();
        img.onload = () => {
          setAspect(getAspectRatio(img.naturalWidth, img.naturalHeight));
          setLoaded(true);
        };
        img.src = url;
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          setAspect(getAspectRatio(video.videoWidth, video.videoHeight));
          setLoaded(true);
        };
        video.src = url;
      }
    }, [url, type]);

    // Desktop sizes
    const desktopMaxWidth = 600;
    let height = desktopMaxWidth / aspect.value;
    // Clamp height for portrait/vertical
    if (aspect.label === '4:5') height = 750;
    if (aspect.label === '9:16') height = 1066;
    if (aspect.label === '16:9') height = 338;
    if (aspect.label === '1:1') height = 600;

    return (
      <div
        className="media-card bg-black flex items-center justify-center mx-auto w-full"
        style={{
          maxWidth: desktopMaxWidth,
          width: '100%',
          aspectRatio: aspect.value,
          height: loaded ? height : 0,
          minHeight: 200,
          background: 'black',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          transition: 'height 0.2s',
        }}
      >
        {type === 'image' ? (
          <img
            src={url}
            alt="Post media"
            className="w-full h-full object-contain bg-black"
            style={{ aspectRatio: aspect.value, maxHeight: '100%', maxWidth: '100%' }}
          />
        ) : type === 'video' ? (
          <video
            src={url}
            controls
            className="w-full h-full object-contain bg-black"
            style={{ aspectRatio: aspect.value, maxHeight: '100%', maxWidth: '100%' }}
          />
        ) : null}
      </div>
    );
  };

  // Replace renderMedia with new system
  const renderMedia = () => {
    if (!post.media || post.media.length === 0) return null;
    // Only show first media for now
    const item = post.media[0];
    const url = item.url.startsWith('http') ? item.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`;
    return <MediaCard url={url} type={item.type} />;
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
    <div className="bg-[#111111]/80 backdrop-blur-md border border-[#222] rounded-xl p-5 mb-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-[#333]">
      {/* Post Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/profile/${post.author._id}`} className="flex-shrink-0 group">
            <div className="relative">
              <img 
                src={post.author.profilePicture
                  ? (post.author.profilePicture.startsWith('http')
                      ? post.author.profilePicture
                      : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.author.profilePicture}`)
                  : '/img/default-avatar.png'} 
                alt={post.author.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-purple-500/50 group-hover:border-purple-500 transition-all duration-300"
                onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
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
              className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200"
            >
              <FiMoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl z-10 overflow-hidden animate-fadeIn">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 w-full text-left p-3 text-blue-400 hover:bg-[#222] transition-colors"
                >
                  <FiEdit2 size={16} />
                  <span>Edit Post</span>
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-2 w-full text-left p-3 text-red-400 hover:bg-[#222] transition-colors"
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
      <div className="mt-4">
        <p className="text-white whitespace-pre-wrap leading-relaxed">{post.content}</p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.tags.map((tag, index) => (
              <Link 
                key={index} 
                to={`/feed?tag=${tag}`}
                className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-300 px-3 py-1 rounded-full text-sm hover:from-purple-500/30 hover:to-blue-500/30 transition-all duration-300"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
        
        {/* Shared Post */}
        {post.sharedPost && (
          <div className="mt-4 p-4 border border-[#333] rounded-lg bg-[#1A1A1A]/70 backdrop-blur-sm">
            <div className="flex items-center">
              <Link to={`/profile/${post.sharedPost.author._id}`} className="flex-shrink-0 group">
                <div className="relative">
                  <img 
                    src={post.sharedPost.author.profilePicture
                      ? (post.sharedPost.author.profilePicture.startsWith('http')
                          ? post.sharedPost.author.profilePicture
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.sharedPost.author.profilePicture}`)
                      : '/img/default-avatar.png'} 
                    alt={post.sharedPost.author.name} 
                    className="w-9 h-9 rounded-full object-cover border border-purple-500/50 group-hover:border-purple-500 transition-all duration-300"
                    onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
                  />
                </div>
              </Link>
              <div className="ml-2">
                <Link to={`/profile/${post.sharedPost.author._id}`} className="text-white font-medium hover:text-purple-400 transition-colors">
                  {post.sharedPost.author.name}
                </Link>
                <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(post.sharedPost.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
            <p className="text-white/80 mt-2 whitespace-pre-wrap leading-relaxed">{post.sharedPost.content}</p>
            
            {/* Shared post media */}
            {post.sharedPost.media && post.sharedPost.media.length > 0 && (
              <div className={`mt-3 grid ${post.sharedPost.media.length > 1 ? 'grid-cols-2 gap-3' : 'grid-cols-1'}`}>
                {post.sharedPost.media.map((item, index) => (
                  <div key={index} className="rounded-lg overflow-hidden bg-[#222] shadow-md">
                    {item.type === 'image' ? (
                      <img 
                        src={item.url.startsWith('http') ? item.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`}
                        alt="Shared post media" 
                        className="w-full h-auto max-h-[200px] object-cover hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
                      />
                    ) : item.type === 'video' ? (
                      <video 
                        src={item.url.startsWith('http') ? item.url : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${item.url}`}
                        controls 
                        className="w-full h-auto max-h-[200px]"
                        onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
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
      <div className="flex items-center justify-between mt-5 text-white/50 text-sm">
        <div>
          {post.likes.length > 0 && (
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 w-5 h-5 rounded-full flex items-center justify-center mr-2">
                <FiHeart size={12} className="text-white fill-current" />
              </div>
              <span>{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</span>
            </div>
          )}
        </div>
        <div>
          {post.comments.length > 0 && (
            <button 
              onClick={toggleComments}
              className="hover:text-white transition-colors flex items-center"
            >
              <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Post Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#333]">
        <button 
          onClick={handleLikeToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
            isLiked 
              ? 'text-white bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30' 
              : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FiHeart size={18} className={isLiked ? 'fill-current' : ''} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>
        
        <button 
          onClick={toggleComments}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-300"
        >
          <FiMessageSquare size={18} />
          <span>Comment</span>
        </button>
        
        <button 
          onClick={handleShareClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-300"
        >
          <FiShare size={18} />
          <span>Share</span>
        </button>
      </div>
      
      {/* Share Dialog */}
      {showShareDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div 
            ref={shareDialogRef}
            className="bg-[#111] rounded-xl p-5 max-w-md w-full border border-[#333] shadow-2xl"
          >
            <h3 className="text-white font-semibold text-xl mb-4">Share Post</h3>
            <form onSubmit={handleShareSubmit}>
              <textarea
                value={shareContent}
                onChange={(e) => setShareContent(e.target.value)}
                placeholder="Add a comment (optional)"
                className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none mb-4 transition-all duration-300"
                rows={3}
                autoFocus
              />
              
              {/* Original post preview */}
              <div className="bg-[#1A1A1A] rounded-lg p-4 mb-5 border border-[#333]">
                <div className="flex items-center">
                  <img 
                    src={post.author.profilePicture
                      ? (post.author.profilePicture.startsWith('http')
                          ? post.author.profilePicture
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.author.profilePicture}`)
                      : '/img/default-avatar.png'} 
                    alt={post.author.name} 
                    className="w-10 h-10 rounded-full object-cover border border-purple-500/30"
                    onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
                  />
                  <div className="ml-3">
                    <p className="text-white font-medium">{post.author.name}</p>
                    <p className="text-white/50 text-xs">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</p>
                  </div>
                </div>
                <p className="text-white/80 mt-3 line-clamp-2">{post.content}</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowShareDialog(false)}
                  className="px-5 py-2.5 rounded-lg bg-[#222] text-white hover:bg-[#333] transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSharing}
                  className={`px-5 py-2.5 rounded-lg ${
                    isSharing
                      ? 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-purple-500/20'
                  } transition-all duration-300`}
                >
                  {isSharing ? 'Sharing...' : 'Share Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Edit Post Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <form onSubmit={handleEditPost} className="bg-[#111] rounded-xl p-6 max-w-md w-full border border-[#333] shadow-2xl">
            <h3 className="text-white font-semibold text-xl mb-4">Edit Post</h3>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none mb-4 transition-all duration-300"
              rows={4}
              required
            />
            {/* Tags and visibility can be added here as needed */}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600">Cancel</button>
              <button type="submit" disabled={isEditing} className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-60">
                {isEditing ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Comments Section */}
      {showComments && (
        <div className="mt-5 pt-4 border-t border-[#333] animate-fadeIn">
          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex items-start gap-3 mb-5">
            <img 
              src={user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}` : '/img/default-avatar.png'} 
              alt={user?.name} 
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-purple-500/30"
              onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
            />
            <div className="flex-grow relative">
              <input
                type="text"
                ref={commentInputRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-[#1A1A1A] border border-[#333] rounded-full px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300"
              />
              <button 
                type="submit" 
                disabled={isSubmitting || !comment.trim()}
                className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 rounded-full text-sm ${
                  isSubmitting || !comment.trim()
                    ? 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 shadow-lg hover:shadow-purple-500/20'
                } transition-all duration-300`}
              >
                {isSubmitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
          
          {/* Comments List */}
          <div className="space-y-5">
            {post.comments.map((comment, index) => (
              <div key={index} className="flex items-start gap-3 group">
                <Link to={`/profile/${comment.user._id}`} className="flex-shrink-0">
                  <img 
                    src={comment.user.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${comment.user.profilePicture}` : '/img/default-avatar.png'} 
                    alt={comment.user.name} 
                    className="w-10 h-10 rounded-full object-cover border border-purple-500/30 group-hover:border-purple-500/50 transition-all duration-300"
                    onError={e => { e.target.onerror = null; e.target.src = '/img/default-avatar.png'; }}
                  />
                </Link>
                <div className="flex-grow">
                  <div className="bg-[#1A1A1A] rounded-lg px-4 py-3 border border-[#333] group-hover:border-[#444] transition-all duration-300">
                    <Link to={`/profile/${comment.user._id}`} className="font-medium text-white hover:text-purple-400 transition-colors">
                      {comment.user.name}
                    </Link>
                    <p className="text-white/90 mt-1 leading-relaxed">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/50">
                    <span>{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                    <button className="hover:text-white transition-colors">Like</button>
                    <button className="hover:text-white transition-colors">Reply</button>
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