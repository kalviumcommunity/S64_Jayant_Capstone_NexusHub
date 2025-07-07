import React from 'react';
import { useNavigate } from 'react-router-dom';

const teams = [
  { id: 1, name: 'React Ninjas', tagline: 'Frontend Wizards', avatar: '' },
  { id: 2, name: 'AI Pioneers', tagline: 'ML & AI Innovators', avatar: '' },
  { id: 3, name: 'Cloud Masters', tagline: 'Deploy Anything', avatar: '' },
  { id: 4, name: 'UI Artists', tagline: 'Design Pros', avatar: '' },
];

const suggestions = [
  { id: 1, username: 'alex_dev', skill: 'Full Stack', avatar: '' },
  { id: 2, username: 'sarah_tech', skill: 'UI Designer', avatar: '' },
  { id: 3, username: 'david_js', skill: 'Backend', avatar: '' },
  { id: 4, username: 'jessica_ui', skill: 'UX Research', avatar: '' },
];

const RightSidebar = () => {
  const navigate = useNavigate();
  return (
    <aside className="w-full max-w-xs space-y-8">
      {/* Suggested Teams */}
      <div className="bg-[#181818] rounded-xl p-4 border border-[#222]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Suggested Teams</h3>
          <button
            className="text-blue-400 text-xs font-medium hover:text-blue-300 transition px-3 py-1 rounded bg-[#181818] border border-blue-400/30"
            onClick={() => navigate('/explore')}
          >
            View All
          </button>
        </div>
        <div className="space-y-3">
          {teams.map(team => (
            <div key={team.id} className="flex items-center justify-between bg-[#232323] rounded-lg px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700" />
                <div>
                  <div className="text-white text-sm font-medium">{team.name}</div>
                  <div className="text-gray-400 text-xs">{team.tagline}</div>
                </div>
              </div>
              <button className="text-blue-400 text-xs font-medium hover:text-blue-300 transition px-3 py-1 rounded bg-[#181818] border border-blue-400/30">Join</button>
            </div>
          ))}
        </div>
      </div>
      {/* Suggested for You */}
      <div className="bg-[#181818] rounded-xl p-4 border border-[#222]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Suggested for You</h3>
          <button
            className="text-blue-400 text-xs font-medium hover:text-blue-300 transition px-3 py-1 rounded bg-[#181818] border border-blue-400/30"
            onClick={() => navigate('/explore')}
          >
            View All
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {suggestions.map(user => (
            <div key={user.id} className="flex flex-col items-center min-w-[90px] bg-[#232323] rounded-lg px-3 py-3">
              <div className="w-12 h-12 rounded-full bg-gray-700 mb-1" />
              <div className="text-white text-xs font-medium">{user.username}</div>
              <div className="text-gray-400 text-xs mb-1">{user.skill}</div>
              <button className="text-blue-400 text-xs font-medium hover:text-blue-300 transition px-2 py-1 rounded bg-[#181818] border border-blue-400/30">Follow</button>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </aside>
  );
};

export default RightSidebar; 