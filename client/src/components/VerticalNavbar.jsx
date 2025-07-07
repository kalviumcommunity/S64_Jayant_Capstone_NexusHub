import React from 'react';
import { FiHome, FiSearch, FiEdit, FiBell, FiBookmark, FiUser } from 'react-icons/fi';

const navItems = [
  { icon: <FiHome size={24} />, label: 'Home' },
  { icon: <FiSearch size={24} />, label: 'Search' },
  { icon: <FiEdit size={24} />, label: 'Create Post' },
  { icon: <FiBell size={24} />, label: 'Notifications' },
  { icon: <FiBookmark size={24} />, label: 'Saved' },
  { icon: <FiUser size={24} />, label: 'Profile' },
];

const VerticalNavbar = () => (
  <nav className="flex flex-col items-center py-8 gap-6 w-20 min-h-screen bg-gradient-to-b from-purple-700 via-pink-500 to-blue-500 border-r border-[#222] fixed left-0 top-0 z-30 scrollbar-hide" style={{ minHeight: '100vh' }}>
    {/* Logo/placeholder for spacing */}
    <div className="mb-6 mt-2">
      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-purple-500 flex items-center justify-center">
        <span className="font-zentry text-white text-2xl font-bold">N</span>
      </div>
    </div>
    {navItems.map((item, idx) => (
      <button
        key={item.label}
        className="group flex flex-col items-center justify-center w-12 h-12 rounded-full hover:bg-white/10 transition relative text-white"
        title={item.label}
        style={{ marginBottom: idx === navItems.length - 1 ? '0' : '8px' }}
      >
        {item.icon}
        <span className="absolute left-full ml-2 px-2 py-1 rounded bg-[#222] text-xs text-white opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
          {item.label}
        </span>
      </button>
    ))}
  </nav>
);

export default VerticalNavbar; 