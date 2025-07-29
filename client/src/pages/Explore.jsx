import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch,
  FiUsers,
  FiUser,
  FiFileText,
  FiArrowRight,
  FiEye,
  FiMessageSquare,
  FiCalendar
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

// Get filtered results based on active filter (MOVE THIS UP)
const getFilteredResults = (searchResults, activeFilter) => {
  if (activeFilter === 'all') return searchResults;
  return {
    users: activeFilter === 'users' ? searchResults.users : [],
    teams: activeFilter === 'teams' ? searchResults.teams : [],
    posts: activeFilter === 'posts' ? searchResults.posts : []
  };
};

// Debounce utility
function useDebounce(callback, delay, deps = []) {
  const handler = useRef();
  useEffect(() => {
    if (handler.current) clearTimeout(handler.current);
    handler.current = setTimeout(() => {
      callback();
    }, delay);
    return () => clearTimeout(handler.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

const Explore = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, users, teams, posts
  const [searchResults, setSearchResults] = useState({ users: [], teams: [], posts: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(''); // userId or teamId for which action is loading
  const [actionSuccess, setActionSuccess] = useState('');
  const [recommendations, setRecommendations] = useState({ users: [], teams: [], posts: [] });
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Get filtered results based on active filter
  const filteredResults = getFilteredResults(searchResults, activeFilter);

  // Live search effect (debounced)
  useDebounce(() => {
    if (searchQuery.trim()) {
      handleSearch();
    }
  }, 400, [searchQuery]);

  // Fetch recommendations when searchQuery is empty
  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoadingRecommendations(true);
      setError(null);
      try {
        let skills = user?.skills && user.skills.length > 0 ? user.skills.join(',') : '';
        // Fetch users by skills, teams by tags, posts by tags
        const [usersRes, teamsRes, postsRes] = await Promise.all([
          api.get(`/users/search?query=${encodeURIComponent(skills || 'developer')}`),
          api.get(`/teams?tags=${encodeURIComponent(skills)}`),
          api.get(`/posts/search?query=${encodeURIComponent(skills)}`)
        ]);
        setRecommendations({
          users: usersRes.data.users || [],
          teams: (teamsRes.data.data || []),
          posts: postsRes.data.posts || []
        });
      } catch (err) {
        setError('Could not load recommendations.');
        setRecommendations({ users: [], teams: [], posts: [] });
      } finally {
        setLoadingRecommendations(false);
      }
    };
    if (!searchQuery.trim()) {
      fetchRecommendations();
    }
  }, [searchQuery, user]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    setError(null);
    try {
      const [usersRes, teamsRes, postsRes] = await Promise.all([
        api.get(`/users/search?query=${encodeURIComponent(searchQuery)}`),
        api.get(`/teams?search=${encodeURIComponent(searchQuery)}`),
        api.get(`/posts/search?query=${encodeURIComponent(searchQuery)}`)
      ]);
      setSearchResults({
        users: usersRes.data.users || [],
        teams: (teamsRes.data.data || []),
        posts: postsRes.data.posts || []
      });
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSearchResults({ users: [], teams: [], posts: [] });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => setActiveFilter(filter);
  const handleNavigation = (path) => navigate(path);

  // Friend request action
  const sendFriendRequest = async (userId) => {
    setActionLoading(userId);
    setActionSuccess('');
    try {
      await api.post('/users/friend-request', { userId });
      setActionSuccess('Friend request sent!');
    } catch (err) {
      setActionSuccess('Failed to send request');
    } finally {
      setActionLoading('');
    }
  };

  // Track requested/joined state for teams
  const [teamRequestStatus, setTeamRequestStatus] = useState({}); // { [teamId]: 'requested' | 'joined' }

  // On search results update, set status for each team
  useEffect(() => {
    if (filteredResults.teams && user) {
      const status = {};
      filteredResults.teams.forEach(t => {
        const isOwner = t.owner && (t.owner._id === user?._id || t.owner === user?._id);
        const isMember = t.members && t.members.some(m => (m.user?._id || m.user) === user?._id);
        const hasRequested = t.joinRequests && t.joinRequests.some(r => r.user === user?._id || r.user?._id === user?._id);
        if (isOwner) return;
        if (isMember) status[t._id] = 'joined';
        else if (hasRequested) status[t._id] = 'requested';
      });
      setTeamRequestStatus(status);
    }
  }, [filteredResults.teams, user]);

  // Update requestToJoinTeam to update local state
  const requestToJoinTeam = async (teamId) => {
    setActionLoading(teamId);
    setActionSuccess('');
    try {
      await api.post(`/teams/${teamId}/join`);
      setTeamRequestStatus(prev => ({ ...prev, [teamId]: 'requested' }));
      setActionSuccess('Join request sent!');
    } catch (err) {
      setActionSuccess('Failed to send join request');
    } finally {
      setActionLoading('');
    }
  };

  // Update joinTeam for public teams
  const joinTeamDirect = async (teamId) => {
    setActionLoading(teamId);
    setActionSuccess('');
    try {
      await api.post(`/teams/${teamId}/join`);
      setTeamRequestStatus(prev => ({ ...prev, [teamId]: 'joined' }));
      setActionSuccess('Joined!');
    } catch (err) {
      setActionSuccess('Failed to join');
    } finally {
      setActionLoading('');
    }
  };

  // Get filtered results based on active filter
  const totalResults = filteredResults.users.length + filteredResults.teams.length + filteredResults.posts.length;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Video Background */}
      <video
        className="fixed inset-0 w-full h-full object-cover z-0"
        src="/videos/NexusCrystal.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', filter: 'brightness(0.6) blur(1px)' }}
      />
      {/* Foreground content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-start items-center bg-transparent backdrop-blur-sm">
        {/* Explore Heading */}
        <div className="w-full flex flex-col items-center" style={{paddingTop: '5.5rem'}}>
          <h2 className="special-font text-6xl font-bold text-white tracking-wide drop-shadow-lg">Explore</h2>
        </div>
        <div className="container mx-auto px-4 py-8 w-full">
          {/* Search Section */}
          <div className="mb-8 mt-16">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for users, teams, or posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:border-purple-500 transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl hover:from-purple-700 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <FiSearch size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
          {/* Error State */}
          {error && <div className="text-center text-red-400 mb-4">{error}</div>}
          {/* Show Recommendations if not searching */}
          {!searchQuery.trim() && (
            <div>
              {loadingRecommendations ? (
                <div className="text-center py-12 text-white/80">Loading recommendations...</div>
              ) : (
                <div>
                  {/* Users Recommendations */}
                  {recommendations.users.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <FiUser className="mr-2" />
                        Recommended Users
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.users.map((u) => (
                          <motion.div
                            key={u._id}
                            whileHover={{ y: -5 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
                            onClick={() => handleNavigation(`/profile/${u.username}`)}
                          >
                            <div className="flex items-center space-x-4 mb-4">
                              <img
                                src={u.profilePicture || '/default-avatar.png'}
                                alt={u.name || u.username}
                                className="w-16 h-16 rounded-full object-cover"
                              />
                              <div>
                                <h3 className="text-lg font-bold text-white">{u.name || u.username}</h3>
                                <p className="text-white/60">@{u.username}</p>
                              </div>
                            </div>
                            <p className="text-white/80 text-sm mb-4">{u.bio}</p>
                            <div className="flex flex-wrap gap-2">
                              {(u.skills || []).slice(0, 3).map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Teams Recommendations */}
                  {recommendations.teams.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <FiUsers className="mr-2" />
                        Recommended Teams
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.teams.map((t) => (
                          <motion.div
                            key={t._id}
                            whileHover={{ y: -5 }}
                            className="relative bg-white/5 border border-white/10 rounded-2xl p-0 overflow-hidden backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all shadow-lg"
                            onClick={() => handleNavigation(`/teams/${t._id}`)}
                          >
                            {/* Team Banner */}
                            {t.banner && (
                              <div className="absolute inset-0 z-0 h-32">
                                <img
                                  src={t.banner.startsWith('http') ? t.banner : `http://localhost:5000${t.banner}`}
                                  alt={`${t.name} banner`}
                                  className="w-full h-32 object-cover opacity-40"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
                              </div>
                            )}
                            {/* Card Content */}
                            <div className="relative z-10 p-4 pt-20 flex flex-col h-full min-h-[170px]">
                              <div className="mb-1">
                                <h3 className="text-lg font-bold text-white drop-shadow-lg">{t.name}</h3>
                                <p className="text-white/60 text-xs">{t.memberCount || (t.members ? t.members.length : 0)} members</p>
                              </div>
                              <p className="text-white/80 text-xs mb-2 line-clamp-2">{t.description}</p>
                              <div className="flex flex-wrap gap-2 mb-1">
                                {(t.tags || []).slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 mt-auto">
                                {t.isPublic === false && (
                                  <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">Private</span>
                                )}
                                {t.isPublic !== false && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Public</span>
                                )}
                                <FiArrowRight className="text-white/40 ml-auto" />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Posts Recommendations */}
                  {recommendations.posts.length > 0 && (
                    <div className="mb-12">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <FiFileText className="mr-2" />
                        Recommended Posts
                      </h2>
                      <div className="space-y-6">
                        {recommendations.posts.map((post) => (
                          <motion.div
                            key={post._id}
                            whileHover={{ y: -2 }}
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
                            onClick={() => handleNavigation(`/feed/post/${post._id}`)}
                          >
                            <div className="flex items-start space-x-4">
                              <img
                                src={post.author?.profilePicture || '/default-avatar.png'}
                                alt={post.author?.name || post.author?.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h3 className="text-lg font-bold text-white">{post.title}</h3>
                                  <span className="text-white/40">by {post.author?.name || post.author?.username}</span>
                                </div>
                                <p className="text-white/80 text-sm mb-4">{post.content}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-6 text-white/60 text-sm">
                                    <span className="flex items-center">
                                      <FiEye className="mr-1" />
                                      {post.likes?.length || 0}
                                    </span>
                                    <span className="flex items-center">
                                      <FiMessageSquare className="mr-1" />
                                      {post.comments?.length || 0}
                                    </span>
                                    <span className="flex items-center">
                                      <FiCalendar className="mr-1" />
                                      {new Date(post.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(post.tags || []).slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* If no recommendations */}
                  {recommendations.users.length === 0 && recommendations.teams.length === 0 && recommendations.posts.length === 0 && (
                    <div className="text-center py-12 text-white/60">No recommendations available yet. Start by adding your skills or creating content!</div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Filter Tabs and Search Results (only if searching) */}
          {searchQuery.trim() && (
            <>
              {/* Filter Tabs */}
              <div className="mb-8">
                <div className="flex justify-center space-x-4">
                  {[
                    { key: 'all', label: 'All', icon: FiSearch, count: totalResults },
                    { key: 'users', label: 'Users', icon: FiUser, count: filteredResults.users.length },
                    { key: 'teams', label: 'Teams', icon: FiUsers, count: filteredResults.teams.length },
                    { key: 'posts', label: 'Posts', icon: FiFileText, count: filteredResults.posts.length }
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => handleFilterChange(filter.key)}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all ${
                        activeFilter === filter.key
                          ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white'
                          : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      <filter.icon size={18} />
                      <span>{filter.label}</span>
                      <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Search Results */}
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  {totalResults === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-2xl font-bold text-white mb-2">No results found</h3>
                      <p className="text-white/60">Try adjusting your search terms or filters</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Users Section */}
                      {filteredResults.users.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FiUser className="mr-2" />
                            Users ({filteredResults.users.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResults.users.map((u) => {
                              const isPrivate = u.isPrivate && (!u.friends || !u.friends.includes(user?._id));
                              return (
                                <motion.div
                                  key={u._id}
                                  whileHover={{ y: -5 }}
                                  className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
                                  onClick={() => !isPrivate && handleNavigation(`/profile/${u.username}`)}
                                >
                                  <div className="flex items-center space-x-4 mb-4">
                                    <img
                                      src={u.profilePicture || '/default-avatar.png'}
                                      alt={u.name || u.username}
                                      className="w-16 h-16 rounded-full object-cover"
                                    />
                                    <div>
                                      <h3 className="text-lg font-bold text-white">{u.name || u.username}</h3>
                                      <p className="text-white/60">@{u.username}</p>
                                    </div>
                                  </div>
                                  <p className="text-white/80 text-sm mb-4">{u.bio}</p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex flex-wrap gap-2">
                                      {(u.skills || []).slice(0, 3).map((skill) => (
                                        <span
                                          key={skill}
                                          className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                    {!isPrivate ? (
                                      <FiArrowRight className="text-white/40" />
                                    ) : (
                                      <button
                                        className="px-3 py-1 bg-purple-600 text-white rounded-full text-xs hover:bg-purple-700 transition-all disabled:opacity-50"
                                        disabled={actionLoading === u._id}
                                        onClick={e => { e.stopPropagation(); sendFriendRequest(u._id); }}
                                      >
                                        {actionLoading === u._id ? 'Sending...' : 'Send Friend Request'}
                                      </button>
                                    )}
                                  </div>
                                  {isPrivate && (
                                    <div className="mt-2 text-xs text-white/60">Private profile: Only limited info visible</div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Teams Section */}
                      {filteredResults.teams.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FiUsers className="mr-2" />
                            Teams ({filteredResults.teams.length})
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredResults.teams.map((t) => {
                              const isPrivate = t.isPublic === false;
                              const isMember = t.members && t.members.some(m => (m.user?._id || m.user) === user?._id);
                              const isOwner = t.owner && (t.owner._id === user?._id || t.owner === user?._id);
                              const canRequest = !isOwner && !isMember;
                              return (
                                <motion.div
                                  key={t._id}
                                  whileHover={{ y: -5 }}
                                  className="relative bg-white/5 border border-white/10 rounded-2xl p-0 overflow-hidden backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all shadow-lg"
                                  onClick={() => !isPrivate || isMember ? handleNavigation(`/teams/${t._id}`) : undefined}
                                >
                                  {/* Team Banner */}
                                  {t.banner && (
                                    <div className="absolute inset-0 z-0 h-32">
                                      <img
                                        src={t.banner.startsWith('http') ? t.banner : `http://localhost:5000${t.banner}`}
                                        alt={`${t.name} banner`}
                                        className="w-full h-32 object-cover opacity-40"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent" />
                                    </div>
                                  )}
                                  {/* Card Content */}
                                  <div className="relative z-10 p-4 pt-20 flex flex-col h-full min-h-[170px]">
                                    <div className="mb-1">
                                      <h3 className="text-lg font-bold text-white drop-shadow-lg">{t.name}</h3>
                                      <p className="text-white/60 text-xs">{t.memberCount || (t.members ? t.members.length : 0)} members</p>
                                    </div>
                                    <p className="text-white/80 text-xs mb-2 line-clamp-2">{t.description}</p>
                                    <div className="flex flex-wrap gap-2 mb-1">
                                      {(t.tags || []).slice(0, 3).map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto flex-wrap">
                                      {t.isPublic === false && (
                                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">Private</span>
                                      )}
                                      {t.isPublic !== false && (
                                        <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">Public</span>
                                      )}
                                      {/* Request/Join Button */}
                                      {canRequest && (
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            if (isPrivate) requestToJoinTeam(t._id);
                                            else joinTeamDirect(t._id);
                                          }}
                                          disabled={actionLoading === t._id || teamRequestStatus[t._id] === 'requested' || teamRequestStatus[t._id] === 'joined'}
                                          className="bg-white text-black font-zentry font-bold uppercase tracking-widest px-7 py-3 rounded-full shadow hover:bg-yellow-200 active:scale-95 transition text-xs mt-2"
                                          style={{ minWidth: 120 }}
                                        >
                                          {actionLoading === t._id
                                            ? (isPrivate ? 'Requesting...' : 'Joining...')
                                            : teamRequestStatus[t._id] === 'requested'
                                              ? 'Requested'
                                              : teamRequestStatus[t._id] === 'joined'
                                                ? 'Joined'
                                                : (isPrivate ? 'Request to Join' : 'Join')}
                                        </button>
                                      )}
                                      <FiArrowRight className="text-white/40 ml-auto" />
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Posts Section */}
                      {filteredResults.posts.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                            <FiFileText className="mr-2" />
                            Posts ({filteredResults.posts.length})
                          </h2>
                          <div className="space-y-6">
                            {filteredResults.posts.map((post) => (
                              <motion.div
                                key={post._id}
                                whileHover={{ y: -2 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => handleNavigation(`/feed/post/${post._id}`)}
                              >
                                <div className="flex items-start space-x-4">
                                  <img
                                    src={post.author?.profilePicture || '/default-avatar.png'}
                                    alt={post.author?.name || post.author?.username}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h3 className="text-lg font-bold text-white">{post.title}</h3>
                                      <span className="text-white/40">by {post.author?.name || post.author?.username}</span>
                                    </div>
                                    <p className="text-white/80 text-sm mb-4">{post.content}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-6 text-white/60 text-sm">
                                        <span className="flex items-center">
                                          <FiEye className="mr-1" />
                                          {post.likes?.length || 0}
                                        </span>
                                        <span className="flex items-center">
                                          <FiMessageSquare className="mr-1" />
                                          {post.comments?.length || 0}
                                        </span>
                                        <span className="flex items-center">
                                          <FiCalendar className="mr-1" />
                                          {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-2">
                                        {(post.tags || []).slice(0, 3).map((tag) => (
                                          <span
                                            key={tag}
                                            className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      <style>{`
        .special-font {
          font-family: 'Zentry', 'circular-web', 'robert-medium', 'sans-serif';
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
};

export default Explore; 