import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/transitions.css';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Placeholder data for demonstration
  useEffect(() => {
    // In a real app, this would be an API call
    setProjects([
      { id: 1, title: 'NexusHub Platform', status: 'in-progress', progress: 65 },
      { id: 2, title: 'Mobile App Development', status: 'planning', progress: 20 },
      { id: 3, title: 'Marketing Website', status: 'completed', progress: 100 },
    ]);
    
    setTasks([
      { id: 1, title: 'Design User Interface', status: 'in-progress', priority: 'high', dueDate: '2023-06-15' },
      { id: 2, title: 'Implement Authentication', status: 'completed', priority: 'high', dueDate: '2023-06-10' },
      { id: 3, title: 'Create API Documentation', status: 'todo', priority: 'medium', dueDate: '2023-06-20' },
      { id: 4, title: 'Setup CI/CD Pipeline', status: 'review', priority: 'medium', dueDate: '2023-06-18' },
    ]);
    
    // Hide loader
    const loader = document.querySelector(".loader");
    if (loader) {
      loader.style.transform = "translateX(100%)";
    }
  }, []);

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
      <video className="absolute inset-0 w-full h-full object-cover opacity-30" autoPlay muted loop>
        <source src="/videos/NexusCrystal.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Welcome, {user?.name || 'User'}
              </h1>
              <p className="text-white/60 font-robert-regular mt-1">
                Here's an overview of your workspace
              </p>
            </div>
            <div className="flex gap-4 mt-4 md:mt-0">
              <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all">
                Create Project
              </button>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all">
                Add Task
              </button>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Projects Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-robert-medium text-white">Recent Projects</h2>
                  <Link to="/projects" className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                    View All
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
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
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
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
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-robert-medium text-white">My Tasks</h2>
                  <Link to="/tasks" className="text-purple-400 hover:text-purple-300 transition-colors text-sm">
                    View All
                  </Link>
                </div>
                
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
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
              
              {/* Team Members */}
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h2 className="text-2xl font-robert-medium text-white mb-6">Team</h2>
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
                  
                  <button className="w-full py-2 mt-2 rounded-lg border border-dashed border-white/20 text-white/60 hover:bg-white/5 transition-colors text-sm">
                    + Add Team Member
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transition Loader */}
      <div className="loader"></div>
    </div>
  );
};

export default Dashboard;