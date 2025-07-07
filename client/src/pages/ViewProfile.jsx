import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import Loader from '../components/Loader';
import api from '../utils/api';
import { Switch } from '@headlessui/react';

const getProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User';
  if (profilePicture.startsWith('http')) return profilePicture;
  if (profilePicture.startsWith('/uploads/')) return profilePicture;
  return `/uploads/profile-images/${profilePicture}`;
};

const ViewProfile = () => {
  const { username } = useParams();
  const { user: loggedInUser } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState('Posts');
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [accountType, setAccountType] = useState(user?.isPrivate !== false ? 'Private' : 'Public');

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/users/${username}`);
        setUser(res.data.user);
      } catch (err) {
        setError('User not found or error fetching profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username]);

  useEffect(() => {
    setAccountType(user?.isPrivate !== false ? 'Private' : 'Public');
  }, [user]);

  // Toggle account type handler
  const handleAccountTypeToggle = async () => {
    if (!isOwnProfile) return;
    setUpdatingPrivacy(true);
    try {
      const newType = accountType === 'Private' ? 'Public' : 'Private';
      await api.put('/users/profile', { isPrivate: newType === 'Private' });
      setAccountType(newType);
      setUser((prev) => ({ ...prev, isPrivate: newType === 'Private' }));
    } catch (err) {
      // Optionally show error
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader /></div>;
  if (error) return <div className="text-center text-red-400 mt-12">{error}</div>;
  if (!user) return null;

  // Privacy logic
  const isOwnProfile = loggedInUser && (loggedInUser.username === user.username);
  const isPrivate = user.isPrivate;

  // Profile image URL logic
  const profilePicture = getProfilePictureUrl(user.profilePicture);
  // Debug log for image URL
  console.log('Profile image URL:', profilePicture);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#181c2f] to-[#232946] flex flex-col items-center font-sans">
      {/* Profile Header */}
      <div className="w-full max-w-2xl flex flex-col items-center mt-28 mb-6">
        <div className="relative">
          <img
            src={profilePicture}
            alt={user.username + ' profile'}
            className="w-36 h-36 rounded-full border-4 border-blue-500 shadow-lg object-cover bg-gray-800"
            onError={e => {
              setImgError(true);
              e.target.onerror = null;
              e.target.src = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + (user.displayName || user.username);
            }}
          />
          {imgError && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs text-red-400 bg-gray-900 px-2 py-1 rounded shadow">
              Profile photo could not be loaded.
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col items-center">
          <span className="text-3xl font-extrabold text-white font-display tracking-tight drop-shadow-lg">{user.displayName || user.username}</span>
          <span className="text-md text-blue-400 font-mono">@{user.username}</span>
        </div>
        {user.bio && !isPrivate && <div className="mt-2 text-gray-300 text-center max-w-lg italic font-light">{user.bio}</div>}
        {/* Stats Row */}
        <div className="flex justify-center gap-12 mt-6 w-full">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white font-display">{user.postCount ?? 0}</span>
            <span className="text-gray-400 text-sm">Posts</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white font-display">{user.friendCount ?? 0}</span>
            <span className="text-gray-400 text-sm">Friends</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-white font-display">{user.teamCount ?? 0}</span>
            <span className="text-gray-400 text-sm">Teams</span>
          </div>
        </div>
        {/* Action Button */}
        <div className="mt-6">
          {isOwnProfile ? (
            <button className="px-8 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold shadow hover:from-purple-700 hover:to-blue-600 transition">Edit Profile</button>
          ) : (
            <button className="px-8 py-2 rounded-full bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition">Add Friend</button>
          )}
        </div>
      </div>
      {/* Private Profile Message (Instagram style) */}
      {isPrivate && !isOwnProfile ? (
        <div className="flex flex-col items-center justify-center w-full max-w-2xl bg-transparent py-10 mt-2 mb-8">
          <span className="text-4xl mb-2">🔒</span>
          <span className="text-lg text-white font-semibold">This account is private</span>
        </div>
      ) : (
        // Tabs/Sections for public or own profile
        <div className="w-full max-w-3xl px-4">
          <div className="flex gap-8 border-b border-gray-700 pb-2 justify-center">
            {['Posts', 'Teams', 'About'].map(tab => (
              <button
                key={tab}
                className={`text-lg font-semibold pb-1 border-b-2 transition-all ${activeTab === tab ? 'text-white border-blue-500' : 'text-gray-400 border-transparent hover:text-white'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* Section Content */}
          <div className="mt-8 text-gray-300 text-center min-h-[120px]">
            {activeTab === 'Posts' && <div>Posts content goes here...</div>}
            {activeTab === 'Teams' && <div>Teams content goes here...</div>}
            {activeTab === 'About' && (
              <div className="flex flex-col items-center gap-2">
                <div className="text-lg font-bold text-white">About {user.displayName || user.username}</div>
                <div className="text-gray-300">{user.bio || 'No bio provided.'}</div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {(user.skills && user.skills.length > 0) ? (
                    user.skills.map(skill => (
                      <span key={skill} className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">{skill}</span>
                    ))
                  ) : (
                    <span className="text-white/60 text-sm">No skills added yet</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProfile; 