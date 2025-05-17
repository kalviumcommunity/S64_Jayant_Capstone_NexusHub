import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUsers, FiCalendar, FiCheckCircle, FiClock, FiTag, FiAlertCircle, FiActivity } from 'react-icons/fi';
import api from '../utils/api.js';
import ActivityFeed from './ActivityFeed';

const ProjectDetails = ({ projectId, onClose }) => {
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [taskStats, setTaskStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    review: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  });

  // We'll use our own task fetching function instead of the context one
  // to avoid affecting the dashboard state
  
  // Function to fetch tasks directly without using context
  const fetchProjectTasksDirectly = async (projectId) => {
    try {
      const response = await api.get(`/tasks/project/${projectId}`);
      
      // Handle different response structures
      let taskData = [];
      if (response.data && Array.isArray(response.data.tasks)) {
        taskData = response.data.tasks;
      } else if (response.data && Array.isArray(response.data.data)) {
        taskData = response.data.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        taskData = response.data.data;
      } else {
        console.warn('Unexpected task data structure:', response.data);
      }
      
      return taskData;
    } catch (error) {
      console.error('Error fetching tasks directly:', error);
      return [];
    }
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      setLoading(true);
      setError(null); // Reset error state
      
      try {
        console.log('Fetching project details for ID:', projectId);
        
        // Fetch project details
        const projectResponse = await api.get(`/projects/${projectId}`);
        console.log('Project response:', projectResponse);
        
        if (projectResponse.data && (projectResponse.data.data || projectResponse.data.project)) {
          const projectData = projectResponse.data.data || projectResponse.data.project;
          console.log('Project data:', projectData);
          setProject(projectData);
          
          // Fetch tasks for this project directly
          console.log('Fetching tasks directly for project:', projectId);
          const projectTasks = await fetchProjectTasksDirectly(projectId);
          console.log('Project tasks:', projectTasks);
          setTasks(Array.isArray(projectTasks) ? projectTasks : []);
          
          // Calculate task statistics
          const stats = {
            total: projectTasks.length,
            completed: projectTasks.filter(task => task.status === 'completed').length,
            inProgress: projectTasks.filter(task => task.status === 'in-progress').length,
            todo: projectTasks.filter(task => task.status === 'todo').length,
            review: projectTasks.filter(task => task.status === 'review').length,
            highPriority: projectTasks.filter(task => task.priority === 'high' || task.priority === 'urgent').length,
            mediumPriority: projectTasks.filter(task => task.priority === 'medium').length,
            lowPriority: projectTasks.filter(task => task.priority === 'low').length
          };
          setTaskStats(stats);
          
          // Calculate project progress based on tasks
          const progress = projectTasks.length > 0 
            ? Math.round((stats.completed / projectTasks.length) * 100) 
            : 0;
          
          // Update project with progress
          setProject(prev => ({
            ...prev,
            progress,
            totalTasks: projectTasks.length,
            completedTasks: stats.completed
          }));
          
          // If project belongs to a team, fetch team details
          if (projectData.teamId || projectData.team) {
            try {
              // Handle different ways the team might be referenced
              const teamId = typeof projectData.teamId === 'object' 
                ? projectData.teamId._id 
                : projectData.teamId || 
                  (typeof projectData.team === 'object' ? projectData.team._id : projectData.team);
              
              if (teamId) {
                console.log('Fetching team details for ID:', teamId);
                const teamResponse = await api.get(`/teams/${teamId}`);
                if (teamResponse.data && teamResponse.data.data) {
                  console.log('Team data:', teamResponse.data.data);
                  setTeam(teamResponse.data.data);
                }
              }
            } catch (teamError) {
              console.error('Error fetching team details:', teamError);
              // Don't set the main error state for team fetch issues
            }
          }
        } else {
          console.error('Invalid project data format:', projectResponse.data);
          setError('Project data not found or in unexpected format');
        }
      } catch (error) {
        console.error('Error fetching project details:', error);
        setError('Failed to load project details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (projectId) {
      fetchProjectDetails();
    } else {
      setError('No project ID provided');
      setLoading(false);
    }
  }, [projectId]);

  // Update project progress in the backend - but only when we explicitly want to
  const updateProjectProgress = async () => {
    if (project && project.progress !== undefined && !loading && !error) {
      try {
        console.log('Updating project progress:', {
          projectId,
          progress: project.progress,
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed
        });
        
        await api.put(`/projects/${projectId}`, {
          progress: project.progress,
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed
        });
        
        console.log('Project progress updated successfully');
      } catch (error) {
        console.error('Error updating project progress:', error);
        // Don't set the main error state for progress update issues
        // as it's not critical for viewing the project details
      }
    }
  };
  
  // We'll only update progress when tasks change, not on every render
  useEffect(() => {
    if (project && !loading && tasks.length > 0) {
      // We don't need to update progress on every view, only when tasks change
      // updateProjectProgress();
    }
  }, [tasks.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-12">
        <div className="three-body mb-4">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
        <p className="text-white/70 text-center">Loading project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="text-red-400 mb-2 text-5xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-robert-medium text-white mb-2">Error Loading Project</h3>
        <p className="text-red-400 mb-4">{error}</p>
        <button 
          onClick={onClose}
          className="mt-2 px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="text-yellow-400 mb-2 text-5xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-robert-medium text-white mb-2">Project Not Found</h3>
        <p className="text-white/60 mb-4">The requested project could not be found or may have been deleted.</p>
        <button 
          onClick={onClose}
          className="mt-2 px-6 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
        >
          Go Back to Dashboard
        </button>
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
      {/* Project Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-robert-medium text-white">{project.title}</h2>
          <p className="text-white/60 mt-1">{project.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-2 py-1 rounded-lg text-xs ${
              project.status === 'completed' ? 'bg-green-500/20 text-green-300' :
              project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
              project.status === 'on-hold' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-purple-500/20 text-purple-300'
            }`}>
              {project.status ? project.status.replace('-', ' ') : 'Planning'}
            </span>
            <span className={`px-2 py-1 rounded-lg text-xs ${
              project.isPersonal ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
            }`}>
              {project.isPersonal ? 'Personal Project' : 'Team Project'}
            </span>
            {project.tags && project.tags.map((tag, index) => (
              <span 
                key={`${project._id || 'project'}-tag-${index}-${tag}`} 
                className="px-2 py-1 rounded-lg text-xs bg-gray-500/20 text-gray-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-white/10 text-white/70 font-robert-medium hover:bg-white/20 hover:text-white transition-all"
        >
          Back to Projects
        </button>
      </div>

      {/* Project Progress */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
        <h3 className="text-xl font-robert-medium text-white mb-4">Project Progress</h3>
        
        <div className="w-full bg-white/10 rounded-full h-4 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full relative"
            style={{ width: `${project.progress || 0}%` }}
          >
            <div className="absolute inset-0 w-full h-full shimmer-effect"></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-white/80 font-robert-medium">{project.progress || 0}% Complete</span>
          <span className="text-white/60">
            {project.completedTasks || 0} of {project.totalTasks || 0} tasks completed
          </span>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
              <FiUsers size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">Team Members</p>
              <h3 className="text-2xl font-robert-medium text-white">
                {project.team ? project.team.length : 0}
              </h3>
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
              <h3 className="text-2xl font-robert-medium text-white">{taskStats.completed}</h3>
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
              <h3 className="text-2xl font-robert-medium text-white">{taskStats.inProgress}</h3>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-300">
              <FiAlertCircle size={20} />
            </div>
            <div>
              <p className="text-white/60 text-sm">High Priority</p>
              <h3 className="text-2xl font-robert-medium text-white">{taskStats.highPriority}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Team Information (if applicable) */}
      {team && (
        <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
          <h3 className="text-xl font-robert-medium text-white mb-4">Team Information</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {team.name.charAt(0)}
            </div>
            <div>
              <h4 className="text-lg font-robert-medium text-white">{team.name}</h4>
              <p className="text-white/60 text-sm mt-1">{team.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded-lg text-xs ${
                  team.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                }`}>
                  {team.isPublic ? 'Public Team' : 'Private Team'}
                </span>
                <span className="text-white/60 text-xs">
                  {team.members ? team.members.length + 1 : 1} members
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Timeline */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
        <h3 className="text-xl font-robert-medium text-white mb-4">Project Timeline</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-white/60" />
            <span className="text-white/80">Start Date:</span>
          </div>
          <span className="text-white">
            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <FiCalendar className="text-white/60" />
            <span className="text-white/80">Due Date:</span>
          </div>
          <span className="text-white">
            {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
          </span>
        </div>
      </div>

      {/* Project Activity */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300">
            <FiActivity size={18} />
          </div>
          <h3 className="text-xl font-robert-medium text-white">Project Activity</h3>
        </div>
        
        <ActivityFeed projectId={project._id} />
      </div>
      
      {/* Project Tasks */}
      <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <h3 className="text-xl font-robert-medium text-white mb-4">Tasks</h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/60">No tasks found for this project</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div 
                key={task._id} 
                className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500' :
                      task.status === 'in-progress' ? 'bg-blue-500' :
                      task.status === 'review' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <h4 className="text-white font-robert-medium">{task.title}</h4>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs ${
                    task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {task.priority}
                  </span>
                </div>
                
                <p className="text-white/60 text-sm ml-6 mb-2 line-clamp-2">{task.description}</p>
                
                <div className="flex justify-between items-center ml-6">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-white/40" size={14} />
                    <span className="text-white/60 text-xs">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
                    </span>
                  </div>
                  
                  {task.assignedTo && task.assignedTo.length > 0 && (
                    <div className="flex -space-x-2">
                      {task.assignedTo.slice(0, 3).map((user, index) => {
                        // Create a more unique key using user ID if available, or fallback to index
                        const userId = typeof user === 'object' ? (user._id || user.id) : user;
                        const uniqueKey = userId ? `${task._id}-user-${userId}` : `${task._id}-user-${index}`;
                        
                        return (
                          <div 
                            key={uniqueKey} 
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold"
                          >
                            {typeof user === 'object' ? user.name?.charAt(0) || 'U' : 'U'}
                          </div>
                        );
                      })}
                      {task.assignedTo.length > 3 && (
                        <div 
                          key={`${task._id}-user-more`}
                          className="w-6 h-6 rounded-full bg-white/10 border-2 border-gray-800 flex items-center justify-center text-white text-xs"
                        >
                          +{task.assignedTo.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectDetails;