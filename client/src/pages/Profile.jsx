import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/transitions.css';

const Profile = () => {
  useEffect(() => {
    // Handle initial loader position
    const loader = document.querySelector(".loader");
    if (loader) {
      loader.style.transform = "translateX(100%)";
    }
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F]">
      {/* Background Video */}
      <video
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        autoPlay
        muted
        loop
      >
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
                <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-sm" />
              </div>
              <div>
                <h1 className="text-4xl font-zentry font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  John Doe
                </h1>
                <p className="text-white/60 font-robert-regular mt-1">
                  Professional Developer
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all">
                Edit Profile
              </button>
              <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white font-robert-medium hover:from-purple-700 hover:to-blue-600 transition-all">
                Share Profile
              </button>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">About</h3>
                <p className="text-white/60 font-robert-regular">
                  Full-stack developer with expertise in React, Node.js, and cloud technologies.
                  Passionate about creating beautiful and functional web applications.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-lg font-robert-medium text-white mb-4">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Node.js', 'TypeScript', 'AWS', 'UI/UX', 'GraphQL'].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-lg bg-white/5 text-white/80 text-sm font-robert-regular"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Center and Right Columns */}
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

      {/* Back Button */}
      <Link
        to="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-robert-medium hover:bg-white/10 transition-all backdrop-blur-sm"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
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