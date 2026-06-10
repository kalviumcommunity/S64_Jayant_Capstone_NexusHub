import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/notifications');
        setNotifications(res.data.notifications || []);
      } catch (err) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const handleAccept = async (userId) => {
    setActionLoading(userId);
    setActionSuccess('');
    try {
      await api.post('/users/friend-request/accept', { userId });
      setNotifications(notifications => notifications.filter(n => !(n.type === 'friend_request' && n.from._id === userId)));
      setActionSuccess('Friend request accepted!');
    } catch (err) {
      setActionSuccess('Failed to accept request');
    } finally {
      setActionLoading('');
    }
  };
  const handleReject = async (userId) => {
    setActionLoading(userId);
    setActionSuccess('');
    try {
      await api.post('/users/friend-request/decline', { userId });
      setNotifications(notifications => notifications.filter(n => !(n.type === 'friend_request' && n.from._id === userId)));
      setActionSuccess('Friend request declined!');
    } catch (err) {
      setActionSuccess('Failed to decline request');
    } finally {
      setActionLoading('');
    }
  };

  // Helper to render notification message
  const renderNotification = (n) => {
    if (n.type === 'friend_request') {
      return (
        <>
          <span className="text-white font-medium">{n.from?.name} <span className="text-blue-400">@{n.from?.username}</span> sent you a friend request</span>
          <div className="flex gap-2 mt-2">
            <button onClick={() => handleAccept(n.from._id)} disabled={actionLoading === n.from._id} className="px-3 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60">{actionLoading === n.from._id ? 'Accepting...' : 'Accept'}</button>
            <button onClick={() => handleReject(n.from._id)} disabled={actionLoading === n.from._id} className="px-3 py-1 rounded bg-gray-600 text-white font-semibold hover:bg-gray-700 transition disabled:opacity-60">{actionLoading === n.from._id ? 'Rejecting...' : 'Reject'}</button>
          </div>
        </>
      );
    }
    // Other notification types
    return (
      <span className="text-white font-medium">{n.from?.name || 'Someone'} <span className="text-blue-400">@{n.from?.username || ''}</span> {n.message}</span>
    );
  };

  // Helper to get icon and color
  const getIcon = (type) => {
    switch (type) {
      case 'story_like':
      case 'post_like':
        return <span className="text-pink-400">♥</span>;
      case 'story_comment':
      case 'post_comment':
        return <span className="text-green-400">💬</span>;
      case 'friend_request':
        return <span className="text-yellow-400">👥</span>;
      default:
        return <span className="text-white">🔔</span>;
    }
  };

  // Helper to format time
  const timeAgo = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start px-2" style={{overflowX:'hidden'}}>
      {/* Fixed Background Video */}
      <video
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
        src="https://res.cloudinary.com/dyzfbhol5/video/upload/v1781063941/NexusCrystal_imby9z.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', filter: 'brightness(0.7) blur(1px)' }}
      />
      {/* Overlay for gradient effect */}
      <div className="fixed top-0 left-0 w-full h-full z-10 bg-gradient-to-br from-[#181c2f]/80 via-[#1a1836]/80 to-[#1e1b2b]/90 pointer-events-none" />
      {/* Heading */}
      <div className="relative z-20 w-full flex flex-col items-center" style={{paddingTop: '5.5rem'}}>
        <h2 className="special-font text-4xl font-bold text-white mb-10 tracking-wide drop-shadow-lg">Notifications</h2>
        {/* Loader */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 w-full">
            <div className="loader ease-linear rounded-full border-8 border-t-8 border-[#7c3aed] border-t-[#f472b6] h-16 w-16 mb-4 animate-spin"></div>
            <div className="text-white/80 text-lg font-medium mt-2">Loading notifications...</div>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col gap-8 z-20">
            {notifications.length === 0 ? (
              <div className="col-span-full text-center text-white/60 py-12">No notifications yet.</div>
            ) : (
              notifications.map((n, i) => (
                <div key={i} className={`bg-[#232347] rounded-2xl p-6 flex items-start gap-4 shadow-lg border border-[#2d2d4d]/60 ${!n.read ? 'border-l-4 border-blue-500' : ''}`} style={{backdropFilter:'blur(2px)'}}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl overflow-hidden">
                    {n.from?.profilePicture ? (
                      <img src={n.from.profilePicture} alt={n.from.name} className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      n.from?.name ? n.from.name[0] : 'U'
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-2">{getIcon(n.type)}<span className="text-xs text-white/50">{timeAgo(n.createdAt)}</span></div>
                    {renderNotification(n)}
                  </div>
                </div>
              ))
            )}
            {actionSuccess && <div className="text-green-400 text-center mt-4">{actionSuccess}</div>}
          </div>
        )}
      </div>
      {/* No footer on this page */}
      <style>{`
        .special-font {
          font-family: 'Zentry', 'circular-web', 'robert-medium', 'sans-serif';
          letter-spacing: 0.04em;
        }
        .loader {
          border-top-color: #f472b6;
          border-right-color: #7c3aed;
          border-bottom-color: #7c3aed;
          border-left-color: #f472b6;
        }
      `}</style>
    </div>
  );
};

export default Notifications; 