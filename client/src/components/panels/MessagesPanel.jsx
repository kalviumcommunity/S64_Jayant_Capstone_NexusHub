import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSearch, FiSend, FiMoreVertical, FiPhone, FiVideo } from 'react-icons/fi';

const MessagesPanel = ({ onClose }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState('');
  
  // Mock conversations data
  const conversations = [
    {
      id: 1,
      user: {
        name: 'Alex Johnson',
        avatar: '/avatars/user1.jpg',
        status: 'online'
      },
      lastMessage: {
        text: 'Hey, how\'s the project going?',
        time: '2m ago',
        unread: true
      }
    },
    {
      id: 2,
      user: {
        name: 'Sarah Miller',
        avatar: '/avatars/user2.jpg',
        status: 'offline'
      },
      lastMessage: {
        text: 'I\'ll send you the design files tomorrow',
        time: '1h ago',
        unread: false
      }
    },
    {
      id: 3,
      user: {
        name: 'David Chen',
        avatar: '/avatars/user3.jpg',
        status: 'online'
      },
      lastMessage: {
        text: 'The meeting is scheduled for 3pm',
        time: '3h ago',
        unread: false
      }
    },
    {
      id: 4,
      user: {
        name: 'Emma Wilson',
        avatar: '/avatars/user4.jpg',
        status: 'away'
      },
      lastMessage: {
        text: 'Thanks for your help with the code review!',
        time: '1d ago',
        unread: false
      }
    }
  ];
  
  // Mock messages for the active conversation
  const messages = [
    {
      id: 1,
      sender: 'them',
      text: 'Hey, how\'s the project going?',
      time: '10:30 AM'
    },
    {
      id: 2,
      sender: 'me',
      text: 'It\'s going well! I\'ve finished the frontend part.',
      time: '10:32 AM'
    },
    {
      id: 3,
      sender: 'them',
      text: 'That\'s great! Any challenges you faced?',
      time: '10:33 AM'
    },
    {
      id: 4,
      sender: 'me',
      text: 'The responsive design was a bit tricky, but I managed to solve it using Flexbox and Grid.',
      time: '10:35 AM'
    },
    {
      id: 5,
      sender: 'them',
      text: 'Nice work! When do you think you\'ll start on the backend?',
      time: '10:36 AM'
    }
  ];
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // In a real app, you would send the message to the backend
    console.log('Sending message:', message);
    setMessage('');
  };
  
  return (
    <motion.div 
      className="fixed right-0 top-0 h-full w-96 bg-[#111] border-l border-[#333] z-30 flex flex-col"
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      <div className="p-4 border-b border-[#333] flex items-center justify-between sticky top-0 bg-[#111] z-10">
        <h2 className="text-xl font-semibold text-white">Messages</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-[#222] transition-colors">
            <FiSearch className="text-white" size={18} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#222] transition-colors"
          >
            <FiX className="text-white" size={20} />
          </button>
        </div>
      </div>

      {activeChat ? (
        // Active chat view
        <div className="flex flex-col h-full">
          {/* Chat header */}
          <div className="p-3 border-b border-[#333] flex items-center justify-between bg-[#1A1A1A]">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveChat(null)}
                className="p-1 rounded-full hover:bg-[#333] transition-colors mr-1"
              >
                <FiX className="text-white" size={16} />
              </button>
              <img 
                src={conversations.find(c => c.id === activeChat)?.user.avatar} 
                alt={conversations.find(c => c.id === activeChat)?.user.name}
                className="w-8 h-8 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/32';
                }}
              />
              <div>
                <p className="text-white font-medium text-sm">
                  {conversations.find(c => c.id === activeChat)?.user.name}
                </p>
                <p className="text-white/50 text-xs">
                  {conversations.find(c => c.id === activeChat)?.user.status === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-full hover:bg-[#333] transition-colors">
                <FiPhone className="text-white/70" size={16} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#333] transition-colors">
                <FiVideo className="text-white/70" size={16} />
              </button>
              <button className="p-2 rounded-full hover:bg-[#333] transition-colors">
                <FiMoreVertical className="text-white/70" size={16} />
              </button>
            </div>
          </div>
          
          {/* Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === 'me' 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 ml-auto' 
                      : 'bg-[#1A1A1A] border border-[#333]'
                  }`}
                >
                  <p className="text-white text-sm">{msg.text}</p>
                  <p className="text-white/40 text-xs mt-1 text-right">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message input */}
          <div className="p-3 border-t border-[#333] bg-[#1A1A1A]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-grow bg-[#222] border border-[#333] rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button 
                type="submit"
                disabled={!message.trim()}
                className={`p-2 rounded-full ${
                  message.trim() 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                    : 'bg-[#333] cursor-not-allowed'
                } transition-colors`}
              >
                <FiSend className="text-white" size={16} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        // Conversations list
        <div className="overflow-y-auto flex-grow">
          {conversations.map((conversation) => (
            <div 
              key={conversation.id}
              onClick={() => setActiveChat(conversation.id)}
              className={`p-3 border-b border-[#222] hover:bg-[#1A1A1A] transition-colors cursor-pointer ${
                conversation.lastMessage.unread ? 'bg-[#1A1A1A]/50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img 
                    src={conversation.user.avatar} 
                    alt={conversation.user.name}
                    className="w-12 h-12 rounded-full object-cover border border-[#333]"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/48';
                    }}
                  />
                  <div 
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#111] ${
                      conversation.user.status === 'online' 
                        ? 'bg-green-500' 
                        : conversation.user.status === 'away' 
                          ? 'bg-yellow-500' 
                          : 'bg-gray-500'
                    }`}
                  ></div>
                </div>
                
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <p className="text-white font-medium">{conversation.user.name}</p>
                    <p className="text-white/40 text-xs">{conversation.lastMessage.time}</p>
                  </div>
                  <p className="text-white/60 text-sm mt-1 line-clamp-1">{conversation.lastMessage.text}</p>
                </div>
                
                {conversation.lastMessage.unread && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MessagesPanel;