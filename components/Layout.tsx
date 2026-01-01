import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Sun, Moon } from './Icons';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin') && location.pathname !== '/admin';
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkStored);
    if (isDarkStored) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100 flex flex-col items-center selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-300">
      <nav className="w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 h-16 flex items-center justify-between px-4 lg:px-8 z-50 sticky top-0 transition-all duration-300">
        <Link to="/" className="flex items-center gap-3 group h-full">
          <div className="flex items-center justify-center overflow-hidden">
            <motion.img 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              src="logo.svg" 
              alt="CMC Oriental Logo" 
              className="max-h-[40px] w-auto object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter text-gray-900 dark:text-white uppercase leading-none">
              CMC <span className="text-[#31a1b8]">Oriental</span>
            </span>
            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Admin Hub</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={isDark ? "Mode clair" : "Mode sombre"}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAdmin && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-black uppercase text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-lg transition-all"
            >
              <span className="hidden sm:inline">Déconnexion</span>
              <LogOut className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </nav>

      <main className="w-full max-w-5xl flex-1 p-4 lg:p-8 flex flex-col">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full h-full flex flex-col"
        >
          {children}
        </motion.div>
      </main>

      <footer className="w-full py-8 text-center text-gray-400 dark:text-gray-600 text-[10px] font-bold uppercase tracking-widest border-t border-gray-200/50 dark:border-gray-800/50 mt-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        <p>© {new Date().getFullYear()} Cités des métiers et des compétences - Oriental</p>
      </footer>
    </div>
  );
};

export default Layout;