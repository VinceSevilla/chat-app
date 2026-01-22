import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore, useChatStore } from '../../store';
import { formatMessageTime } from '../../utils/date';
import { Message } from '../../types';

export const ChatPanel: React.FC = () => {
  const { user } = useAuthStore();
  const {
    chats,
    currentChatId,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    requestChatSummary,
    chatSummary,
    searchMessages,
    searchResults,
  } = useChatStore();

  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentChat = chats.find(c => c.id === currentChatId);
  const currentMessages = currentChatId ? messages[currentChatId] || [] : [];
  const currentTypingUsers = currentChatId ? typingUsers[currentChatId] || [] : [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatName = (): string => {
    if (!currentChat) return '';
    if (currentChat.name) return currentChat.name;
    
    if (!currentChat.is_group && currentChat.members) {
      const otherMember = currentChat.members.find(m => m.id !== user?.id);
      return otherMember?.full_name || 'Unknown User';
    }
    
    return 'Chat';
  };

  const getChatStatus = (): string => {
    if (!currentChat || currentChat.is_group) {
      return `${currentChat?.members?.length || 0} members`;
    }
    
    const otherMember = currentChat.members?.find(m => m.id !== user?.id);
    return otherMember?.online ? 'Online' : 'Offline';
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentChatId) return;

    sendMessage(currentChatId, messageInput.trim());
    setMessageInput('');
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    stopTyping(currentChatId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);

    if (!currentChatId) return;

    // Start typing indicator
    startTyping(currentChatId);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Stop typing after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      stopTyping(currentChatId);
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMessages(searchQuery);
    }
  };

  const handleRequestSummary = () => {
    if (currentChatId) {
      requestChatSummary(currentChatId);
      setShowSummary(true);
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const groupedMessages = groupMessagesByDate(currentMessages);

  if (!currentChatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a chat to start messaging</h3>
          <p className="text-gray-500">Choose from your existing conversations or start a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold">
            {getChatName()[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{getChatName()}</h3>
            <p className="text-sm text-gray-600">{getChatStatus()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Search messages"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button
            onClick={handleRequestSummary}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Get AI summary"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="p-4 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search messages..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="px-4 pb-4 max-h-64 overflow-y-auto border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-700 mb-2">
                Found {searchResults.length} result(s)
              </div>
              <div className="space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => {
                      setHighlightedMessageId(result.id);
                      setTimeout(() => {
                        messageRefs.current[result.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                      setTimeout(() => {
                        setHighlightedMessageId(null);
                      }, 2000);
                    }}
                    className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium truncate">
                          {result.sender?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {result.content}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatMessageTime(result.created_at)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Modal */}
      {showSummary && chatSummary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Chat Summary</h3>
              <button
                onClick={() => setShowSummary(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700">{chatSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center my-4">
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                {date}
              </span>
            </div>
            {msgs.map((message) => {
              const isOwn = message.sender_id === user?.id;
              const sender = message.sender;

              return (
                <div
                  key={message.id || message.tempId}
                  ref={(el) => {
                    if (el && message.id) {
                      messageRefs.current[message.id] = el;
                    }
                  }}
                  className={`flex items-start gap-2 mb-4 p-2 rounded transition-colors ${isOwn ? 'flex-row-reverse' : ''} ${
                    highlightedMessageId === message.id ? 'bg-yellow-100' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-xs flex-shrink-0">
                    {getInitials(sender?.full_name || 'U')}
                  </div>
                  <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-md`}>
                    {!isOwn && (
                      <span className="text-xs text-gray-600 mb-1 px-3">
                        {sender?.full_name}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isOwn
                          ? 'bg-primary-600 text-white rounded-tr-sm'
                          : 'bg-white text-gray-900 rounded-tl-sm border border-gray-200'
                      } ${message.is_flagged ? 'border-2 border-yellow-400' : ''}`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      {message.is_flagged && (
                        <div className="mt-1 text-xs text-yellow-300 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Flagged
                        </div>
                      )}
                    </div>
                    <span className={`text-xs text-gray-500 mt-1 px-3`}>
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span>
              {currentTypingUsers.map(u => u.userName).join(', ')}{' '}
              {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <textarea
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="submit"
            disabled={!messageInput.trim()}
            className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};
