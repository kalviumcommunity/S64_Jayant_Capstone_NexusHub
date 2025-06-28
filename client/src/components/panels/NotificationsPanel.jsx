import React from 'react';
import { motion } from 'framer-motion';
import { FiX, FiUser, FiHeart, FiMessageSquare, FiStar } from 'react-icons/fi';

const NotificationsPanel = ({ onClose }) => {
  // Mock notifications data
  const notifications = [
    {
      id: 1,
      type: 'like',
      user: {
        name: 'Sarah Johnson',
        avatar: '/avatars/user1.jpg'
      },
      content: 'liked your post',
      post: 'Building a modern React application with...',
      time: '2 minutes ago',
      read: false
    },
    {
      id: 2,
      type: 'comment',
      user: {
        name: 'Michael Chen',
        avatar: '/avatars/user2.jpg'
      },
      content: 'commented on your post',
      post: 'My experience with Next.js and Tailwind CSS',
      comment: 'Great insights! I\'ve been using this stack for a while now.',
      time: '45 minutes ago',
      read: false
    },
    {
      id: 3,
      type: 'follow',
      user: {
        name: 'Jessica Williams',
        avatar: '/avatars/user3.jpg'
      },
      content: 'started following you',
      time: '2 hours ago',
      read: true
    },
    {
      id: 4,
      type: 'mention',
      user: {
        name: 'David Rodriguez',
        avatar: '/avatars/user4.jpg'
      },
      content: 'mentioned you in a comment',
      comment: 'I think @username would have some great input on this!',
      post: 'Best practices for API design',
      time: '1 day ago',
      read: true
    },
    {
      id: 5,
      type: 'like',
      user: {
        name: 'Emma Thompson',
        avatar: '/avatars/user5.jpg'
      },
      content: 'liked your comment',
      comment: 'I completely agree with your approach to state management.',
      post: 'Redux vs. Context API',
      time: '2 days ago',
      read: true
    }
  ];

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <FiHeart className="text-red-400" />;
      case 'comment':
        return <FiMessageSquare className="text-blue-400" />;
      case 'follow':
        return <FiUser className="text-purple-400" />;
      case 'mention':
        return <FiStar className="text-yellow-400" />;
      default:
        return <FiStar className="text-blue-400" />;
    }
  };

  return (
    <motion.div 
      className="fixed right-0 top-0 h-full w-80 bg-[#111] border-l border-[#333] z-30 overflow-y-auto"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="p-4 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#111] z-10">
        <h2 className="text-xl font-semibold text-white">Notifications</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-[#222] transition-colors"
        >
          <FiX className="text-white" size={20} />
        </button>
      </div>

      <div className="p-2">
        {notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-3 border-b border-[#222] hover:bg-[#1A1A1A] transition-colors ${!notification.read ? 'bg-[#1A1A1A]/50' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img 
                  src={notification.user.avatar} 
                  alt={notification.user.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#333]"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40';
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#222] border border-[#333] flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-grow">
                <p className="text-white text-sm">
                  <span className="font-medium">{notification.user.name}</span>
                  {' '}{notification.content}
                </p>
                
                {notification.post && (
                  <p className="text-white/60 text-sm mt-1 line-clamp-1">
                    "{notification.post}"
                  </p>
                )}
                
                {notification.comment && (
                  <p className="text-white/60 text-sm mt-1 line-clamp-1">
                    "{notification.comment}"
                  </p>
                )}
                
                <p className="text-white/40 text-xs mt-1">{notification.time}</p>
              </div>
              
              {!notification.read && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"></div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default NotificationsPanel;