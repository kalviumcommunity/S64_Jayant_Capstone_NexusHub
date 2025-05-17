import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/transitions.css';
import { useAuth } from '../context/AuthContext.jsx';
import { pixelTransition } from '../utils/pixelTransition';

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, loading } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  
  const defaultProfile = {
    name: 'John Doe',
    title: 'Professional Developer',
    about: 'Full-stack developer with expertise in React, Node.js, and cloud technologies. Passionate about creating beautiful and functional web applications.',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'UI/UX', 'GraphQL']
  };

  const [profileData, setProfileData] = useState(defaultProfile);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      // Initialize profile data from user object
      setProfileData(prevData => ({
        ...prevData,
        name: user.name || prevData.name,
        // If user has a title in their profile, use it, otherwise keep default
        title: user.title || prevData.title,
        about: user.bio || prevData.about,
        // If user has skills, use them, otherwise keep default
        skills: user.skills || prevData.skills
      }));
      
      // Set profile picture if available
      if (user.profilePicture) {
        setPreviewImage(user.profilePicture.startsWith('http') 
          ? user.profilePicture 
          : `http://localhost:5000${user.profilePicture}`);
      }
    }

    // No need for manual transition handling
    // App.jsx will handle hiding the loader after route change
  }, [user]);

  const handleLogout = () => {
    logout();
    pixelTransition.navigate(navigate, '/login', {
      colors: "#fef08a,#fde047,#eab308", // Yellow theme
      gap: 5,
      speed: 30
    });
  };

  const handleEditProfile = () => {
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

  const handleSkillsChange = (e) => {
    // Split by comma and trim each skill to remove leading/trailing whitespace
    // This preserves spaces within each skill name
    const skills = e.target.value.split(',').map(skill => skill.trim()).filter(skill => skill !== '');
    setProfileData(prev => ({
      ...prev,
      skills
    }));
    
    // Clear error when user starts typing
    if (updateError) setUpdateError('');
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
        updateData.append('bio', profileData.about);
        updateData.append('title', profileData.title);
        
        // Append skills as JSON string
        if (profileData.skills && profileData.skills.length > 0) {
          updateData.append('skills', JSON.stringify(profileData.skills));
        }
      } else {
        // Regular JSON data if no image
        updateData = {
          name: profileData.name,
          bio: profileData.about,
          title: profileData.title,
          skills: profileData.skills
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
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-5xl mx-auto">
          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div className="flex items-center gap-6 mb-6 md:mb-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 p-1">
                <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-sm flex items-center justify-center">
                  {previewImage ? (
                    <img 
                      src={previewImage} 
                      alt={profileData.name} 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : user?.profilePicture ? (
                    <img 
                      src={user.profilePicture.startsWith('http') ? user.profilePicture : `http://localhost:5000${user.profilePicture}`} 
                      alt={profileData.name} 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-white font-bold">
                      {profileData.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {profileData.name}
                </h1>
                <p className="text-white/60 font-robert-regular mt-1">{profileData.title}</p>
                <p className="text-white/40 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={handleEditProfile}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all"
              >
                Edit Profile
              </button>
              <button 
                onClick={handleLogout}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">About</h3>
                <p className="text-white/60 font-robert-regular">{profileData.about}</p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profileData.skills && profileData.skills.length > 0 ? (
                    profileData.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 rounded-lg bg-white/5 text-white/80 text-sm font-robert-regular">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/60 text-sm">No skills added yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Columns */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">Recent Projects</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((project) => (
                    <div
                      key={project}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-robert-medium">Project {project}</h4>
                        <span className="text-white/40 text-sm">2 days ago</span>
                      </div>
                      <p className="text-white/60 text-sm mt-2">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
          <div className="relative bg-[#1A1A1A] rounded-2xl p-8 w-full max-w-2xl mx-4 border border-white/10">
            <h2 className="text-2xl font-zentry font-bold text-white mb-6">Edit Profile</h2>
            
            {updateError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                {updateError}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-white/80 font-robert-medium mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div 
                    onClick={handleImageClick}
                    className="w-24 h-24 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 p-1 cursor-pointer hover:from-purple-600 hover:to-blue-600 transition-all"
                  >
                    <div className="w-full h-full rounded-xl bg-black/40 backdrop-blur-sm flex items-center justify-center relative">
                      {previewImage ? (
                        <img 
                          src={previewImage} 
                          alt="Profile Preview" 
                          className="w-full h-full rounded-xl object-cover"
                        />
                      ) : (
                        <span className="text-3xl text-white font-bold">
                          {profileData.name.charAt(0)}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-robert-medium">Change</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-white/60 text-sm">
                    <p>Click to upload a new profile picture</p>
                    <p className="mt-1">Recommended: Square image, max 5MB</p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-white/80 font-robert-medium mb-2">Name</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-white/80 font-robert-medium mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  value={profileData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-white/80 font-robert-medium mb-2">About</label>
                <textarea
                  name="about"
                  value={profileData.about}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  disabled={isUpdating}
                />
              </div>
              <div>
                <label className="block text-white/80 font-robert-medium mb-2">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={profileData.skills ? profileData.skills.join(', ') : ''}
                  onChange={handleSkillsChange}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-purple-500"
                  placeholder="e.g. React, Node.js, Frontend Development, UI/UX"
                  disabled={isUpdating}
                />
                <p className="mt-1 text-white/50 text-xs">Separate skills with commas. Spaces within skill names are preserved.</p>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isUpdating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all backdrop-blur-sm"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back
      </Link>

      {/* Transition Loader */}
      <div className="loader"></div>
    </div>
  );
};

export default Profile;
