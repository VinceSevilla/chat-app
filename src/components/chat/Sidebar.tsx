import React, { useState, useEffect } from 'react';
import { useAuthStore, useChatStore } from '../../store';
import type { Chat } from '../../types';
import { formatDistanceToNow } from '../../utils/date';
import { UserProfileModal } from '../user/UserProfileModal';

interface SidebarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectChat?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ darkMode, onToggleDarkMode, onSelectChat }) => {
  const { user, signOut } = useAuthStore();
  const { chats, currentChatId, setCurrentChat, fetchChats, fetchUsers, users, createChat, deleteChat, hiddenChatIds } = useChatStore();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchChats();
    fetchUsers();
  }, []);

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getChatName = (chat: Chat): string => {
    if (chat.name) return chat.name;
    
    if (!chat.is_group && chat.members) {
      const otherMember = chat.members.find(m => m.id !== user?.id);
      return otherMember?.full_name || 'Unknown User';
    }
    
    return 'Unnamed Chat';
  };

  const getChatAvatar = (chat: Chat): string => {
    if (!chat.is_group && chat.members) {
      const otherMember = chat.members.find(m => m.id !== user?.id);
      return getInitials(otherMember?.full_name || '?');
    }
    
    return chat.name?.[0]?.toUpperCase() || '#';
  };

  const filteredChats = chats.filter(chat => {
    if (hiddenChatIds.includes(chat.id)) return false;
    if (!searchQuery) return true;
    const chatName = getChatName(chat);
    return chatName.toLowerCase().includes(searchQuery.toLowerCase());
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const isOnline = (chat: Chat): boolean => {
    if (!chat.is_group && chat.members) {
      const otherMember = chat.members.find(m => m.id !== user?.id);
      return otherMember?.online || false;
    }
    return false;
  };

  return (
    <div className="w-full md:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen md:h-screen min-h-0">
      {/* User Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-primary-600 dark:bg-primary-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold">
              {getInitials(user?.full_name || 'U')}
            </div>
            <div className="text-white">
              <h3 className="font-semibold">{user?.full_name}</h3>
              <p className="text-xs text-primary-100 dark:text-primary-200">Online</p>
            </div>
          </div>
          <div className="relative flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Toggle clicked, current darkMode:', darkMode);
                onToggleDarkMode();
              }}
              className="text-white hover:bg-primary-700 dark:hover:bg-primary-600 p-2 rounded-lg transition-colors"
              title={`Toggle dark mode (currently ${darkMode ? 'ON' : 'OFF'})`}
            >
              {darkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.12-2.12a1 1 0 00-1.414 0l-2.12 2.12a1 1 0 101.414 1.414l.707-.707.707.707a1 1 0 001.414-1.414zM2.05 5.464a1 1 0 00-1.414 1.414l2.12 2.12a1 1 0 101.414-1.414l-.707-.707-.707.707a1 1 0 01-1.414-1.414zm11.314 0a1 1 0 00-1.414 1.414l.707.707-.707.707a1 1 0 101.414 1.414l2.12-2.12a1 1 0 000-1.414l-2.12-2.12z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="text-white hover:bg-primary-700 p-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showUserMenu && (
              <div className="absolute right-0 mt-12 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => {
                    signOut();
                    setShowUserMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-red-600 dark:text-red-400 rounded-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none dark:bg-gray-700 dark:text-white"
          />
          <svg
            className="w-5 h-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto dark:bg-gray-800">
        {filteredChats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => {
              setCurrentChat(chat.id);
              onSelectChat?.();
            }}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 min-h-20 ${
              currentChatId === chat.id ? 'bg-primary-50 dark:bg-primary-900/30' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                {getChatAvatar(chat)}
              </div>
              {isOnline(chat) && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">{getChatName(chat)}</h4>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(chat.updated_at)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const ok = window.confirm('Delete this conversation from your list?');
                      if (ok) {
                        deleteChat(chat.id);
                      }
                    }}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {chat.is_group ? `${chat.members?.length || 0} members` : 'Direct message'}
              </p>
            </div>
          </button>
        ))}

        {filteredChats.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>No chats found</p>
          </div>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => setShowNewChatModal(true)}
          className="w-full bg-primary-600 dark:bg-primary-700 text-white py-2 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          users={users.filter(u => u.id !== user?.id)}
          onClose={() => setShowNewChatModal(false)}
          onCreate={(isGroup, memberIds, name) => {
            createChat(isGroup, memberIds, name);
            setShowNewChatModal(false);
          }}
        />
      )}

      {/* User Profile Modal */}
      <UserProfileModal 
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

interface NewChatModalProps {
  users: any[];
  onClose: () => void;
  onCreate: (isGroup: boolean, memberIds: string[], name?: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ users, onClose, onCreate }) => {
  const [isGroup, setIsGroup] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (selectedUsers.length === 0) return;
    onCreate(isGroup, selectedUsers, isGroup ? groupName : undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Chat</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isGroup}
              onChange={(e) => setIsGroup(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Group Chat</span>
          </label>
        </div>

        {isGroup && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              placeholder="My Group"
            />
          </div>
        )}

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto mb-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          {filteredUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => toggleUser(user.id)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                selectedUsers.includes(user.id) ? 'bg-primary-50 dark:bg-gray-700' : ''
              }`}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm">
                  {getInitials(user.full_name)}
                </div>
                {user.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-700 rounded-full"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <h4 className="font-semibold text-gray-900 dark:text-white">{user.full_name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
              </div>
              {selectedUsers.includes(user.id) && (
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={selectedUsers.length === 0 || (isGroup && !groupName)}
          className="w-full bg-primary-600 dark:bg-primary-700 text-white py-2 px-4 rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Create Chat
        </button>
      </div>
    </div>
  );
};
