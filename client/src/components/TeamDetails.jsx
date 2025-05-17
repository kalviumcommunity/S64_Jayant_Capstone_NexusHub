import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiFolder, FiCalendar, FiCheckCircle, FiClock, FiActivity, FiAlertCircle } from 'react-icons/fi';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const TeamDetails = ({ teamId, onClose }) => {
  console.log('TeamDetails component rendered with teamId:', teamId);
  
  const { user } = useAuth();
  const [team, setTeam] = useState(null);
  const [teamProjects, setTeamProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState({
    owner: null,
    admins: [],
    members: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0
  });

  // Fetch team details when component mounts
  useEffect(() => {
    const fetchTeamDetails = async () => {
      if (!teamId) {
        setError('No team ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('Fetching team details for ID:', teamId);
        
        // Simple direct API call
        const response = await api.get(`/teams/${teamId}`);
        console.log('Team API response:', response);
        
        if (response.data && response.data.data) {
          const teamData = response.data.data;
          console.log('Team data received:', teamData);
          
          // Set team data
          setTeam(teamData);
          
          // Process team members
          const members = teamData.members || [];
          const ownerData = teamData.owner || {};
          
          // Ensure we have a valid owner object
          const ownerObject = typeof ownerData === 'object' ? ownerData : { _id: ownerData, name: 'Team Owner' };
          
          // Separate members by role
          const admins = [];
          const regularMembers = [];
          
          members.forEach(member => {
            // Normalize member structure
            let normalizedMember = member;
            
            // If member is just an ID string, convert to object
            if (typeof member === 'string') {
              normalizedMember = { 
                user: { _id: member, name: 'Team Member' }, 
                role: 'member'
              };
            }
            
            // If member.user is just an ID string, convert to object
            if (typeof member.user === 'string') {
              normalizedMember = {
                ...member,
                user: { _id: member.user, name: 'Team Member' }
              };
            }
            
            // Sort by role
            if (normalizedMember.role === 'admin') {
              admins.push(normalizedMember);
            } else {
              regularMembers.push(normalizedMember);
            }
          });
          
          // Update state with categorized members
          setTeamMembers({
            owner: { user: ownerObject, role: 'owner' },
            admins,
            members: regularMembers
          });
          
          // Process projects (simplified)
          const projectsData = teamData.projects || [];
          console.log('Projects data:', projectsData);
          
          if (projectsData.length > 0) {
            // Just set basic project data without fetching details
            const basicProjects = projectsData.map(project => {
              if (typeof project === 'string') {
                return { _id: project, name: 'Project', progress: 0 };
              } else {
                return { ...project, progress: project.progress || 0 };
              }
            });
            
            setTeamProjects(basicProjects);
            
            // Set basic stats
            setStats({
              totalProjects: basicProjects.length,
              completedProjects: basicProjects.filter(p => p.status === 'completed' || p.progress === 100).length,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: 0
            });
          } else {
            setTeamProjects([]);
            setStats({
              totalProjects: 0,
              completedProjects: 0,
              totalTasks: 0,
              completedTasks: 0,
              inProgressTasks: 0,
              pendingTasks: 0
            });
          }
        } else {
          console.error('Invalid team data structure:', response.data);
          setError('Team data not found in the response');
        }
      } catch (error) {
        console.error('Error fetching team details:', error);
        
        if (error.response) {
          if (error.response.status === 403) {
            setError('You do not have permission to access this team.');
          } else if (error.response.status === 404) {
            setError('Team not found. It may have been deleted.');
          } else {
            setError(`Failed to load team details: ${error.response.status} ${error.response.statusText}`);
          }
        } else if (error.request) {
          setError('Network error. Please check your internet connection.');
        } else {
          setError(`Failed to load team details: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamDetails();
  }, [teamId]);

  // Retry fetching team details
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Force re-render by updating state
    setTeam(null);
    setTeamProjects([]);
    setTeamMembers({
      owner: null,
      admins: [],
      members: []
    });
    
    // Re-trigger the useEffect
    setTimeout(() => {
      // This will trigger the useEffect to run again
      setLoading(false);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-12">
        <div className="three-body">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
        <p className="text-white/60 mt-6">Loading team details...</p>
        <p className="text-white/40 text-sm mt-2">This may take a moment</p>
        <button 
          onClick={handleRetry}
          className="mt-6 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex items-center justify-center mb-4">
          <FiAlertCircle size={40} className="text-red-400" />
        </div>
        <p className="text-red-400 mb-2">{error}</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">Team not found</p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-purple-500/20 rounded-lg text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            Try Again
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full"
    >
      {/* Team Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-robert-medium text-white">{team.name}</h2>
          <p className="text-white/60 mt-1">{team.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-lg text-xs ${
              team.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
            }`}>
              {team.isPublic ? 'Public Team' : 'Private Team'}
            </span>
            {team.tags && team.tags.map((tag, index) => (
              <span key={`tag-${index}`} className="px-2 py-1 rounded-lg text-xs bg-purple-500/20 text-purple-300">
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/10 text-white/70 font-robert-medium hover:bg-white/20 hover:text-white transition-all"
        >
          Back to Teams
        </button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
              <FiUsers size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Team Members</p>
              <h3 className="text-2xl font-robert-medium text-white">
                {1 + teamMembers.admins.length + teamMembers.members.length}
              </h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300">
              <FiFolder size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Projects</p>
              <h3 className="text-2xl font-robert-medium text-white">{stats.totalProjects}</h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-300">
              <FiCheckCircle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Completed Tasks</p>
              <h3 className="text-2xl font-robert-medium text-white">{stats.completedTasks}</h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-300">
              <FiClock size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">In Progress</p>
              <h3 className="text-2xl font-robert-medium text-white">{stats.inProgressTasks}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
        <h3 className="text-xl font-robert-medium text-white mb-4">Team Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Owner */}
          {teamMembers.owner && (
            <div key="team-owner" className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                {teamMembers.owner.user?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <h4 className="text-white font-robert-medium">{teamMembers.owner.user?.name || 'Team Owner'}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs bg-purple-500/20 text-purple-300">
                    Owner
                  </span>
                  <span className="text-white/40 text-xs">
                    {teamMembers.owner.joinedAt ? new Date(teamMembers.owner.joinedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Admins */}
          {teamMembers.admins.map((admin, index) => (
            <div key={`team-admin-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                {admin.user?.name?.charAt(0) || 'A'}
              </div>
              <div>
                <h4 className="text-white font-robert-medium">{admin.user?.name || 'Admin'}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs bg-blue-500/20 text-blue-300">
                    Admin
                  </span>
                  <span className="text-white/40 text-xs">
                    {admin.joinedAt ? new Date(admin.joinedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {/* Regular Members */}
          {teamMembers.members.map((member, index) => (
            <div key={`team-member-${index}`} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 flex items-center justify-center text-white font-bold">
                {member.user?.name?.charAt(0) || 'M'}
              </div>
              <div>
                <h4 className="text-white font-robert-medium">{member.user?.name || 'Member'}</h4>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg text-xs bg-white/10 text-white/70">
                    Member
                  </span>
                  <span className="text-white/40 text-xs">
                    {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Projects */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <h3 className="text-xl font-robert-medium text-white mb-4">Team Projects</h3>
        
        {teamProjects.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No projects found for this team</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamProjects.map((project, index) => (
              <div key={`project-${index}`} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <h4 className="text-lg font-robert-medium text-white mb-2">{project.name || 'Project'}</h4>
                <p className="text-white/60 text-sm mb-3 line-clamp-2">{project.description || 'No description available'}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/80 text-sm">Progress</span>
                  <span className="text-white/80 text-sm">{project.progress || 0}%</span>
                </div>
                
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-white/60">
                    <FiCheckCircle className="mr-1" />
                    <span>{project.completedTasks || 0}/{project.totalTasks || 0} tasks</span>
                  </div>
                  
                  <div className="flex items-center text-white/60">
                    <FiCalendar className="mr-1" />
                    <span>
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeamDetails;