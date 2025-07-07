import React from 'react';

const stories = [
  { id: 0, username: 'Your Story', isOwn: true, hasNew: false },
  { id: 1, username: 'alex_dev', hasNew: true },
  { id: 2, username: 'sarah_tech', hasNew: true },
  { id: 3, username: 'mike_coder', hasNew: false },
  { id: 4, username: 'jessica_ui', hasNew: true },
  { id: 5, username: 'david_js', hasNew: false },
  { id: 6, username: 'lisa_pm', hasNew: true },
  { id: 7, username: 'samux', hasNew: false },
];

const StoriesBar = () => (
  <div className="w-full bg-[#181818] rounded-xl p-4 flex items-center gap-4 overflow-x-auto scrollbar-hide mb-6">
    {/* Your Story */}
    <div className="flex flex-col items-center min-w-[60px]">
      <div className="relative w-14 h-14 rounded-full bg-[#222] flex items-center justify-center">
        <span className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">+</span>
      </div>
      <span className="text-xs text-white/70 mt-1">Your Story</span>
    </div>
    {/* Other Stories */}
    {stories.slice(1).map(story => (
      <div key={story.id} className="flex flex-col items-center min-w-[60px]">
        <div className={`relative w-14 h-14 rounded-full ${story.hasNew ? 'ring-2 ring-blue-500 p-[2px]' : ''}`}>
          <div className="w-full h-full rounded-full bg-gray-700" />
        </div>
        <span className="text-xs text-white/70 mt-1 truncate w-14 text-center">{story.username}</span>
      </div>
    ))}
  </div>
);

export default StoriesBar; 