import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/transitions.css';
import { useAuth } from '../context/AuthContext.jsx';
import { pixelTransition } from '../utils/pixelTransition';
import { Switch } from '@headlessui/react';
import PostCard from '../components/feed/PostCard';
import { FiSettings } from 'react-icons/fi';
import api from '../utils/api.js';
import Button from '../components/Button';
import { TiLocationArrow } from 'react-icons/ti';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, loading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [accountType, setAccountType] = useState(user?.isPrivate !== false ? 'Private' : 'Public');
  const [skillInput, setSkillInput] = useState('');
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  
  const defaultProfile = {
    name: '',
    username: '', // <-- Added username
    about: '',
    skills: []
  };

  const [profileData, setProfileData] = useState(defaultProfile);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      // Set profile picture and account type only
      if (user.profilePicture) {
        setPreviewImage(user.profilePicture.startsWith('http') 
          ? user.profilePicture 
          : `http://localhost:5000${user.profilePicture}`);
      }
      setAccountType(user?.isPrivate !== false ? 'Private' : 'Public');
    }

    // No need for manual transition handling
    // App.jsx will handle hiding the loader after route change
  }, [user]);

  // Fetch user posts from backend API
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?._id) return;
      try {
        const res = await api.get(`/posts/user/${user._id}`);
        setUserPosts(res.data.posts || []);
      } catch (err) {
        setUserPosts([]);
      }
    };
    fetchUserPosts();
  }, [user?._id]);

  // Show all posts (caption-only, media-only, or both)
  const posts = userPosts;

  // Handler to instantly remove a post after delete
  const handleDeletePost = (postId) => {
    setUserPosts(prev => prev.filter(post => post._id !== postId));
  };

  // Handler to instantly update a post after edit
  const handleEditPost = (updatedPost) => {
    setUserPosts(prev => prev.map(post => post._id === updatedPost._id ? updatedPost : post));
  };

  const handleLogout = () => {
    logout();
    pixelTransition.navigate(navigate, '/login', {
      colors: "#fef08a,#fde047,#eab308", // Yellow theme
      gap: 5,
      speed: 30
    });
  };

  const handleEditProfile = () => {
    setProfileData({
      name: user?.name || '',
      username: user?.username || '',
      about: user?.bio || '',
      skills: user?.skills || []
    });
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setUpdateError('');
    setSelectedImage(null);
    setPreviewImage(user?.profilePicture ? 
      (user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`) 
      : null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (updateError) setUpdateError('');
  };

  const handleSkillInputChange = (e) => {
    setSkillInput(e.target.value);
    if (updateError) setUpdateError('');
  };

  const handleSkillInputKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
      e.preventDefault();
      const newSkill = skillInput.trim();
      if (newSkill && !profileData.skills.includes(newSkill)) {
        setProfileData(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
      }
      setSkillInput('');
    } else if (e.key === 'Backspace' && !skillInput && profileData.skills.length > 0) {
      // Remove last skill
      setProfileData(prev => ({ ...prev, skills: prev.skills.slice(0, -1) }));
    }
  };

  const handleRemoveSkill = (skill) => {
    setProfileData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const handleImageClick = () => {
    // Trigger file input click
    fileInputRef.current.click();
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAccountTypeToggle = () => {
    setAccountType(prev => (prev === 'Private' ? 'Public' : 'Private'));
  };

  const handleSaveChanges = async () => {
    setIsUpdating(true);
    setUpdateError('');
    
    try {
      // Create FormData if there's an image to upload
      let updateData;
      
      if (selectedImage) {
        updateData = new FormData();
        updateData.append('profilePicture', selectedImage);
        updateData.append('name', profileData.name);
        updateData.append('username', profileData.username); // <-- Send username
        updateData.append('bio', profileData.about);
        updateData.append('title', profileData.title);
        
        // Append skills as JSON string
        if (profileData.skills && profileData.skills.length > 0) {
          updateData.append('skills', JSON.stringify(profileData.skills));
        }
        updateData.append('isPrivate', accountType === 'Private');
      } else {
        // Regular JSON data if no image
        updateData = {
          name: profileData.name,
          username: profileData.username, // <-- Send username
          bio: profileData.about,
          title: profileData.title,
          skills: profileData.skills,
          isPrivate: accountType === 'Private',
        };
      }
      
      // Call API to update profile
      await updateProfile(updateData);
      setIsEditModalOpen(false);
      
      // Reset image selection
      setSelectedImage(null);
      
      // Also update local storage for persistence
      localStorage.setItem('profileData', JSON.stringify(profileData));
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
      {/* Background Video */}
      <video className="absolute inset-0 w-full h-full object-cover opacity-40" autoPlay muted loop>
        <source src="https://res.cloudinary.com/dyzfbhol5/video/upload/v1781063941/NexusCrystal_imby9z.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Back Button */}
      <Button
        id="profile-back-btn"
        title="Back"
        leftIcon={<span style={{ transform: 'rotate(180deg)', display: 'flex', alignItems: 'center' }}><TiLocationArrow /></span>}
        containerClass="absolute top-6 left-6 z-20 bg-white text-black font-zentry font-bold uppercase px-7 py-3 flex items-center gap-2 shadow hover:bg-yellow-200 active:scale-95 transition"
        onClick={() => navigate('/feed')}
      />

      {/* Profile Details */}
      <div className="relative z-10 flex flex-col items-center pt-20 pb-8">
        <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-3xl mx-auto">
          {/* Profile Photo */}
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#232347] bg-black flex items-center justify-center">
            {previewImage ? (
              <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl text-white font-bold">{user?.name?.[0]}</span>
            )}
          </div>
          {/* Details */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <span className="text-2xl md:text-3xl font-bold text-white flex items-center gap-14">
                {user?.name}
                {/* Settings (edit) button, only for own profile */}
                {user?._id === user?._id && (
                  <button
                    onClick={handleEditProfile}
                    className="p-1 rounded-full hover:bg-[#232347] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title="Edit Profile"
                  >
                    <FiSettings className="text-xl text-white/80 hover:text-blue-400 transition" />
                  </button>
                )}
              </span>
            </div>
            {/* Username below name */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/60 text-lg">@{user?.username}</span>
            </div>
            <div className="flex gap-8 text-white/80 text-lg mb-4">
              <span><span className="font-bold text-white">{userPosts.length}</span> posts</span>
              <span><span className="font-bold text-white">{user?.followers?.length || 0}</span> followers</span>
              <span><span className="font-bold text-white">{user?.following?.length || 0}</span> following</span>
            </div>
          </div>
        </div>
        {/* About & Skills side by side */}
        <div className="flex flex-row gap-8 w-full max-w-3xl mt-6">
          <div className="flex-1 bg-[#232347] rounded-xl p-4 text-white/90">
            <div className="font-semibold text-lg mb-2">About</div>
            <div>{user?.bio || 'No about info yet.'}</div>
          </div>
          <div className="flex-1 bg-[#232347] rounded-xl p-4 text-white/90">
            <div className="font-semibold text-lg mb-2">Skills</div>
            <div className="flex flex-wrap gap-2">
              {user?.skills && user.skills.length > 0 ? (
                user.skills.map((skill, i) => (
                  <span key={i} className="bg-blue-600/80 text-white px-3 py-1 rounded-full text-sm font-medium">{skill}</span>
                ))
              ) : (
                <span className="text-white/60">No skills added yet.</span>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="relative z-10 flex justify-center mt-4 mb-8 gap-4">
        <button onClick={() => setActiveTab('posts')} className={`px-6 py-2 rounded-full font-bold text-lg transition bg-blue-600 text-white`}>Posts</button>
      </div>
      {/* Posts/Reels Grid */}
      <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
        {posts.length === 0 ? (
          <div className="col-span-full text-center text-white/60 py-12">No posts yet.</div>
        ) : (
          posts.map(post => (
            <PostCard key={post._id} post={post} onDelete={handleDeletePost} onEdit={handleEditPost} />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#181c2f] rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-8 pt-8 pb-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-[#181c2f] z-10">
              <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            {/* Modal Content (Scrollable) */}
            <div className="overflow-y-auto px-8 py-6 flex-1 min-h-0">
              {/* Profile Picture Upload */}
              <div className="mb-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 p-1 cursor-pointer" onClick={handleImageClick}>
                  <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-sm flex items-center justify-center">
                    {previewImage ? (
                      <img src={previewImage} alt="Profile Preview" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <span className="text-4xl text-white font-bold">{profileData.name.charAt(0)}</span>
                    )}
                  </div>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleImageChange} />
                <span className="text-gray-400 text-xs mt-2">Click to upload a new profile picture<br />Recommended: Square image, max 5MB</span>
              </div>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Name</label>
                <input type="text" name="name" value={profileData.name} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              {/* Username */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Username</label>
                <input type="text" name="username" value={profileData.username} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                <span className="text-gray-500 text-xs">This will be your public @username.</span>
              </div>
              {/* About */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">About</label>
                <textarea name="about" value={profileData.about} onChange={handleInputChange} rows={4} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              {/* Skills */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {profileData.skills.map((skill, idx) => (
                    <span key={idx} className="flex items-center px-3 py-1 rounded-lg bg-white/10 text-white/80 text-sm font-robert-regular">
                      {skill}
                      <button type="button" className="ml-2 text-red-400 hover:text-red-600" onClick={() => handleRemoveSkill(skill)}>&times;</button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={skillInput}
                  onChange={handleSkillInputChange}
                  onKeyDown={handleSkillInputKeyDown}
                  placeholder="Type a skill and press Enter or Comma"
                  className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-gray-500 text-xs">Press Enter or comma to add. Spaces within skill names are preserved.</span>
              </div>
              {/* Account Type Toggle */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-gray-300 font-medium">Account Type:</span>
                <Switch
                  checked={accountType === 'Public'}
                  onChange={handleAccountTypeToggle}
                  className={`${accountType === 'Public' ? 'bg-green-500' : 'bg-gray-600'} relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none`}
                >
                  <span className="sr-only">Toggle Account Type</span>
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${accountType === 'Public' ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </Switch>
                <span className={`ml-2 text-sm font-bold ${accountType === 'Public' ? 'text-green-400' : 'text-red-400'}`}>{accountType}</span>
              </div>
              {updateError && <div className="text-red-400 text-center mb-2">{updateError}</div>}
            </div>
            {/* Modal Footer (Sticky) */}
            <div className="px-8 py-4 border-t border-gray-700 flex justify-end gap-4 sticky bottom-0 bg-[#181c2f] z-10">
              <button onClick={handleCloseModal} className="px-6 py-2 rounded-full bg-gray-700 text-white font-semibold hover:bg-gray-600 transition">Cancel</button>
              <button onClick={handleSaveChanges} disabled={isUpdating} className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold shadow hover:from-purple-700 hover:to-blue-600 transition disabled:opacity-60">
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transition Loader */}
      <div className="loader"></div>
    </div>
  );
};

export default Profile;
