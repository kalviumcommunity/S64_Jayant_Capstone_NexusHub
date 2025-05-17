import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTask, TaskProvider } from '../context/TaskContext.jsx';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { motion } from 'framer-motion';
import { pageTransition } from '../utils/transitions';
import '../styles/transitions.css';
import KanbanBoard from '../components/KanbanBoard';
import TeamBoard from '../components/TeamBoard';
import TeamDetails from '../components/TeamDetails';
import ProjectDetails from '../components/ProjectDetails';
import api from '../utils/api.js';

// Dashboard Tabs
const TABS = {
  OVERVIEW: 'overview',
  TEAMS: 'teams',
  PROJECTS: 'projects',
  TASKS: 'tasks',
  CREATE_TEAM: 'create-team',
  CREATE_PROJECT: 'create-project'
};

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { 
    projects, 
    tasks, 
    teams, 
    loading: taskLoading, 
    fetchProjects, 
    fetchTeams, 
    fetchProjectTasks,
    setCurrentProject
  } = useTask();
  
  const [activeTab, setActiveTab] = useState(TABS.OVERVIEW);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectFilter, setProjectFilter] = useState('all'); // 'all', 'personal', 'team'
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // Refs for GSAP animations
  const dashboardRef = useRef(null);
  const tabsRef = useRef(null);
  const contentRef = useRef(null);
  
  // Form states for team creation/editing
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    isPublic: true,
    tags: []
  });
  
  // Form states for project creation/editing
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    teamId: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    tags: [],
    isPersonal: false
  });
  
  // State for tracking if we're editing a project
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [selectedProjectForEdit, setSelectedProjectForEdit] = useState(null);
  
  // State for viewing project details
  const [viewingProjectDetails, setViewingProjectDetails] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  
  // Task progress data for chart
  const [taskProgress, setTaskProgress] = useState({
    completed: 0,
    inProgress: 0,
    todo: 0,
    review: 0
  });
  
  // Load data from backend
  useEffect(() => {
    if (user) {
      // Fetch projects, teams, and all tasks
      const loadData = async () => {
        try {
          console.log('Loading projects and teams for user:', user.name);
          await fetchProjects();
          await fetchTeams();
          console.log('Data loaded successfully');
        } catch (error) {
          console.error('Error loading dashboard data:', error);
        }
      };
      
      loadData();
    }
  }, [user]);
  
  // Set up the first project when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      const projectId = projects[0]._id || projects[0].id;
      console.log('Setting initial project:', projectId);
      setSelectedProject(projectId);
      fetchProjectTasks(projectId);
      setCurrentProject(projectId);
    }
  }, [projects, selectedProject]);
  
  // Debug log for projects
  useEffect(() => {
    console.log('Projects in Dashboard:', projects.length);
    if (projects.length > 0) {
      console.log('First project:', projects[0]);
    }
    
    // Apply project filtering
    filterProjects(projectFilter);
  }, [projects]);
  
  // Filter projects based on selected filter
  const filterProjects = (filter) => {
    if (!projects || projects.length === 0) {
      setFilteredProjects([]);
      return;
    }
    
    let filtered = [];
    
    switch (filter) {
      case 'personal':
        filtered = projects.filter(project => project.isPersonal === true);
        break;
      case 'team':
        filtered = projects.filter(project => project.isPersonal === false || project.teamId);
        break;
      case 'all':
      default:
        filtered = [...projects];
        break;
    }
    
    setFilteredProjects(filtered);
  };
  
  // Handle project filter change
  useEffect(() => {
    filterProjects(projectFilter);
  }, [projectFilter]);
  
  // Update task progress when tasks change
  useEffect(() => {
    // Calculate task progress for chart
    const progress = {
      completed: 0,
      inProgress: 0,
      todo: 0,
      review: 0
    };
    
    tasks.forEach(task => {
      switch(task.status) {
        case 'completed':
          progress.completed++;
          break;
        case 'in-progress':
          progress.inProgress++;
          break;
        case 'todo':
          progress.todo++;
          break;
        case 'review':
          progress.review++;
          break;
        default:
          break;
      }
    });
    
    setTaskProgress(progress);
  }, [tasks]);
  
  // Handle project selection
  const handleProjectSelect = (projectId) => {
    if (!projectId) return;
    
    setSelectedProject(projectId);
    fetchProjectTasks(projectId);
    setCurrentProject(projectId);
  };
  
  // Handle viewing project details
  const handleViewProjectDetails = (projectId) => {
    if (!projectId) return;
    
    console.log('Viewing project details for:', projectId);
    
    // Set the selected project ID and show project details
    setSelectedProjectId(projectId);
    setViewingProjectDetails(true);
    
    // We don't need to call fetchProjectTasks here as the ProjectDetails component
    // will handle that internally, preventing unnecessary reloads
  };
  
  // GSAP animations
  useGSAP(() => {
    // Initial animations
    const dashboardHeader = document.querySelector('.dashboard-header');
    if (dashboardHeader) {
      gsap.fromTo(
        dashboardHeader,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
      );
    }
    
    // Wait for DOM to update before animating cards
    setTimeout(() => {
      // Get all dashboard cards that are currently in the DOM
      const dashboardCards = document.querySelectorAll('.dashboard-card');
      
      // Only run animation if cards exist
      if (dashboardCards.length > 0) {
        gsap.fromTo(
          dashboardCards,
          { opacity: 0, y: 20, scale: 0.95 },
          { 
            opacity: 1, 
            y: 0, 
            scale: 1, 
            duration: 0.5, 
            stagger: 0.1, 
            ease: 'power2.out' 
          }
        );
      }
    }, 100);
    
    // Tab indicator animation
    const tabIndicator = document.querySelector('.tab-indicator');
    if (tabIndicator && tabsRef.current) {
      const activeTabElement = tabsRef.current.querySelector('.active-tab');
      if (activeTabElement) {
        gsap.to(tabIndicator, {
          width: activeTabElement.offsetWidth,
          x: activeTabElement.offsetLeft,
          duration: 0.3,
          ease: 'power2.inOut'
        });
      }
    }
  }, [activeTab]);
  
  // Handle tab change with animation
  const handleTabChange = (tab) => {
    // Check if contentRef is available
    if (!contentRef.current) {
      // If ref not available, just change the tab without animation
      setActiveTab(tab);
      return;
    }
    
    // First animate out current content
    gsap.to(contentRef.current, {
      opacity: 0,
      y: 20,
      duration: 0.3,
      onComplete: () => {
        setActiveTab(tab);
        
        // If switching to Tasks tab, ensure we have a selected project and tasks
        if (tab === TABS.TASKS) {
          if (projects.length > 0) {
            // If no project is selected, select the first one
            if (!selectedProject) {
              const projectId = projects[0]._id || projects[0].id;
              setSelectedProject(projectId);
              fetchProjectTasks(projectId);
              setCurrentProject(projectId);
            } else {
              // Refresh tasks for the selected project
              fetchProjectTasks(selectedProject);
            }
          }
        }
        
        // If switching to Create Project tab, reset the form
        if (tab === TABS.CREATE_PROJECT && !isEditingProject) {
          setProjectForm({
            title: '',
            description: '',
            teamId: teams.length > 0 ? teams[0]._id : '',
            startDate: new Date().toISOString().split('T')[0],
            dueDate: '',
            tags: []
          });
        }
        
        // Check if contentRef is still available after state update
        if (contentRef.current) {
          // Then animate in new content
          gsap.to(contentRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.3,
            delay: 0.1
          });
        }
      }
    });
  };
  
  const handleCreateTeam = async () => {
    try {
      // Validate form data
      if (!teamForm.name.trim()) {
        alert('Team name is required');
        return;
      }
      
      // Show loading state (you could add a loading state if needed)
      
      // Make API call to create team
      const response = await api.post('/teams', {
        name: teamForm.name,
        description: teamForm.description,
        isPublic: teamForm.isPublic,
        tags: teamForm.tags,
        initialProject: {
          name: `${teamForm.name} Project`,
          description: `Default project for ${teamForm.name} team`
        }
      });
      
      console.log('Team created successfully:', response.data);
      
      // Fetch updated teams from the server
      await fetchTeams();
      
      // Reset form and go back to teams tab
      setTeamForm({
        name: '',
        description: '',
        isPublic: true,
        tags: []
      });
      
      handleTabChange(TABS.TEAMS);
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    }
  };
  
  const handleEditTeam = async () => {
    try {
      // Validate form data
      if (!teamForm.name.trim()) {
        alert('Team name is required');
        return;
      }
      
      if (!selectedTeam || !selectedTeam._id) {
        console.error('No team selected for editing');
        return;
      }
      
      // Make API call to update team
      const response = await api.put(`/teams/${selectedTeam._id}`, {
        name: teamForm.name,
        description: teamForm.description,
        isPublic: teamForm.isPublic,
        tags: teamForm.tags
      });
      
      console.log('Team updated successfully:', response.data);
      
      // Fetch updated teams from the server
      await fetchTeams();
    } catch (error) {
      console.error('Error updating team:', error);
      alert('Failed to update team. Please try again.');
      return;
    }
    
    // Reset form and go back to teams tab
    setTeamForm({
      name: '',
      description: '',
      isPublic: true,
      tags: []
    });
    
    setIsEditing(false);
    setSelectedTeam(null);
    handleTabChange(TABS.TEAMS);
  };
  
  const startEditTeam = (team) => {
    setSelectedTeam(team);
    setTeamForm({
      name: team.name,
      description: team.description,
      isPublic: team.isPublic !== undefined ? team.isPublic : true,
      tags: team.tags || []
    });
    setIsEditing(true);
    handleTabChange(TABS.CREATE_TEAM);
  };
  
  // Handle project creation
  const handleCreateProject = async () => {
    try {
      // Validate form data
      if (!projectForm.title.trim()) {
        alert('Project title is required');
        return;
      }
      
      if (!projectForm.description.trim()) {
        alert('Project description is required');
        return;
      }
      
      // Only require team selection for team projects
      if (!projectForm.isPersonal && !projectForm.teamId) {
        alert('Please select a team for this project');
        return;
      }
      
      // Show loading state (you could add a loading state if needed)
      console.log('Creating project...');
      
      // Make API call to create project
      const response = await api.post('/projects', {
        title: projectForm.title,
        description: projectForm.description,
        teamId: projectForm.isPersonal ? null : projectForm.teamId,
        startDate: projectForm.startDate,
        dueDate: projectForm.dueDate || null,
        tags: projectForm.tags,
        isPersonal: projectForm.isPersonal
      });
      
      console.log('Project created successfully:', response.data);
      
      // Fetch updated projects and teams from the server
      await fetchProjects();
      await fetchTeams();
      
      // Reset form and go back to projects tab
      setProjectForm({
        title: '',
        description: '',
        teamId: '',
        startDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        tags: [],
        isPersonal: false
      });
      
      setIsEditingProject(false);
      setSelectedProjectForEdit(null);
      handleTabChange(TABS.PROJECTS);
      
      // Show success message
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      
      // Show more detailed error message
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to create project: ${error.response.data.message}`);
      } else {
        alert('Failed to create project. Please try again.');
      }
    }
  };
  
  // Start editing a project
  const startEditProject = (project) => {
    setSelectedProjectForEdit(project);
    setProjectForm({
      title: project.title,
      description: project.description,
      teamId: project.teamId || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dueDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : '',
      tags: project.tags || []
    });
    setIsEditingProject(true);
    handleTabChange(TABS.CREATE_PROJECT);
  };
  
  // Show loading state
  if (authLoading || taskLoading) {
    return (
      <div className="flex-center absolute z-[100] h-dvh w-screen overflow-hidden bg-violet-50">
        <div className="three-body">
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
          <div className="three-body__dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="relative min-h-screen w-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
      {/* Background Video */}
      <video className="absolute inset-0 w-full h-full object-cover opacity-30" autoPlay muted loop>
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="dashboard-header flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Welcome, {user?.name || 'User'}
              </h1>
              <p className="text-white/60 font-robert-regular mt-1">
                Here's an overview of your workspace
              </p>
            </div>
          </div>
          
          {/* Dashboard Tabs */}
          <div ref={tabsRef} className="relative mb-8 border-b border-white/10">
            <div className="flex">
              <button 
                onClick={() => handleTabChange(TABS.OVERVIEW)} 
                className={`px-4 py-3 text-sm font-robert-medium transition-colors ${activeTab === TABS.OVERVIEW ? 'text-white active-tab' : 'text-white/60 hover:text-white/80'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => handleTabChange(TABS.TEAMS)} 
                className={`px-4 py-3 text-sm font-robert-medium transition-colors ${activeTab === TABS.TEAMS ? 'text-white active-tab' : 'text-white/60 hover:text-white/80'}`}
              >
                Teams
              </button>
              <button 
                onClick={() => handleTabChange(TABS.PROJECTS)} 
                className={`px-4 py-3 text-sm font-robert-medium transition-colors ${activeTab === TABS.PROJECTS ? 'text-white active-tab' : 'text-white/60 hover:text-white/80'}`}
              >
                Projects
              </button>
              <button 
                onClick={() => handleTabChange(TABS.TASKS)} 
                className={`px-4 py-3 text-sm font-robert-medium transition-colors ${activeTab === TABS.TASKS ? 'text-white active-tab' : 'text-white/60 hover:text-white/80'}`}
              >
                Tasks
              </button>
            </div>
            <div className="tab-indicator absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          </div>

          {/* Dashboard Content */}
          <div ref={contentRef} className="transition-all duration-300">
            {/* Overview Tab */}
            {activeTab === TABS.OVERVIEW && (
              viewingProjectDetails && selectedProjectId ? (
                <ProjectDetails 
                  key={`project-details-overview-${selectedProjectId}`} // Add key to force re-render when project changes
                  projectId={selectedProjectId} 
                  onClose={() => {
                    setViewingProjectDetails(false);
                    setSelectedProjectId(null);
                  }} 
                />
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Projects Section */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-robert-medium text-white">Recent Projects</h2>
                        <button onClick={() => handleTabChange(TABS.TEAMS)} className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                          View All
                        </button>
                      </div>
                    
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project._id || project.id}
                          className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            const projectId = project._id || project.id;
                            handleViewProjectDetails(projectId);
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-white font-robert-medium">{project.title}</h3>
                            <span className={`px-2 py-1 rounded-lg text-xs ${
                              project.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                              project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-yellow-500/20 text-yellow-300'
                            }`}>
                              {project.status.replace('-', ' ')}
                            </span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-white/60 text-xs">{project.progress}% complete</span>
                            <span className="text-white/60 text-xs">5 tasks remaining</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Activity Feed */}
                  <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-2xl font-robert-medium text-white mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/80">
                            <span className="text-purple-400">John Doe</span> commented on <span className="text-blue-400">Design User Interface</span>
                          </p>
                          <p className="text-white/60 text-sm mt-1">
                            "Looking great! I've added some notes on the color scheme."
                          </p>
                          <span className="text-white/40 text-xs mt-2 block">2 hours ago</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-300 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/80">
                            <span className="text-purple-400">You</span> completed <span className="text-blue-400">Implement Authentication</span>
                          </p>
                          <span className="text-white/40 text-xs mt-2 block">5 hours ago</span>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-300 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white/80">
                            <span className="text-purple-400">Sarah Johnson</span> created a new project <span className="text-blue-400">Marketing Website</span>
                          </p>
                          <span className="text-white/40 text-xs mt-2 block">1 day ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tasks Section */}
                <div className="space-y-6">
                  <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-robert-medium text-white">My Tasks</h2>
                      <button onClick={() => handleTabChange(TABS.TASKS)} className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                        View All
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {tasks.slice(0, 3).map((task) => (
                        <div
                          key={task._id || task.id}
                          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              task.status === 'completed' ? 'bg-green-500' :
                              task.status === 'in-progress' ? 'bg-blue-500' :
                              task.status === 'review' ? 'bg-yellow-500' :
                              'bg-gray-500'
                            }`}></div>
                            <h4 className="text-white font-robert-regular">{task.title}</h4>
                          </div>
                          <div className="flex justify-between mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-lg ${
                              task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-green-500/20 text-green-300'
                            }`}>
                              {task.priority}
                            </span>
                            <span className="text-white/60">Due: {task.dueDate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Task Progress */}
                  <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h2 className="text-2xl font-robert-medium text-white mb-6">Task Progress</h2>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <div className="text-3xl font-robert-medium text-green-400 mb-1">{taskProgress.completed}</div>
                          <div className="text-white/60 text-sm">Completed</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <div className="text-3xl font-robert-medium text-blue-400 mb-1">{taskProgress.inProgress}</div>
                          <div className="text-white/60 text-sm">In Progress</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <div className="text-3xl font-robert-medium text-gray-400 mb-1">{taskProgress.todo}</div>
                          <div className="text-white/60 text-sm">To Do</div>
                        </div>
                        <div className="p-4 rounded-xl bg-white/5 text-center">
                          <div className="text-3xl font-robert-medium text-yellow-400 mb-1">{taskProgress.review}</div>
                          <div className="text-white/60 text-sm">In Review</div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex w-full h-4 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500" 
                            style={{ width: `${(taskProgress.completed / tasks.length) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-blue-500" 
                            style={{ width: `${(taskProgress.inProgress / tasks.length) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-yellow-500" 
                            style={{ width: `${(taskProgress.review / tasks.length) * 100}%` }}
                          ></div>
                          <div 
                            className="bg-gray-500" 
                            style={{ width: `${(taskProgress.todo / tasks.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Team Members */}
                  <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-robert-medium text-white">Team</h2>
                      <button onClick={() => handleTabChange(TABS.TEAMS)} className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                          JD
                        </div>
                        <div>
                          <h4 className="text-white font-robert-medium">John Doe</h4>
                          <p className="text-white/60 text-xs">UI/UX Designer</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold">
                          SJ
                        </div>
                        <div>
                          <h4 className="text-white font-robert-medium">Sarah Johnson</h4>
                          <p className="text-white/60 text-xs">Project Manager</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                          MR
                        </div>
                        <div>
                          <h4 className="text-white font-robert-medium">Mike Robinson</h4>
                          <p className="text-white/60 text-xs">Backend Developer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Teams Tab */}
            {activeTab === TABS.TEAMS && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <TeamBoard 
                  initialTeams={teams} 
                  onEditTeam={startEditTeam}
                />
                
                {teams.length === 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="dashboard-card p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center mt-8"
                  >
                    <div className="text-white/60 mb-4">You have no teams yet</div>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditing(false);
                        setSelectedTeam(null);
                        setTeamForm({
                          name: '',
                          description: '',
                          isPublic: true,
                          tags: []
                        });
                        handleTabChange(TABS.CREATE_TEAM);
                      }}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
                    >
                      Create Your First Team
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            )}
            
            {/* Projects Tab */}
            {activeTab === TABS.PROJECTS && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {viewingProjectDetails && selectedProjectId ? (
                  <ProjectDetails 
                    key={`project-details-${selectedProjectId}`} // Add key to force re-render when project changes
                    projectId={selectedProjectId} 
                    onClose={() => {
                      setViewingProjectDetails(false);
                      setSelectedProjectId(null);
                    }} 
                  />
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-robert-medium text-white">Project Management</h2>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
                        onClick={() => handleTabChange(TABS.CREATE_PROJECT)}
                      >
                        Create Project
                      </motion.button>
                    </div>
                    
                    {/* Project Filters */}
                    <div className="dashboard-card p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                      <div className="flex flex-wrap gap-2">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setProjectFilter('all')}
                          className={`px-3 py-1.5 rounded-lg ${
                            projectFilter === 'all' 
                              ? 'bg-white/10 text-white' 
                              : 'bg-white/5 text-white/70'
                          } text-sm hover:bg-white/20 hover:text-white transition-colors`}
                        >
                          All Projects
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setProjectFilter('personal')}
                          className={`px-3 py-1.5 rounded-lg ${
                            projectFilter === 'personal' 
                              ? 'bg-white/10 text-white' 
                              : 'bg-white/5 text-white/70'
                          } text-sm hover:bg-white/10 hover:text-white transition-colors`}
                        >
                          My Projects
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setProjectFilter('team')}
                          className={`px-3 py-1.5 rounded-lg ${
                            projectFilter === 'team' 
                              ? 'bg-white/10 text-white' 
                              : 'bg-white/5 text-white/70'
                          } text-sm hover:bg-white/10 hover:text-white transition-colors`}
                        >
                          Team Projects
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Projects Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.length > 0 ? (
                        filteredProjects.map((project) => {
                          const projectId = project._id || project.id;
                          return (
                            <motion.div
                              key={projectId}
                              whileHover={{ y: -5 }}
                              className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                handleViewProjectDetails(projectId);
                              }}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <h3 className="text-xl font-robert-medium text-white">{project.title}</h3>
                                  {project.isPersonal !== undefined && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60 mt-1 inline-block">
                                      {project.isPersonal ? 'Personal Project' : 'Team Project'}
                                    </span>
                                  )}
                                </div>
                                <div 
                                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent triggering the parent onClick
                                    handleViewProjectDetails(projectId);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent card click
                                      startEditProject(project);
                                    }}
                                    className="p-1.5 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              
                              <p className="text-white/60 text-sm mb-4 line-clamp-2">{project.description}</p>
                              
                              <div className="flex justify-between items-center mb-3">
                                <div className="text-xs text-white/60">
                                  <span>Created: {new Date(project.createdAt || Date.now()).toLocaleDateString()}</span>
                                </div>
                                <span className={`px-2 py-1 rounded-lg text-xs ${
                                  project.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                  project.status === 'in-progress' ? 'bg-blue-500/20 text-blue-300' :
                                  project.status === 'planning' ? 'bg-purple-500/20 text-purple-300' :
                                  'bg-yellow-500/20 text-yellow-300'
                                }`}>
                                  {project.status ? project.status.replace('-', ' ') : 'Planning'}
                                </span>
                              </div>
                              
                              {/* Progress bar with shimmer effect */}
                              <div className="w-full bg-white/10 rounded-full h-2 mb-2 overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full relative"
                                  style={{ width: `${project.progress || 0}%` }}
                                >
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 w-full h-full shimmer-effect"></div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between mt-2 mb-4">
                                <span className="text-white/60 text-xs">{project.progress || 0}% complete</span>
                                <span className="text-white/60 text-xs">
                                  {project.completedTasks || 0}/{project.totalTasks || 0} tasks
                                </span>
                              </div>
                              
                              {/* Team members */}
                              <div className="flex justify-between items-center mt-4">
                                <div className="flex -space-x-2">
                                  {project.team && project.team.slice(0, 3).map((member, index) => {
                                    // Create a more unique key using member ID if available, or fallback to index
                                    const memberId = member.user?._id || member.user?.id || member._id || member.id;
                                    const uniqueKey = memberId ? `${projectId}-member-${memberId}` : `${projectId}-member-${index}`;
                                    
                                    return (
                                      <div 
                                        key={uniqueKey} 
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 border-2 border-gray-800 flex items-center justify-center text-white text-xs font-bold"
                                      >
                                        {member.user?.name?.charAt(0) || 'U'}
                                      </div>
                                    );
                                  })}
                                  {project.team && project.team.length > 3 && (
                                    <div 
                                      key={`${projectId}-member-more`}
                                      className="w-8 h-8 rounded-full bg-white/10 border-2 border-gray-800 flex items-center justify-center text-white text-xs"
                                    >
                                      +{project.team.length - 3}
                                    </div>
                                  )}
                                </div>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    setSelectedProject(projectId);
                                    handleTabChange(TABS.TASKS);
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs hover:bg-white/20 hover:text-white transition-colors"
                                >
                                  View Tasks
                                </button>
                              </div>
                            </motion.div>
                          );
                        })
                      ) : (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="col-span-3 text-center py-12"
                        >
                          <div className="text-white/40 text-lg mb-4">No projects found</div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
                            onClick={() => handleTabChange(TABS.CREATE_PROJECT)}
                          >
                            Create Your First Project
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </>
                )}
              </motion.div>
            )}
            
            {/* Create Project Tab */}
            {activeTab === TABS.CREATE_PROJECT && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-robert-medium text-white">
                    {isEditingProject ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg bg-white/10 text-white/70 font-robert-medium hover:bg-white/20 hover:text-white transition-all"
                    onClick={() => handleTabChange(TABS.PROJECTS)}
                  >
                    Cancel
                  </motion.button>
                </div>
                
                <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <form onSubmit={(e) => { e.preventDefault(); handleCreateProject(); }}>
                    <div className="mb-4">
                      <label className="block text-white/70 text-sm mb-2">Project Title</label>
                      <input 
                        type="text" 
                        value={projectForm.title}
                        onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Enter project title"
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-white/70 text-sm mb-2">Description</label>
                      <textarea 
                        value={projectForm.description}
                        onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Enter project description"
                        rows={4}
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-white/70 text-sm mb-2">Project Type</label>
                      <div className="flex items-center space-x-4 mb-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={projectForm.isPersonal}
                            onChange={() => setProjectForm({...projectForm, isPersonal: true, teamId: ''})}
                            className="mr-2"
                          />
                          <span className="text-white/80">Personal Project</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            checked={!projectForm.isPersonal}
                            onChange={() => setProjectForm({...projectForm, isPersonal: false})}
                            className="mr-2"
                          />
                          <span className="text-white/80">Team Project</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-white/70 text-sm mb-2">Select Team</label>
                      <select 
                        value={projectForm.teamId}
                        onChange={(e) => setProjectForm({...projectForm, teamId: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Select a team</option>
                        {/* Only show teams where the user is an owner */}
                        {teams.filter(team => {
                          // Check if user is the owner
                          const isOwner = team.owner?._id === user?._id;
                          // Or check if user has owner role in the team
                          const hasOwnerRole = team.members?.some(
                            member => member.user?._id === user?._id && member.role === 'owner'
                          );
                          return isOwner || hasOwnerRole;
                        }).map(team => (
                          <option key={team._id} value={team._id}>
                            {team.name}
                          </option>
                        ))}
                      </select>
                      {teams.length === 0 && (
                        <p className="text-yellow-400 text-xs mt-2">
                          You need to create a team first before creating a project.
                        </p>
                      )}
                      {teams.length > 0 && !teams.some(team => 
                        team.owner?._id === user?._id || 
                        team.members?.some(member => member.user?._id === user?._id && member.role === 'owner')
                      ) && (
                        <p className="text-yellow-400 text-xs mt-2">
                          You need to be a team owner to create projects.
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Start Date</label>
                        <input 
                          type="date" 
                          value={projectForm.startDate}
                          onChange={(e) => setProjectForm({...projectForm, startDate: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-white/70 text-sm mb-2">Due Date (Optional)</label>
                        <input 
                          type="date" 
                          value={projectForm.dueDate}
                          onChange={(e) => setProjectForm({...projectForm, dueDate: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label className="block text-white/70 text-sm mb-2">Tags (Optional)</label>
                      <input 
                        type="text" 
                        value={projectForm.tags.join(', ')}
                        onChange={(e) => {
                          const tagsString = e.target.value;
                          const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag);
                          setProjectForm({...projectForm, tags: tagsArray});
                        }}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Enter tags separated by commas"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="submit"
                        className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
                        disabled={!projectForm.teamId || teams.length === 0}
                      >
                        {isEditingProject ? 'Update Project' : 'Create Project'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
            
            {/* Tasks Tab */}
            {activeTab === TABS.TASKS && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-robert-medium text-white">Task Management</h2>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all ${
                      !selectedProject ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={() => {
                      if (selectedProject) {
                        // Scroll to the Kanban board where tasks can be added
                        document.querySelector('.kanban-container')?.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'center'
                        });
                      }
                    }}
                    disabled={!selectedProject}
                  >
                    Create Task
                  </motion.button>
                </div>
                
                {/* Task Filters */}
                <div className="dashboard-card p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
                  <div className="flex flex-wrap gap-2">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                    >
                      All Tasks
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      In Progress
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 text-sm hover:bg-green-500/30 transition-colors"
                    >
                      Completed
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 text-sm hover:bg-yellow-500/30 transition-colors"
                    >
                      Review
                    </motion.button>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 text-sm hover:bg-gray-500/30 transition-colors"
                    >
                      To Do
                    </motion.button>
                  </div>
                </div>
                
                {/* Project Selector */}
                <div className="mb-6">
                  <label className="text-white/70 text-sm mb-2 block">Select Project:</label>
                  {projects.length > 0 ? (
                    <select 
                      className="w-full md:w-64 bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      value={selectedProject || ''}
                      onChange={(e) => handleProjectSelect(e.target.value)}
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(project => {
                        const projectId = project._id || project.id;
                        return (
                          <option key={projectId} value={projectId}>
                            {project.title}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="flex items-center gap-4">
                      <p className="text-white/60">No projects found</p>
                      <button 
                        className="px-3 py-1 rounded-lg bg-violet-500 text-white text-sm hover:bg-violet-600 transition-colors"
                        onClick={() => {
                          // This would typically open a modal to create a project
                          alert('Create project functionality would go here');
                        }}
                      >
                        Create Project
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Modern Kanban Board */}
                <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-x-auto">
                  {selectedProject ? (
                    <KanbanBoard 
                      initialTasks={tasks} 
                      projectId={selectedProject} 
                    />
                  ) : (
                    <div className="text-center py-10 text-white/60">
                      Please select a project to view tasks
                    </div>
                  )}
                </div>
                
                {/* Task Insights */}
                <div className="mt-8">
                  <h3 className="text-xl font-robert-medium text-white mb-4">Task Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <h4 className="text-white/60 text-sm mb-1">Total Tasks</h4>
                      <p className="text-3xl font-robert-medium text-white">{tasks.length}</p>
                      <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <h4 className="text-yellow-300/60 text-sm mb-1">To Do</h4>
                      <p className="text-3xl font-robert-medium text-yellow-300">
                        {taskProgress.todo}
                      </p>
                      <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" 
                          style={{ width: `${tasks.length > 0 ? (taskProgress.todo / tasks.length) * 100 : 0}%` }}>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <h4 className="text-blue-300/60 text-sm mb-1">In Progress</h4>
                      <p className="text-3xl font-robert-medium text-blue-300">
                        {taskProgress.inProgress}
                      </p>
                      <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${tasks.length > 0 ? (taskProgress.inProgress / tasks.length) * 100 : 0}%` }}>
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      whileHover={{ y: -5 }}
                      className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                    >
                      <h4 className="text-green-300/60 text-sm mb-1">Completed</h4>
                      <p className="text-3xl font-robert-medium text-green-300">
                        {taskProgress.completed}
                      </p>
                      <div className="mt-2 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" 
                          style={{ width: `${tasks.length > 0 ? (taskProgress.completed / tasks.length) * 100 : 0}%` }}>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Create/Edit Team Tab */}
            {activeTab === TABS.CREATE_TEAM && (
              <div className="dashboard-card p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h2 className="text-2xl font-robert-medium text-white mb-6">
                  {isEditing ? 'Edit Team' : 'Create New Team'}
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Team Name</label>
                    <input 
                      type="text" 
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({...teamForm, name: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Enter team name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Description</label>
                    <textarea 
                      value={teamForm.description}
                      onChange={(e) => setTeamForm({...teamForm, description: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500 min-h-[100px]"
                      placeholder="Describe the purpose of this team"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-white/80 text-sm mb-2">Team Visibility</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          checked={teamForm.isPublic} 
                          onChange={() => setTeamForm({...teamForm, isPublic: true})}
                          className="mr-2"
                        />
                        <span className="text-white/80">Public</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="radio" 
                          checked={!teamForm.isPublic} 
                          onChange={() => setTeamForm({...teamForm, isPublic: false})}
                          className="mr-2"
                        />
                        <span className="text-white/80">Private</span>
                      </label>
                    </div>
                    <p className="text-white/60 text-xs mt-1">
                      {teamForm.isPublic 
                        ? 'Public teams can be discovered by other users' 
                        : 'Private teams are only visible to members'}
                    </p>
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button 
                      onClick={() => handleTabChange(TABS.TEAMS)} 
                      className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={isEditing ? handleEditTeam : handleCreateTeam} 
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all"
                    >
                      {isEditing ? 'Save Changes' : 'Create Team'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transition Loader */}
      <div className="loader"></div>
    </div>
  );
};

export default Dashboard;