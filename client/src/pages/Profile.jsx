import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/transitions.css';
import { useAuth } from '../context/AuthContext.jsx';
import { pixelTransition } from '../utils/pixelTransition';
import { Switch } from '@headlessui/react';

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
  
  const defaultProfile = {
    name: '',
    title: '',
    about: '',
    skills: []
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
      setAccountType(user?.isPrivate !== false ? 'Private' : 'Public');
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
                    <span className="text-4xl text-white font-bold">{profileData.name.charAt(0)}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-extrabold text-white font-display tracking-tight drop-shadow-lg">{profileData.name}</h1>
                </div>
                <div className="text-lg text-purple-300 font-semibold mb-1">{profileData.title}</div>
                <div className="text-gray-400 text-sm">{user?.email}</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-gray-300 font-medium">Account Type:</span>
                  <span className={`ml-1 text-sm font-bold ${accountType === 'Public' ? 'text-green-400' : 'text-red-400'}`}>{accountType}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={handleEditProfile} className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold shadow hover:from-purple-700 hover:to-blue-600 transition">Edit Profile</button>
              <button onClick={handleLogout} className="px-6 py-2 rounded-full bg-gray-800 text-white font-semibold shadow hover:bg-gray-700 transition">Logout</button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">About</h3>
                <p className="text-white/60 font-robert-regular">
                  {profileData.about ? profileData.about : 'No about info available.'}
                </p>
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
                {user?.projects && user.projects.length > 0 ? (
                  <div className="space-y-4">
                    {user.projects.map((project, idx) => (
                      <div key={project._id || idx} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white font-robert-medium">{project.name || 'Untitled Project'}</h4>
                          <span className="text-white/40 text-sm">{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : ''}</span>
                        </div>
                        <p className="text-white/60 text-sm mt-2">{project.description || 'No description.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-white/60 text-sm">No projects yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
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
              {/* Title */}
              <div className="mb-4">
                <label className="block text-gray-300 mb-1">Title</label>
                <input type="text" name="title" value={profileData.title} onChange={handleInputChange} className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
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
