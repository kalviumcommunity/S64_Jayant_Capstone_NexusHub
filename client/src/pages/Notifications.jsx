import React, { useState } from 'react';

const dummyNotifications = [
  { id: 1, type: 'like', user: 'Aman', post: 'Your photo', time: '2m ago' },
  { id: 2, type: 'comment', user: 'Priya', post: 'Nice shot!', time: '5m ago' },
  { id: 3, type: 'friend_request', user: 'Rohit', time: '10m ago' },
  { id: 4, type: 'like', user: 'Simran', post: 'Your video', time: '15m ago' },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  const handleAccept = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
    // Optionally show a toast or feedback
  };
  const handleReject = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#181c2f] via-[#1a1836] to-[#1e1b2b] flex flex-col items-center py-10 px-2">
      <h2 className="text-3xl font-bold text-white mb-8">Notifications</h2>
      <div className="w-full max-w-xl space-y-4">
        {notifications.length === 0 && (
          <div className="text-center text-white/60 py-12">No notifications yet.</div>
        )}
        {notifications.map(n => (
          <div key={n.id} className="bg-[#232347] rounded-xl p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                {n.user[0]}
              </div>
              <div>
                <div className="text-white font-medium">
                  {n.type === 'like' && <>{n.user} liked <span className="text-blue-400">{n.post}</span></>}
                  {n.type === 'comment' && <>{n.user} commented: <span className="text-blue-400">"{n.post}"</span></>}
                  {n.type === 'friend_request' && <>{n.user} sent you a friend request</>}
                </div>
                <div className="text-xs text-white/40 mt-1">{n.time}</div>
              </div>
            </div>
            {n.type === 'friend_request' && (
              <div className="flex gap-2">
                <button onClick={() => handleAccept(n.id)} className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Accept</button>
                <button onClick={() => handleReject(n.id)} className="px-3 py-1 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700 transition">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications; 