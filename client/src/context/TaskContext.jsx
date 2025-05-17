import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useAuth } from './AuthContext.jsx';

// Create the task context
const TaskContext = createContext();

// Custom hook to use the task context
export const useTask = () => useContext(TaskContext);

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);
  const [userRoles, setUserRoles] = useState({});

  // Fetch user's teams
  const fetchTeams = async () => {
    try {
      // Use the my-teams endpoint to get teams the user is part of
      const response = await api.get('/teams/my-teams');
      
      // Combine owned and member teams
      const allTeams = [
        ...(response.data.data?.owned || []),
        ...(response.data.data?.member || [])
      ];
      
      setTeams(allTeams);
      
      // Build a map of user roles in each team
      const roles = {};
      
      // For owned teams, user is the owner
      if (response.data.data?.owned) {
        response.data.data.owned.forEach(team => {
          roles[team._id] = 'owner';
        });
      }
      
      // For member teams, get the role from the members array
      if (response.data.data?.member) {
        response.data.data.member.forEach(team => {
          const userMember = team.members.find(
            member => member.user._id === user._id || 
                     (member.user && member.user._id === user._id)
          );
          if (userMember) {
            roles[team._id] = userMember.role;
          }
        });
      }
      
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to load teams');
      // Set empty arrays to prevent further errors
      setTeams([]);
    }
  };

  // Fetch user's projects including team projects
  const fetchProjects = async () => {
    try {
      // First fetch user's own projects
      const response = await api.get('/projects');
      
      let userProjects = [];
      
      // Check the structure of the response
      if (response.data && Array.isArray(response.data.projects)) {
        userProjects = response.data.projects;
      } else if (response.data && Array.isArray(response.data.data)) {
        // Alternative structure
        userProjects = response.data.data;
      } else if (response.data && response.data.success) {
        // Another possible structure
        userProjects = response.data.data || [];
      } else {
        // Fallback
        console.warn('Unexpected project data structure:', response.data);
        userProjects = [];
      }
      
      // Now fetch team projects
      const teamResponse = await api.get('/teams/my-teams');
      let teamProjects = [];
      
      // Process team projects from owned teams
      if (teamResponse.data?.data?.owned && Array.isArray(teamResponse.data.data.owned)) {
        for (const team of teamResponse.data.data.owned) {
          // Fetch detailed team info to get projects
          try {
            const teamDetailResponse = await api.get(`/teams/${team._id}`);
            if (teamDetailResponse.data?.data?.projects && Array.isArray(teamDetailResponse.data.data.projects)) {
              teamProjects = [...teamProjects, ...teamDetailResponse.data.data.projects];
            }
          } catch (teamDetailError) {
            console.error(`Error fetching details for team ${team._id}:`, teamDetailError);
          }
        }
      }
      
      // Process team projects from member teams
      if (teamResponse.data?.data?.member && Array.isArray(teamResponse.data.data.member)) {
        for (const team of teamResponse.data.data.member) {
          // Fetch detailed team info to get projects
          try {
            const teamDetailResponse = await api.get(`/teams/${team._id}`);
            if (teamDetailResponse.data?.data?.projects && Array.isArray(teamDetailResponse.data.data.projects)) {
              teamProjects = [...teamProjects, ...teamDetailResponse.data.data.projects];
            }
          } catch (teamDetailError) {
            console.error(`Error fetching details for team ${team._id}:`, teamDetailError);
          }
        }
      }
      
      // Combine user projects and team projects, removing duplicates
      const allProjects = [...userProjects];
      
      // Add team projects that aren't already in user projects
      teamProjects.forEach(teamProject => {
        const projectId = teamProject._id || teamProject.id;
        const exists = allProjects.some(p => (p._id || p.id) === projectId);
        if (!exists) {
          allProjects.push(teamProject);
        }
      });
      
      console.log('All projects loaded:', allProjects.length);
      setProjects(allProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects');
      // Set empty array to prevent further errors
      setProjects([]);
    }
  };

  // Fetch tasks for a specific project
  const fetchProjectTasks = async (projectId) => {
    if (!projectId) {
      console.warn('No project ID provided to fetchProjectTasks');
      return [];
    }
    
    setLoading(true);
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
      
      // Ensure all tasks have proper references to their project
      taskData = taskData.map(task => {
        if (!task.project) {
          return { ...task, project: projectId };
        }
        return task;
      });
      
      setTasks(taskData);
      setCurrentProject(projectId);
      return taskData;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch all tasks for the user (from all projects and teams)
  const fetchAllUserTasks = async () => {
    setLoading(true);
    try {
      // First get all projects
      await fetchProjects();
      
      // Then fetch tasks for each project
      let allTasks = [];
      
      for (const project of projects) {
        const projectId = project._id || project.id;
        if (projectId) {
          try {
            const response = await api.get(`/tasks/project/${projectId}`);
            
            // Handle different response structures
            let projectTasks = [];
            if (response.data && Array.isArray(response.data.tasks)) {
              projectTasks = response.data.tasks;
            } else if (response.data && Array.isArray(response.data.data)) {
              projectTasks = response.data.data;
            } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
              projectTasks = response.data.data;
            }
            
            // Add project reference if missing
            projectTasks = projectTasks.map(task => {
              if (!task.project) {
                return { ...task, project: projectId };
              }
              return task;
            });
            
            allTasks = [...allTasks, ...projectTasks];
          } catch (error) {
            console.error(`Error fetching tasks for project ${projectId}:`, error);
          }
        }
      }
      
      setTasks(allTasks);
      return allTasks;
    } catch (error) {
      console.error('Error fetching all user tasks:', error);
      setError('Failed to load tasks');
      setTasks([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Create a new task
  const createTask = async (projectId, taskData) => {
    if (!projectId) {
      const error = new Error('No project ID provided to createTask');
      console.error(error);
      setError('Failed to create task: No project ID provided');
      throw error;
    }
    
    try {
      // Ensure assignedTo is properly formatted
      if (taskData.assignedTo) {
        // Make sure assignedTo is an array of strings (user IDs)
        if (!Array.isArray(taskData.assignedTo)) {
          taskData.assignedTo = [taskData.assignedTo];
        }
        
        // Filter out any invalid values
        taskData.assignedTo = taskData.assignedTo.filter(id => id && typeof id === 'string');
        
        console.log('Creating task with assignees:', taskData.assignedTo);
      }
      
      const response = await api.post(`/tasks/project/${projectId}`, taskData);
      
      // Handle different response structures
      let newTask = null;
      if (response.data && response.data.task) {
        newTask = response.data.task;
      } else if (response.data && response.data.data) {
        newTask = response.data.data;
      } else if (response.data && response.data.success) {
        newTask = response.data.data || response.data;
      } else {
        console.warn('Unexpected task creation response structure:', response.data);
        newTask = response.data;
      }
      
      // Ensure the task has a project reference
      if (newTask && !newTask.project) {
        newTask.project = projectId;
      }
      
      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to create task';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 403) {
          if (error.response.data?.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage = 'You do not have permission to create this task. Check your project role.';
          }
        } else if (error.response.status === 404) {
          errorMessage = 'Project not found. It may have been deleted.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'An unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Create a more informative error object
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;
      enhancedError.isPermissionError = error.response?.status === 403;
      
      throw enhancedError;
    }
  };

  // Update project progress based on task status
  const updateProjectProgress = async (projectId) => {
    if (!projectId) {
      console.warn('No project ID provided to updateProjectProgress');
      return null;
    }
    
    try {
      // Get all tasks for this project
      const projectTasks = tasks.filter(task => {
        if (!task.project) return false;
        
        const taskProjectId = typeof task.project === 'object'
          ? task.project._id || task.project.id
          : task.project;
          
        return taskProjectId === projectId;
      });
      
      // Calculate progress
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(task => task.status === 'completed').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Update project in the backend
      try {
        const response = await api.put(`/projects/${projectId}`, {
          progress,
          totalTasks,
          completedTasks
        });
        
        console.log(`Updated project ${projectId} progress to ${progress}%`);
      } catch (apiError) {
        console.error(`API error updating project ${projectId}:`, apiError);
        // Continue with state updates even if API call fails
      }
      
      // Update projects in state
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (!project) return project;
          
          const projectIdToCompare = project._id || project.id;
          if (projectIdToCompare === projectId) {
            return {
              ...project,
              progress,
              totalTasks,
              completedTasks
            };
          }
          return project;
        })
      );
      
      return { progress, totalTasks, completedTasks };
    } catch (error) {
      console.error('Error updating project progress:', error);
      return null;
    }
  };

  // Update a task
  const updateTask = async (taskId, taskData) => {
    if (!taskId) {
      const error = new Error('No task ID provided to updateTask');
      console.error(error);
      setError('Failed to update task: No task ID provided');
      throw error;
    }
    
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      
      // Handle different response structures
      let updatedTask = null;
      if (response.data && response.data.task) {
        updatedTask = response.data.task;
      } else if (response.data && response.data.data) {
        updatedTask = response.data.data;
      } else if (response.data && response.data.success) {
        updatedTask = response.data.data || response.data;
      } else {
        console.warn('Unexpected task update response structure:', response.data);
        updatedTask = response.data;
      }
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? updatedTask : task
        )
      );
      
      // If task status changed to completed or from completed, update project progress
      if (taskData.status && updatedTask.project) {
        try {
          const projectId = typeof updatedTask.project === 'object'
            ? updatedTask.project._id || updatedTask.project.id
            : updatedTask.project;
          
          if (projectId) {
            await updateProjectProgress(projectId);
          } else {
            console.warn('Invalid project ID found in updated task');
          }
        } catch (progressError) {
          console.error('Error updating project progress after task update:', progressError);
          // Continue execution even if progress update fails
        }
      }
      
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      setError(error.response?.data?.message || 'Failed to update task');
      throw error;
    }
  };

  // Delete a task
  const deleteTask = async (taskId) => {
    if (!taskId) {
      const error = new Error('No task ID provided to deleteTask');
      console.error(error);
      setError('Failed to delete task: No task ID provided');
      throw error;
    }
    
    try {
      await api.delete(`/tasks/${taskId}`);
      // Filter tasks using both _id and id to handle different formats
      setTasks(prevTasks => prevTasks.filter(task => {
        // Keep task only if neither ID matches the taskId to delete
        const taskIdMatches = task._id === taskId || task.id === taskId;
        return !taskIdMatches;
      }));
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Extract the most useful error message
      let errorMessage = 'Failed to delete task';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 403) {
          errorMessage = 'You do not have permission to delete this task. Only project owners and admins can delete tasks.';
        } else if (error.response.status === 404) {
          errorMessage = 'Task not found. It may have been already deleted.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage = error.message || 'An unknown error occurred';
      }
      
      setError(errorMessage);
      
      // Create a more informative error object
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      enhancedError.status = error.response?.status;
      enhancedError.isPermissionError = error.response?.status === 403;
      
      throw enhancedError;
    }
  };

  // Check if user can edit a task
  const canEditTask = (task) => {
    if (!task || !user) return false;
    
    try {
      // User is the creator of the task
      if (task.createdBy && task.createdBy._id === user._id) return true;
      
      // Check project role
      if (task.project) {
        const project = projects.find(p => p._id === task.project);
        if (project && project.team) {
          // Handle different team structures
          const teamMembers = Array.isArray(project.team) ? project.team : [];
          
          // Find the user's role in the team
          const userMember = teamMembers.find(member => {
            const memberId = member.user?._id || member.user;
            return memberId === user._id;
          });
          
          if (userMember && ['owner', 'admin'].includes(userMember.role)) {
            return true;
          }
        }
      }
      
      // Check team roles from userRoles
      if (task.team && userRoles[task.team]) {
        const role = userRoles[task.team];
        if (['owner', 'admin'].includes(role)) {
          return true;
        }
      }
    } catch (error) {
      console.error('Error in canEditTask:', error);
    }
    
    return false;
  };

  // Check if user can manage a task (update status)
  const canManageTask = (task) => {
    if (!task || !user) return false;
    
    try {
      // User is assigned to the task
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        const isAssigned = task.assignedTo.some(assignee => {
          const assigneeId = assignee._id || assignee;
          return assigneeId === user._id;
        });
        
        if (isAssigned) return true;
      }
      
      // User can edit the task
      if (canEditTask(task)) return true;
    } catch (error) {
      console.error('Error in canManageTask:', error);
    }
    
    return false;
  };

  // Load initial data
  useEffect(() => {
    if (user) {
      const loadInitialData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchTeams(), fetchProjects()]);
        } catch (error) {
          console.error('Error loading initial data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadInitialData();
    } else {
      // Reset state when user logs out
      setTasks([]);
      setProjects([]);
      setTeams([]);
      setCurrentProject(null);
      setUserRoles({});
    }
    // We're intentionally only running this when the user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Context value
  const value = {
    tasks,
    projects,
    teams,
    loading,
    error,
    currentProject,
    userRoles,
    fetchProjects,
    fetchTeams,
    fetchProjectTasks,
    fetchAllUserTasks,
    createTask,
    updateTask,
    deleteTask,
    updateProjectProgress,
    canEditTask,
    canManageTask,
    setCurrentProject
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export default TaskContext;