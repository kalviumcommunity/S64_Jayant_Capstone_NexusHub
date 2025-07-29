import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { FiHeart, FiMessageSquare, FiShare, FiMoreVertical, FiTrash, FiGlobe, FiUsers, FiLock, FiEdit2 } from 'react-icons/fi';
import MediaCarousel from '../MediaCarousel';
import EmojiPicker from 'emoji-picker-react';

const PostCard = ({ post, onDelete, onEdit }) => {
  const { likePost, unlikePost, addComment, deletePost, sharePost, updatePost, savePost, unsavePost } = useFeed();
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
  const [showEmoji, setShowEmoji] = useState(false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);

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
        if (onDelete) onDelete(post._id); // Notify parent
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
      const updated = await updatePost(post._id, {
        content: editContent,
        tags: editTags,
        visibility: editVisibility
      });
      setShowEditModal(false);
      if (onEdit && updated) onEdit(updated); // Notify parent with updated post
    } catch (error) {
      // Optionally show error
    } finally {
      setIsEditing(false);
    }
  };

  // Handle save/unsave
  const handleSaveToggle = async () => {
    try {
      if (isSaved) {
        await unsavePost(post._id);
        setIsSaved(false);
        if (post.onUnsave) post.onUnsave(post._id);
      } else {
        await savePost(post._id);
        setIsSaved(true);
      }
    } catch (error) {
      // Optionally show error
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
    <div className="bg-[#181828] rounded-2xl shadow-lg p-0 mb-8 max-w-xl w-full mx-auto border border-[#232347]">
      {/* User Info */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.author._id}`} className="flex-shrink-0">
            <img src={post.author.profilePicture ? (post.author.profilePicture.startsWith('http') ? post.author.profilePicture : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${post.author.profilePicture}`) : '/img/default-avatar.png'} alt={post.author.name} className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50" />
          </Link>
          <div>
            <Link to={`/profile/${post.author._id}`} className="text-white font-semibold hover:text-purple-400 transition-colors text-base">{post.author.name}</Link>
            <div className="text-xs text-white/50 flex items-center gap-1">
              <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
              <span className="mx-1">•</span>
              {renderVisibilityIcon()}
            </div>
          </div>
        </div>
        {/* Post Menu (edit/delete) */}
        {post.author._id === user._id && (
          <div className="relative" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all duration-200">
              <FiMoreVertical size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-[#1A1A1A] border border-[#333] rounded-lg shadow-2xl z-10 overflow-hidden animate-fadeIn">
                <button onClick={() => setShowEditModal(true)} className="flex items-center gap-2 w-full text-left p-3 text-blue-400 hover:bg-[#222] transition-colors"><FiEdit2 size={16} /><span>Edit Post</span></button>
                <button onClick={handleDeletePost} className="flex items-center gap-2 w-full text-left p-3 text-red-400 hover:bg-[#222] transition-colors"><FiTrash size={16} /><span>Delete Post</span></button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Media Carousel */}
      {post.media && post.media.length > 0 && (
        <div className="w-full flex justify-center items-center">
          <MediaCarousel media={post.media} />
        </div>
      )}
      {/* Likes/Caption/Comments */}
      <div className="px-4 pt-4 pb-2">
        {/* Actions Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-6">
            <button onClick={handleLikeToggle} className="group flex items-center" aria-label="Like">
              <FiHeart size={26} className={`transition-all duration-200 ${isLiked ? 'text-pink-500 fill-pink-500' : 'text-white/80 group-hover:text-pink-400'}`} style={{fill: isLiked ? '#ec4899' : 'none'}} />
            </button>
            <button onClick={toggleComments} className="group flex items-center" aria-label="Comment">
              <FiMessageSquare size={24} className="text-white/80 group-hover:text-blue-400" />
            </button>
            <button onClick={handleShareClick} className="group flex items-center" aria-label="Share">
              <FiShare size={24} className="text-white/80 group-hover:text-blue-400" />
            </button>
          </div>
          {/* Save Button (rightmost) */}
          <button className="group flex items-center" aria-label="Save" onClick={handleSaveToggle}>
            {isSaved ? (
              <svg width="24" height="24" fill="#facc15" stroke="#facc15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            ) : (
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/80 group-hover:text-yellow-400"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            )}
          </button>
        </div>
        {/* Likes Count */}
        {post.likes.length > 0 && <div className="text-white font-semibold text-sm mb-1">{post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}</div>}
        {/* Caption */}
        <div className="text-white mb-1">
          <span className="font-semibold mr-2">{post.author.name}</span>{post.content}
        </div>
        {/* Comments Preview */}
        {post.comments && post.comments.length > 0 && post.comments.slice(0,2).map((c, idx) => (
          <div key={c._id || idx} className="text-white/90 text-sm mb-1">
            <span className="font-semibold mr-2">{c.user?.name}</span>{c.content}
          </div>
        ))}
        {/* Add Comment Box */}
        <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 mt-2">
          <input type="text" ref={commentInputRef} value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40 py-2" />
          <button type="button" onClick={() => setShowEmoji(v => !v)} className="text-white/60 hover:text-yellow-400 text-xl" tabIndex={-1} aria-label="Emoji">
            😊
          </button>
          {showEmoji && (
            <div className="absolute z-50 mt-40 right-0">
              <EmojiPicker theme="dark" onEmojiClick={(e) => setComment(comment + e.emoji)} height={350} width={300} />
            </div>
          )}
          <button type="submit" disabled={isSubmitting || !comment.trim()} className="text-blue-500 font-semibold ml-2 disabled:opacity-50">Post</button>
        </form>
      </div>
      {/* Share Dialog, Edit Modal, Comments Section (if needed) ... */}
    </div>
  );
};

export default PostCard;