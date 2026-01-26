import { useEffect, useState } from 'react';
import { useAuthStore } from './store';
import { LoginModal } from './components/auth/LoginModal';
import { SignupModal } from './components/auth/SignupModal';
import { Sidebar } from './components/chat/Sidebar';
import { ChatPanel } from './components/chat/ChatPanel';

function App() {
  const { user, loading, initAuth } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
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

  // Handle dark mode toggle
  const handleDarkModeToggle = () => {
    setDarkMode(prev => !prev);
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
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
        <div className="text-center text-white max-w-md mx-4">
          <h1 className="text-5xl font-bold mb-4">ChatApp</h1>
          <p className="text-xl mb-8 text-primary-100">
            Real-time messaging with AI-powered moderation
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors font-semibold shadow-lg"
            >
              Sign In
            </button>
            <button
              onClick={() => setShowSignup(true)}
              className="px-8 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-colors font-semibold shadow-lg"
            >
              Sign Up
            </button>
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
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      <Sidebar darkMode={darkMode} onToggleDarkMode={handleDarkModeToggle} />
      <ChatPanel />
    </div>
  );
}

export default App;

