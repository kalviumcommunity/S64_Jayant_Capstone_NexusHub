import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  FiArrowLeft,
  FiMessageSquare,
  FiSend,
  FiSearch,
  FiUsers,
  FiHash,
  FiRefreshCw,
  FiCircle
} from 'react-icons/fi';
import api from '../utils/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getSocket } from '../utils/socket.js';

const formatTime = (value) => {
  if (!value) {
    return '';
  }

  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return '';
  }
};

const Chat = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const bottomRef = useRef(null);
  const autoOpenKeyRef = useRef('');
  const chatIdParam = searchParams.get('chatId');
  const teamIdParam = searchParams.get('teamId');
  const projectIdParam = searchParams.get('projectId');
  const userIdParam = searchParams.get('userId');

  const selectedChatId = selectedChat?._id;

  const selectedTitle = useMemo(() => {
    if (!selectedChat) {
      return 'Messages';
    }

    if (selectedChat.isGroupChat) {
      return selectedChat.chatName || 'Group Chat';
    }

    const otherUser = (selectedChat.users || []).find((member) => (member?._id || member)?.toString() !== user?._id?.toString());
    return otherUser?.name || otherUser?.username || selectedChat.chatName || 'Direct Chat';
  }, [selectedChat, user]);

  const selectedSubtitle = useMemo(() => {
    if (!selectedChat) {
      return 'Pick a conversation or start a new one.';
    }

    if (selectedChat.teamId) {
      return 'Team group chat';
    }

    if (selectedChat.projectId) {
      return 'Project group chat';
    }

    return selectedChat.isGroupChat ? 'Group conversation' : 'Direct message';
  }, [selectedChat]);

  const loadChats = async () => {
    setLoadingChats(true);
    setError('');

    try {
      const response = await api.get('/chats');
      const chatList = response.data.chats || [];
      setChats(chatList);

      if (!selectedChat && chatList.length > 0 && !chatIdParam && !teamIdParam && !projectIdParam && !userIdParam) {
        setSelectedChat(chatList[0]);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load chats');
      setChats([]);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (chatId) => {
    if (!chatId) {
      return;
    }

    setLoadingMessages(true);

    try {
      const response = await api.get(`/messages/${chatId}`);
      setMessages(response.data.messages || []);
      await api.put(`/messages/${chatId}/read`);
    } catch (messageError) {
      setError(messageError.response?.data?.message || 'Unable to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const syncChatSelection = (chat) => {
    if (!chat) {
      return;
    }

    const params = new URLSearchParams();
    params.set('chatId', chat._id);

    if (chat.teamId?._id) {
      params.set('teamId', chat.teamId._id);
    }

    if (chat.projectId?._id) {
      params.set('projectId', chat.projectId._id);
    }

    navigate(`/chat?${params.toString()}`, { replace: true });
  };

  const selectChat = async (chat) => {
    if (!chat) {
      return;
    }

    setSelectedChat(chat);
    syncChatSelection(chat);
    await loadMessages(chat._id);
  };

  const refreshChats = async () => {
    await loadChats();
  };

  const openDirectChat = async (targetUserId) => {
    if (!targetUserId) {
      return;
    }

    setError('');

    try {
      const response = await api.post('/chats', { userId: targetUserId });
      const chat = response.data.chat;
      await loadChats();
      setSelectedChat(chat);
      syncChatSelection(chat);
      await loadMessages(chat._id);
      setSearchQuery('');
      setUserResults([]);
    } catch (chatError) {
      setError(chatError.response?.data?.message || 'Unable to open chat');
    }
  };

  const openTeamChat = async (teamId) => {
    if (!teamId) {
      return;
    }

    setError('');

    try {
      const response = await api.post(`/chats/team/${teamId}`);
      const chat = response.data.chat;
      await loadChats();
      setSelectedChat(chat);
      syncChatSelection(chat);
      await loadMessages(chat._id);
    } catch (chatError) {
      setError(chatError.response?.data?.message || 'Unable to open team chat');
    }
  };

  const openProjectChat = async (projectId) => {
    if (!projectId) {
      return;
    }

    setError('');

    try {
      const response = await api.post(`/chats/project/${projectId}`);
      const chat = response.data.chat;
      await loadChats();
      setSelectedChat(chat);
      syncChatSelection(chat);
      await loadMessages(chat._id);
    } catch (chatError) {
      setError(chatError.response?.data?.message || 'Unable to open project chat');
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!selectedChat || !messageText.trim()) {
      return;
    }

    setSending(true);
    setError('');

    try {
      await api.post('/messages', {
        chatId: selectedChat._id,
        content: messageText.trim(),
        attachments: []
      });

      setMessageText('');
      await loadMessages(selectedChat._id);
      await loadChats();
    } catch (sendError) {
      setError(sendError.response?.data?.message || 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    loadChats();
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (teamIdParam || projectIdParam || userIdParam) {
      const currentKey = [teamIdParam, projectIdParam, userIdParam].filter(Boolean).join(':');

      if (!currentKey || autoOpenKeyRef.current === currentKey) {
        return;
      }

      autoOpenKeyRef.current = currentKey;

      if (teamIdParam) {
        openTeamChat(teamIdParam);
        return;
      }

      if (projectIdParam) {
        openProjectChat(projectIdParam);
        return;
      }

      if (userIdParam) {
        openDirectChat(userIdParam);
      }
      return;
    }

    if (chatIdParam && chats.length > 0) {
      const existingChat = chats.find((chat) => chat._id === chatIdParam);
      if (existingChat && existingChat._id !== selectedChatId) {
        selectChat(existingChat);
      }
    }
  }, [user, chatIdParam, teamIdParam, projectIdParam, userIdParam, chats, selectedChatId]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    const socket = getSocket();
    if (!socket) {
      return;
    }

    socket.emit('join_chat', selectedChatId);
    loadMessages(selectedChatId);

    const handleNewMessage = (incomingMessage) => {
      const incomingChatId = incomingMessage.chat?._id || incomingMessage.chat;

      if (incomingChatId === selectedChatId) {
        setMessages((previous) => [...previous, incomingMessage]);
      }

      setChats((previous) => {
        const updated = previous.map((chat) => {
          if (chat._id !== incomingChatId) {
            return chat;
          }

          return {
            ...chat,
            latestMessage: incomingMessage,
            updatedAt: incomingMessage.createdAt || chat.updatedAt
          };
        });

        return updated.sort((left, right) => new Date(right.updatedAt) - new Date(left.updatedAt));
      });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_chat', selectedChatId);
      socket.off('new_message', handleNewMessage);
    };
  }, [selectedChatId]);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setUserResults([]);
      return;
    }

    let active = true;

    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await api.get(`/users/search?query=${encodeURIComponent(trimmed)}`);
        if (active) {
          setUserResults(response.data.users || []);
        }
      } catch (searchError) {
        if (active) {
          setUserResults([]);
        }
      } finally {
        if (active) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      <video
        className="fixed inset-0 h-full w-full object-cover z-0"
        src="https://res.cloudinary.com/dyzfbhol5/video/upload/v1781063941/NexusCrystal_imby9z.mp4"
        autoPlay
        loop
        muted
        playsInline
        style={{ pointerEvents: 'none', filter: 'brightness(0.55) blur(1px)' }}
      />
      <div className="fixed inset-0 z-10 bg-gradient-to-br from-[#0b1020]/90 via-[#11162b]/80 to-[#191327]/90 pointer-events-none" />

      <div className="relative z-20 min-h-screen pt-24 px-4 pb-6">
        <div className="mx-auto flex max-w-[1600px] gap-4 lg:gap-6">
          <aside className="hidden lg:flex w-[360px] flex-col gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <FiMessageSquare />
                </div>
                <div>
                  <h2 className="text-xl font-robert-medium">Chats</h2>
                  <p className="text-xs text-white/50">Direct, team, and project conversations</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search users to message..."
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-blue-400/60"
                  />
                </div>

                {searchLoading && <p className="text-sm text-white/50">Searching users...</p>}

                {userResults.length > 0 && (
                  <div className="space-y-2 max-h-56 overflow-auto pr-1">
                    {userResults.map((person) => (
                      <button
                        key={person._id}
                        type="button"
                        onClick={() => openDirectChat(person._id)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{person.name}</p>
                            <p className="text-xs text-white/45">@{person.username}</p>
                          </div>
                          <span className="text-xs text-blue-300">Message</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white/70">Recent conversations</h3>
                    <button type="button" onClick={refreshChats} className="text-white/45 hover:text-white transition-colors">
                      <FiRefreshCw size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                    {loadingChats ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
                        Loading chats...
                      </div>
                    ) : chats.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/50">
                        No chats yet. Search for a user or open a team/project chat.
                      </div>
                    ) : (
                      chats.map((chat) => {
                        const active = chat._id === selectedChatId;
                        const latestMessage = chat.latestMessage?.content || 'No messages yet';
                        const label = chat.teamId ? 'Team' : chat.projectId ? 'Project' : chat.isGroupChat ? 'Group' : 'Direct';

                        return (
                          <button
                            key={chat._id}
                            type="button"
                            onClick={() => selectChat(chat)}
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${active ? 'border-blue-400/40 bg-blue-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  {chat.isGroupChat ? <FiUsers size={14} className="text-blue-300" /> : <FiCircle size={10} className="text-emerald-300" />}
                                  <p className="truncate text-sm font-medium">{chat.chatName || 'Chat'}</p>
                                </div>
                                <p className="truncate text-xs text-white/45 mt-1">{latestMessage}</p>
                              </div>
                              <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60">{label}</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="flex-1 min-w-0 rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl overflow-hidden">
            <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4 sm:px-6 bg-black/10">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/feed')}
                  className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <FiArrowLeft />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-lg sm:text-xl font-robert-medium">{selectedTitle}</h1>
                    {selectedChat?.isGroupChat && <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] text-blue-200">Group</span>}
                  </div>
                  <p className="truncate text-xs sm:text-sm text-white/55">{selectedSubtitle}</p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2 text-xs text-white/50">
                <span>{selectedChat?.teamId ? 'Team chat' : selectedChat?.projectId ? 'Project chat' : 'Conversation'}</span>
              </div>
            </header>

            <div className="flex h-[calc(100vh-13rem)] min-h-[640px] flex-col">
              {error && (
                <div className="mx-4 mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 sm:mx-6">
                  {error}
                </div>
              )}

              {!selectedChat ? (
                <div className="flex flex-1 items-center justify-center px-6 text-center">
                  <div className="max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/30 to-blue-500/30">
                      <FiMessageSquare size={26} />
                    </div>
                    <h2 className="text-2xl font-robert-medium">Choose a conversation</h2>
                    <p className="mt-3 text-sm text-white/60">Search for a user to start a direct chat, or open a team or project from their detail page.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                    {loadingMessages ? (
                      <div className="flex h-full items-center justify-center text-sm text-white/50">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-white/50">
                        No messages yet. Start the conversation.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((message) => {
                          const mine = (message.sender?._id || message.sender)?.toString() === user?._id?.toString();

                          return (
                            <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[85%] sm:max-w-[70%] rounded-3xl px-4 py-3 shadow-lg ${mine ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' : 'bg-white/10 text-white'}`}>
                                {!mine && (
                                  <p className="mb-1 text-xs font-medium text-blue-200">
                                    {message.sender?.name || 'User'}
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                                <div className={`mt-2 text-[11px] ${mine ? 'text-white/70' : 'text-white/40'}`}>
                                  {formatTime(message.createdAt)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={bottomRef} />
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="border-t border-white/10 bg-black/10 px-4 py-4 sm:px-6">
                    <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3">
                      <input
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder="Write a message..."
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={sending || !messageText.trim()}
                        className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {sending ? 'Sending' : 'Send'}
                        <FiSend />
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>

        <div className="mt-4 lg:hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <FiSearch />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users to message..."
              className="w-full bg-transparent text-sm text-white placeholder:text-white/35 outline-none"
            />
          </div>

          <div className="space-y-2">
            {userResults.slice(0, 6).map((person) => (
              <button
                key={person._id}
                type="button"
                onClick={() => openDirectChat(person._id)}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-left"
              >
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-xs text-white/45">@{person.username}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;