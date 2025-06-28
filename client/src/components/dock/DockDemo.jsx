import React from 'react';
import Dock from './Dock';
import { 
  FiHome, 
  FiBell, 
  FiSearch, 
  FiEdit, 
  FiUserPlus, 
  FiMessageSquare, 
  FiSettings, 
  FiUser,
  FiCompass,
  FiBookmark
} from 'react-icons/fi';

// Demo component to test the dock functionality
const DockDemo = () => {
  // Demo dock items
  const dockItems = [
    { 
      icon: <FiHome size={22} />, 
      label: 'Home', 
      onClick: () => console.log('Home clicked'),
      notificationCount: 0
    },
    { 
      icon: <FiCompass size={22} />, 
      label: 'Explore', 
      onClick: () => console.log('Explore clicked'),
      notificationCount: 0
    },
    { 
      icon: <FiEdit size={22} />, 
      label: 'Create Post', 
      onClick: () => console.log('Create Post clicked'),
      notificationCount: 0
    },
    { 
      icon: <FiBell size={22} />, 
      label: 'Notifications', 
      onClick: () => console.log('Notifications clicked'),
      notificationCount: 5
    },
    { 
      icon: <FiMessageSquare size={22} />, 
      label: 'Messages', 
      onClick: () => console.log('Messages clicked'),
      notificationCount: 2
    },
    { 
      icon: <FiBookmark size={22} />, 
      label: 'Saved', 
      onClick: () => console.log('Saved clicked'),
      notificationCount: 0
    },
    { 
      icon: <FiUser size={22} />, 
      label: 'Profile', 
      onClick: () => console.log('Profile clicked'),
      notificationCount: 0
    },
    { 
      icon: <FiSettings size={22} />, 
      label: 'Settings', 
      onClick: () => console.log('Settings clicked'),
      notificationCount: 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0A] to-[#1F1F1F] relative">
      {/* Background */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Dock */}
      <Dock 
        items={dockItems}
        panelHeight={400}
        baseItemSize={50}
        magnification={70}
        className="vertical-dock"
        vertical={true}
        spring={{ mass: 0.1, stiffness: 150, damping: 12 }}
        distance={200}
        mobileMode="drawer" // Try changing to "bottom" to test different modes
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 lg:pl-24">
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-8">Dock Component Demo</h1>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Desktop Behavior</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Fixed vertical dock on the left side</li>
                <li>• Hover effects with magnification</li>
                <li>• Smooth animations</li>
                <li>• Tooltip labels on hover</li>
                <li>• Notification badges</li>
              </ul>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Mobile Behavior</h2>
              <ul className="space-y-2 text-gray-300">
                <li>• Hamburger menu in top-left</li>
                <li>• Slide-in drawer navigation</li>
                <li>• Full-screen overlay</li>
                <li>• Touch-friendly item sizes</li>
                <li>• Notification indicators</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Testing Instructions</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Open browser developer tools and toggle device simulation</li>
              <li>Test different screen sizes (mobile, tablet, desktop)</li>
              <li>Verify dock transforms appropriately at 768px breakpoint</li>
              <li>Test hamburger menu functionality on mobile</li>
              <li>Verify smooth animations and transitions</li>
              <li>Check notification badges are visible</li>
              <li>Test keyboard navigation (Tab, Escape)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DockDemo;