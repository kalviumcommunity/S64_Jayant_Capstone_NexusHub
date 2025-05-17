import React, { useState, useRef } from 'react';
import { useFeed } from '../../context/FeedContext';
import { useAuth } from '../../context/AuthContext';
import { FiImage, FiVideo, FiFile, FiX, FiUsers, FiLock, FiGlobe, FiTag } from 'react-icons/fi';

const CreatePost = () => {
  const { createPost } = useFeed();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreview, setMediaPreview] = useState([]);
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [showVisibilityDropdown, setShowVisibilityDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const visibilityDropdownRef = useRef(null);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (visibilityDropdownRef.current && !visibilityDropdownRef.current.contains(event.target)) {
        setShowVisibilityDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle text content change
  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create preview URLs for selected files
    const newPreviews = files.map(file => {
      return {
        file,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        name: file.name
      };
    });

    setMediaFiles([...mediaFiles, ...files]);
    setMediaPreview([...mediaPreview, ...newPreviews]);
  };

  // Remove a selected file
  const removeFile = (index) => {
    const newFiles = [...mediaFiles];
    const newPreviews = [...mediaPreview];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index].url);
    
    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setMediaFiles(newFiles);
    setMediaPreview(newPreviews);
  };

  // Handle tag input
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };

  // Add a tag when Enter is pressed
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  // Remove a tag
  const removeTag = (index) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  // Submit the post
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;
    
    try {
      setIsSubmitting(true);
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('content', content);
      formData.append('visibility', visibility);
      
      // Add tags
      if (tags.length > 0) {
        formData.append('tags', JSON.stringify(tags));
      }
      
      // Add media files
      mediaFiles.forEach(file => {
        formData.append('media', file);
      });
      
      await createPost(formData);
      
      // Reset form
      setContent('');
      setMediaFiles([]);
      setMediaPreview([]);
      setTags([]);
      setVisibility('public');
      
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render media previews
  const renderPreviews = () => {
    return mediaPreview.map((item, index) => (
      <div key={index} className="relative rounded-lg overflow-hidden border border-white/10 bg-white/5">
        {item.type === 'image' ? (
          <img src={item.url} alt="Preview" className="h-24 w-auto object-cover" />
        ) : item.type === 'video' ? (
          <video src={item.url} className="h-24 w-auto object-cover" />
        ) : (
          <div className="h-24 w-24 flex items-center justify-center bg-white/5">
            <FiFile className="text-2xl text-blue-400" />
            <span className="text-xs text-white/70 ml-1 truncate max-w-[80px]">{item.name}</span>
          </div>
        )}
        <button 
          type="button"
          onClick={() => removeFile(index)}
          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white hover:bg-red-500 transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>
    ));
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <img 
            src={user?.profilePicture ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.profilePicture}` : '/img/default-avatar.png'} 
            alt={user?.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-purple-500/50"
          />
        </div>
        <div className="flex-grow">
          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="What's on your mind?"
              className="w-full bg-transparent border border-white/10 rounded-lg p-3 text-white resize-none focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[100px]"
            />
            
            {/* Media Previews */}
            {mediaPreview.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {renderPreviews()}
              </div>
            )}
            
            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tags.map((tag, index) => (
                  <div key={index} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-sm flex items-center">
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(index)}
                      className="ml-1 text-purple-300 hover:text-white"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Tag Input */}
            {showTagInput && (
              <div className="mt-3">
                <div className="flex items-center bg-white/5 rounded-lg border border-white/10 px-3">
                  <span className="text-purple-400">#</span>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Add a tag and press Enter"
                    className="bg-transparent border-none p-2 text-white w-full focus:outline-none"
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  className="text-white/70 hover:text-purple-400 transition-colors"
                >
                  <FiImage size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current.click()}
                  className="text-white/70 hover:text-purple-400 transition-colors"
                >
                  <FiVideo size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-white/70 hover:text-purple-400 transition-colors"
                >
                  <FiTag size={20} />
                </button>
                <div className="relative" ref={visibilityDropdownRef}>
                  <button 
                    type="button" 
                    onClick={() => setShowVisibilityDropdown(!showVisibilityDropdown)}
                    className="text-white/70 hover:text-purple-400 transition-colors"
                  >
                    {visibility === 'public' && <FiGlobe size={20} />}
                    {visibility === 'connections' && <FiUsers size={20} />}
                    {visibility === 'private' && <FiLock size={20} />}
                  </button>
                  {showVisibilityDropdown && (
                    <div className="absolute left-0 mt-2 w-48 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl z-50">
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('public');
                            setShowVisibilityDropdown(false);
                          }}
                          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg ${visibility === 'public' ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5'}`}
                        >
                          <FiGlobe size={16} />
                          <span>Public</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('connections');
                            setShowVisibilityDropdown(false);
                          }}
                          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg ${visibility === 'connections' ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5'}`}
                        >
                          <FiUsers size={16} />
                          <span>Connections</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setVisibility('private');
                            setShowVisibilityDropdown(false);
                          }}
                          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg ${visibility === 'private' ? 'bg-purple-500/20 text-purple-300' : 'text-white/70 hover:bg-white/5'}`}
                        >
                          <FiLock size={16} />
                          <span>Private</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
                className={`px-4 py-2 rounded-lg font-medium ${
                  isSubmitting || (!content.trim() && mediaFiles.length === 0)
                    ? 'bg-purple-500/30 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600'
                } transition-colors`}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </button>
            </div>
            
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;