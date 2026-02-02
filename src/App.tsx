import { useEffect, useState } from 'react';
import { useAuthStore, useChatStore } from './store';
import { LoginModal } from './components/auth/LoginModal';
import { SignupModal } from './components/auth/SignupModal';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';

function App() {
  const { user, loading, initAuth } = useAuthStore();
  const { currentChatId } = useChatStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has saved preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  });
  useEffect(() => {
    initAuth();
  }, []);

  useEffect(() => {
    if (currentChatId) {
      setMobileView('chat');
    } else {
      setMobileView('list');
    }
  }, [currentChatId]);

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    setDarkMode((prev: boolean) => !prev);
  };

  useEffect(() => {
    // Sync localStorage with state
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    
    // Update document class immediately
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [darkMode]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
        {/* Left Side - Content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-8 lg:px-16 py-12">
          <div className="max-w-xl w-full">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">ChatApp</h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-4 font-medium">
              Real-time messaging with AI-powered moderation
            </p>
            <p className="text-sm sm:text-base text-gray-600 mb-8 leading-relaxed">
              Connect with your team instantly. Our platform features intelligent content moderation, 
              real-time notifications, and seamless collaboration tools to keep your conversations 
              productive and safe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-lg"
              >
                Sign In
              </button>
              <button
                onClick={() => setShowSignup(true)}
                className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-semibold shadow-lg"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        {/* Right Side - Vector Designs */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 items-center justify-center p-16">
          <div className="text-center">
            <div className="mb-8">
              {/* Chat bubbles illustration */}
              <div className="relative w-96 h-96">
                {/* Main chat bubble */}
                <div className="absolute top-1/4 left-1/4 w-48 h-32 bg-white rounded-3xl shadow-2xl p-4 transform -rotate-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-full mb-2"></div>
                  <div className="w-32 h-3 bg-gray-200 rounded-full mb-2"></div>
                  <div className="w-24 h-3 bg-gray-200 rounded-full"></div>
                </div>
                
                {/* Secondary chat bubble */}
                <div className="absolute top-1/2 right-1/4 w-40 h-28 bg-primary-400 rounded-3xl shadow-2xl p-4 transform rotate-6">
                  <div className="w-28 h-3 bg-white/80 rounded-full mb-2"></div>
                  <div className="w-20 h-3 bg-white/80 rounded-full mb-2"></div>
                  <div className="w-24 h-3 bg-white/80 rounded-full"></div>
                </div>

                {/* Small accent bubble */}
                <div className="absolute bottom-1/4 left-1/3 w-32 h-24 bg-white/90 rounded-3xl shadow-xl p-3 transform rotate-3">
                  <div className="w-8 h-8 bg-primary-200 rounded-full mb-2"></div>
                  <div className="w-20 h-2 bg-gray-200 rounded-full mb-1"></div>
                  <div className="w-16 h-2 bg-gray-200 rounded-full"></div>
                </div>

                {/* Floating icons */}
                <div className="absolute top-8 right-8 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-bounce">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="absolute bottom-8 left-8 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center animate-pulse">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Connect & Collaborate</h2>
            <p className="text-lg text-primary-100">Modern messaging for modern teams</p>
          </div>
        </div>

        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onSwitchToSignup={() => {
            setShowLogin(false);
            setShowSignup(true);
          }}
        />

        <SignupModal
          isOpen={showSignup}
          onClose={() => setShowSignup(false)}
          onSwitchToLogin={() => {
            setShowSignup(false);
            setShowLogin(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:h-screen flex flex-col md:flex-row bg-gray-100 dark:bg-gray-900">
      <div className={`${mobileView === 'list' ? 'flex' : 'hidden'} flex-1 md:flex md:flex-none md:w-80`}>
        <Sidebar
          darkMode={darkMode}
          onToggleDarkMode={handleDarkModeToggle}
          onSelectChat={() => setMobileView('chat')}
        />
      </div>
      <div className={`flex-1 ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
        <ChatPanel
          showBackButton={mobileView === 'chat'}
          onBack={() => setMobileView('list')}
        />
      </div>
    </div>
  );
}

export default App;

