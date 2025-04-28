import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Import Tailwind CSS
import App from './App';

// Theme setup component
function ThemeSetup() {
  useEffect(() => {
    // Check user preference
    const savedTheme = localStorage.getItem('flux-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Listen for theme change events
    const handleStorageChange = (e) => {
      if (e.key === 'flux-theme') {
        document.documentElement.setAttribute('data-theme', e.newValue || 'light');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return <App />;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeSetup />
  </React.StrictMode>
);
