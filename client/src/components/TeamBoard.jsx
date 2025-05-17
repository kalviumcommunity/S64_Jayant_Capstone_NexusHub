import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiUsers, FiTrash, FiLock, FiGlobe, FiUserPlus, FiCheck, FiX, FiEye } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import TeamDetails from './TeamDetails';

const TeamBoard = ({ initialTeams = [], onEditTeam }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Use provided teams or default teams
  const [teams, setTeams] = useState(initialTeams.length > 0 ? initialTeams : []);
  
  // Load user teams with progress information
  useEffect(() => {
    const loadTeamsWithProgress = async () => {
      if (initialTeams.length > 0) {
        const teamsWithProgress = await calculateTeamProjectsProgress(initialTeams);
        setTeams(teamsWithProgress);
      }
    };
    
    loadTeamsWithProgress();
  }, [initialTeams]);
  const [publicTeams, setPublicTeams] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinRequests, setShowJoinRequests] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [viewingTeamDetails, setViewingTeamDetails] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newTeam, setNewTeam] = useState({
    name: "",
    description: "",
    isPublic: true,
    tags: []
  });

  // Calculate project progress for teams
  const calculateTeamProjectsProgress = async (teamsData) => {
    const updatedTeams = await Promise.all(teamsData.map(async (team) => {
      if (!team.projects || team.projects.length === 0) {
        return { ...team, projectsProgress: 0 };
      }
      
      try {
        // Get project IDs
        const projectIds = team.projects.map(project => 
          typeof project === 'object' ? project._id || project.id : project
        ).filter(id => id);
        
        if (projectIds.length === 0) return { ...team, projectsProgress: 0 };
        
        // Calculate average progress across all team projects
        let totalProgress = 0;
        let projectsWithProgress = 0;
        
        for (const projectId of projectIds) {
          try {
            const response = await api.get(`/projects/${projectId}`);
            if (response.data && (response.data.data || response.data.project)) {
              const project = response.data.data || response.data.project;
              if (project.progress !== undefined) {
                totalProgress += project.progress;
                projectsWithProgress++;
              }
            }
          } catch (error) {
            console.warn(`Error fetching project ${projectId}:`, error);
          }
        }
        
        const avgProgress = projectsWithProgress > 0 
          ? Math.round(totalProgress / projectsWithProgress) 
          : 0;
          
        return { ...team, projectsProgress: avgProgress };
      } catch (error) {
        console.error('Error calculating team progress:', error);
        return { ...team, projectsProgress: 0 };
      }
    }));
    
    return updatedTeams;
  };

  // Fetch public teams that the user is not a member of
  useEffect(() => {
    const fetchPublicTeams = async () => {
      try {
        const response = await api.get('/teams?isPublic=true');
        if (response.data && response.data.data) {
          // Filter out teams the user is already a member of
          const userTeamIds = teams.map(team => team._id || team.id);
          const availablePublicTeams = response.data.data.filter(team => {
            const teamId = team._id || team.id;
            return !userTeamIds.includes(teamId);
          });
          
          // Calculate project progress for public teams
          const teamsWithProgress = await calculateTeamProjectsProgress(availablePublicTeams);
          setPublicTeams(teamsWithProgress);
        }
      } catch (error) {
        console.error('Error fetching public teams:', error);
      }
    };

    fetchPublicTeams();
  }, [teams]);

  // Fetch join requests for a team
  const fetchJoinRequests = async (teamId) => {
    setLoading(true);
    try {
      const response = await api.get(`/teams/${teamId}/join-requests`);
      if (response.data && response.data.data) {
        setJoinRequests(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle join request action (accept/reject)
  const handleJoinRequest = async (teamId, userId, action) => {
    try {
      await api.post(`/teams/${teamId}/join-requests`, {
        userId,
        action
      });
      
      // Remove the request from the list
      setJoinRequests(prevRequests => 
        prevRequests.filter(request => request.user._id !== userId)
      );
      
      // If accepted, refresh the team data
      if (action === 'accept') {
        // Refresh teams data
        const response = await api.get('/teams/my-teams');
        if (response.data && response.data.data) {
          const allTeams = [
            ...(response.data.data?.owned || []),
            ...(response.data.data?.member || [])
          ];
          
          // Calculate progress for all teams
          const teamsWithProgress = await calculateTeamProjectsProgress(allTeams);
          setTeams(teamsWithProgress);
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing join request:`, error);
    }
  };

  // Request to join a team
  const requestToJoinTeam = async (teamId) => {
    try {
      await api.post(`/teams/${teamId}/join`, {
        message: joinMessage
      });
      
      // If the team is public, it will be added to user's teams automatically
      // Refresh teams data
      const response = await api.get('/teams/my-teams');
      if (response.data && response.data.data) {
        const allTeams = [
          ...(response.data.data?.owned || []),
          ...(response.data.data?.member || [])
        ];
        
        // Calculate progress for all teams
        const teamsWithProgress = await calculateTeamProjectsProgress(allTeams);
        setTeams(teamsWithProgress);
        
        // Update public teams list
        const userTeamIds = allTeams.map(team => team._id || team.id);
        setPublicTeams(prevPublicTeams => 
          prevPublicTeams.filter(team => !userTeamIds.includes(team._id || team.id))
        );
      }
      
      setSelectedTeam(null);
      setJoinMessage("");
    } catch (error) {
      console.error('Error requesting to join team:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;

    try {
      const response = await api.post('/teams', {
        name: newTeam.name,
        description: newTeam.description,
        isPublic: newTeam.isPublic,
        tags: newTeam.tags
      });

      if (response.data && response.data.data) {
        // Add the new team to the list with initial progress of 0
        const newTeamWithProgress = {
          ...response.data.data,
          projectsProgress: 0
        };
        setTeams(prevTeams => [...prevTeams, newTeamWithProgress]);
      }

      setNewTeam({ name: "", description: "", isPublic: true, tags: [] });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    try {
      await api.delete(`/teams/${teamId}`);
      
      // Remove the team from the list
      setTeams(teams.filter(team => (team._id || team.id) !== teamId));
      
      // Check if any projects need to be updated
      const deletedTeam = teams.find(team => (team._id || team.id) === teamId);
      if (deletedTeam && deletedTeam.projects && deletedTeam.projects.length > 0) {
        // You might want to handle orphaned projects here
        console.log(`Team ${teamId} deleted with ${deletedTeam.projects.length} projects`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-robert-medium text-white">Your Teams</h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all flex items-center gap-2"
        >
          <FiPlus />
          Create Team
        </motion.button>
      </div>

      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
          >
            <form onSubmit={handleCreateTeam}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Team Name</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <label className="block text-white/80 text-sm mb-2">Team Visibility</label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newTeam.isPublic}
                        onChange={() => setNewTeam({ ...newTeam, isPublic: true })}
                        className="mr-2"
                      />
                      <span className="text-white/80">Public</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!newTeam.isPublic}
                        onChange={() => setNewTeam({ ...newTeam, isPublic: false })}
                        className="mr-2"
                      />
                      <span className="text-white/80">Private</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-white/80 text-sm mb-2">Description</label>
                <textarea
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                  placeholder="Describe the purpose of this team"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all"
                >
                  Create Team
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Requests Modal */}
      <AnimatePresence>
        {showJoinRequests && selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-robert-medium text-white mb-4">
                Join Requests for {selectedTeam.name}
              </h3>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner"></div>
                  <p className="text-white/60 mt-4">Loading requests...</p>
                </div>
              ) : joinRequests.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/60">No pending join requests</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {joinRequests.map(request => (
                    <div key={request.user._id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          {request.user.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-white font-robert-medium">{request.user.name}</h4>
                          <p className="text-white/60 text-xs">{request.user.email}</p>
                        </div>
                      </div>
                      
                      {request.message && (
                        <p className="text-white/80 text-sm mb-3 bg-white/5 p-2 rounded">
                          "{request.message}"
                        </p>
                      )}
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleJoinRequest(selectedTeam._id, request.user._id, 'reject')}
                          className="p-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        >
                          <FiX />
                        </button>
                        <button
                          onClick={() => handleJoinRequest(selectedTeam._id, request.user._id, 'accept')}
                          className="p-2 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30"
                        >
                          <FiCheck />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowJoinRequests(false);
                    setSelectedTeam(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Team Modal */}
      <AnimatePresence>
        {selectedTeam && !showJoinRequests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-robert-medium text-white mb-2">
                Join {selectedTeam.name}
              </h3>
              <p className="text-white/60 mb-4">
                {selectedTeam.isPublic 
                  ? "This is a public team. You can join immediately." 
                  : "This is a private team. Your request will need to be approved by a team admin."}
              </p>
              
              {!selectedTeam.isPublic && (
                <div className="mb-4">
                  <label className="block text-white/80 text-sm mb-2">Message (Optional)</label>
                  <textarea
                    value={joinMessage}
                    onChange={(e) => setJoinMessage(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                    placeholder="Introduce yourself and explain why you'd like to join this team"
                  ></textarea>
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setSelectedTeam(null);
                    setJoinMessage("");
                  }}
                  className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => requestToJoinTeam(selectedTeam._id)}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 transition-all"
                >
                  {selectedTeam.isPublic ? "Join Team" : "Send Request"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Team Details View */}
      {viewingTeamDetails && selectedTeamId ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full bg-gray-900 p-6 rounded-xl shadow-lg border border-white/10"
        >
          <TeamDetails 
            key={selectedTeamId} // Add key to force re-render when teamId changes
            teamId={selectedTeamId} 
            onClose={() => {
              console.log('Closing team details view');
              setViewingTeamDetails(false);
              setSelectedTeamId(null);
            }} 
          />
        </motion.div>
      ) : (
        <>
          {/* Your Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <TeamCard 
                key={team._id || team.id} 
                team={team} 
                onEdit={() => onEditTeam(team)} 
                onDelete={() => handleDeleteTeam(team._id || team.id)}
                onViewRequests={() => {
                  setSelectedTeam(team);
                  setShowJoinRequests(true);
                  fetchJoinRequests(team._id);
                }}
                onViewDetails={() => {
                  // Get the team ID
                  const teamId = team._id || team.id;
                  console.log("Setting up team details view for:", teamId);
                  
                  // Scroll to top of the page
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  
                  // Show team details
                  setSelectedTeamId(teamId);
                  setViewingTeamDetails(true);
                  console.log("Team details view should now be visible");
                }}
                navigate={navigate}
                currentUser={user}
              />
            ))}
          </div>

          {/* Public Teams Section */}
          {publicTeams.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-robert-medium text-white mb-6">Public Teams You Can Join</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicTeams.map((team) => (
                  <PublicTeamCard 
                    key={team._id || team.id} 
                    team={team}
                    navigate={navigate}
                    onJoin={() => {
                      setSelectedTeam(team);
                      setJoinMessage("");
                    }}
                    onViewDetails={() => {
                      // Get the team ID
                      const teamId = team._id || team.id;
                      console.log("Setting up team details view for public team:", teamId);
                      
                      // Scroll to top of the page
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      
                      // Show team details
                      setSelectedTeamId(teamId);
                      setViewingTeamDetails(true);
                      console.log("Team details view should now be visible");
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const TeamCard = ({ team, onEdit, onDelete, onViewRequests, onViewDetails, navigate, currentUser }) => {
  const [isHovered, setIsHovered] = useState(false);
  const isOwner = team.owner && (team.owner._id === currentUser?._id || team.owner === currentUser?._id);
  const isAdmin = team.members && team.members.some(member => {
    const memberId = member.user?._id || member.user;
    const memberRole = member.role;
    return memberId === currentUser?._id && (memberRole === 'admin' || memberRole === 'owner');
  });

  const handleButtonClick = (e, callback) => {
    e.stopPropagation();
    e.preventDefault();
    callback();
  };

  // Handle direct navigation to team details
  const handleTeamClick = (e) => {
    console.log('TeamCard clicked:', team.name);
    
    // If a button was clicked, don't do anything (let the button handle its own click)
    if (e.target.closest('button') !== null) {
      console.log('Button clicked, not proceeding with team details view');
      return;
    }
    
    console.log('No button clicked, proceeding with team details view');
    if (onViewDetails) {
      console.log('Using onViewDetails prop');
      onViewDetails();
    } else {
      console.log('Navigating directly to team page');
      navigate(`/teams/${team._id || team.id}`);
    }
  };

  return (
    <div 
      onClick={handleTeamClick}
      className="block no-underline text-inherit cursor-pointer"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300" 
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Team info */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-robert-medium text-white flex items-center gap-2">
              {team.name}
              {team.isPublic !== undefined && (
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
                  {team.isPublic ? (
                    <>
                      <FiGlobe size={12} className="text-green-300" />
                      <span className="text-green-300">Public</span>
                    </>
                  ) : (
                    <>
                      <FiLock size={12} className="text-yellow-300" />
                      <span className="text-yellow-300">Private</span>
                    </>
                  )}
                </span>
              )}
            </h3>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation(); // Prevent event bubbling
                console.log("Eye button clicked directly");
                if (onViewDetails) {
                  onViewDetails();
                }
              }}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-purple-500/20 hover:text-purple-300 transition-all"
              title="View Team Details"
            >
              <FiEye size={16} />
            </motion.button>
            {(isOwner || isAdmin) && !team.isPublic && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => handleButtonClick(e, onViewRequests)}
                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                title="View Join Requests"
              >
                <FiUserPlus size={16} />
              </motion.button>
            )}
            {isOwner && (
              <>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleButtonClick(e, onEdit)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
                >
                  <FiEdit2 size={16} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleButtonClick(e, onDelete)}
                  className="p-2 rounded-full bg-white/10 text-white hover:bg-red-500/20 hover:text-red-300 transition-all"
                >
                  <FiTrash size={16} />
                </motion.button>
              </>
            )}
          </div>
        </div>

        <p className="text-white/70 text-sm mb-6 line-clamp-2">{team.description}</p>

        {/* Team stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white/60 text-sm">
            <FiUsers className="mr-1" />
            <span>{team.members ? team.members.length + 1 : 1} members</span>
          </div>
          <div className="flex items-center text-white/60 text-sm">
            <span className="mr-2">{team.projects ? team.projects.length : 0} projects</span>
            {team.projectsProgress !== undefined && (
              <div className="w-20 h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  style={{ width: `${team.projectsProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Team members */}
        <div className="flex -space-x-2 overflow-hidden">
          {/* Show owner first */}
          {team.owner && (
            <div
              className="w-8 h-8 rounded-full ring-2 ring-black bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold"
              title={`${typeof team.owner === 'object' ? team.owner.name : 'Team Owner'} (owner)`}
            >
              {typeof team.owner === 'object' ? team.owner.name?.charAt(0) : 'O'}
            </div>
          )}
          
          {/* Then show members */}
          {team.members && team.members.map((member, index) => {
            // Handle different member structures from API
            const memberName = member.user ? 
              (typeof member.user === 'object' ? member.user.name : 'User') : 
              (member.name || 'User');
            
            const memberRole = member.role || 'member';
            
            return (
              <div
                key={`${team._id}-member-${typeof member.user === 'object' ? (member.user._id || index) : (member._id || index)}`}
                className="w-8 h-8 rounded-full ring-2 ring-black bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold"
                title={`${memberName} (${memberRole})`}
              >
                {memberName.charAt(0)}
              </div>
            );
          })}
          
          {/* Add member button */}
          {(isOwner || isAdmin) && (
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-8 h-8 rounded-full ring-2 ring-black bg-white/10 flex items-center justify-center text-white text-xs cursor-pointer"
              title="Add Member"
            >
              +
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
    </div>
  );
};

const PublicTeamCard = ({ team, onJoin, navigate, onViewDetails }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Handle join team with stopPropagation
  const handleJoinClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onJoin();
  };

  // Handle direct navigation to team details
  const handleTeamClick = (e) => {
    console.log('PublicTeamCard clicked:', team.name);
    
    // If a button was clicked, don't do anything (let the button handle its own click)
    if (e.target.closest('button') !== null) {
      console.log('Button clicked, not proceeding with team details view');
      return;
    }
    
    console.log('No button clicked, proceeding with team details view');
    if (onViewDetails) {
      console.log('Using onViewDetails prop');
      onViewDetails();
    } else {
      console.log('Navigating directly to team page');
      navigate(`/teams/${team._id || team.id}`);
    }
  };

  return (
    <div 
      onClick={handleTeamClick}
      className="block no-underline text-inherit cursor-pointer"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ y: -5 }}
        transition={{ duration: 0.2 }}
        className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm relative overflow-hidden cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 transition-opacity duration-300" 
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Team info */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-robert-medium text-white flex items-center gap-2">
              {team.name}
              <span className="text-xs px-2 py-1 rounded-full bg-white/10 flex items-center gap-1">
                <FiGlobe size={12} className="text-green-300" />
                <span className="text-green-300">Public</span>
              </span>
            </h3>
          </div>
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log("Public team eye button clicked directly");
                if (onViewDetails) {
                  onViewDetails();
                }
              }}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-purple-500/20 hover:text-purple-300 transition-all"
              title="View Team Details"
            >
              <FiEye size={16} />
            </motion.button>
          </div>
        </div>

        <p className="text-white/70 text-sm mb-6 line-clamp-2">{team.description}</p>

        {/* Team stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white/60 text-sm">
            <FiUsers className="mr-1" />
            <span>{team.members ? team.members.length : 0} members</span>
          </div>
        </div>

        {/* Join button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleJoinClick}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-purple-600/50 to-blue-500/50 text-white hover:from-purple-600/70 hover:to-blue-500/70 transition-all flex items-center justify-center gap-2"
        >
          <FiUserPlus size={16} />
          Join Team
        </motion.button>
      </div>
    </motion.div>
    </div>
  );
};

// Default teams if none are provided
const DEFAULT_TEAMS = [
  {
    id: "1",
    name: "Design Team",
    description: "Responsible for UI/UX design across all products",
    owner: { id: "1", name: "John Doe", avatar: null },
    members: [
      { id: "1", name: "John Doe", role: "owner", avatar: null },
      { id: "2", name: "Sarah Johnson", role: "member", avatar: null },
      { id: "3", name: "Mike Robinson", role: "member", avatar: null }
    ],
    projects: ["1", "3"]
  },
  {
    id: "2",
    name: "Development Team",
    description: "Backend and frontend development team",
    owner: { id: "3", name: "Mike Robinson", avatar: null },
    members: [
      { id: "3", name: "Mike Robinson", role: "owner", avatar: null },
      { id: "1", name: "John Doe", role: "member", avatar: null }
    ],
    projects: ["1", "2"]
  }
];

export default TeamBoard;