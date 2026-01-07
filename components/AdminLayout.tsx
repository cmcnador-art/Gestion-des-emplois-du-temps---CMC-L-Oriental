
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// Fix: Use namespaced import to resolve 'no exported member' errors in certain TS environments
import * as RouterDOM from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../services/firebase';
import { sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { fetchAdminProfile, updateAdminProfile, fetchTimetables } from '../services/api';
import { AdminProfile, TimetableEntry } from '../types';
import { 
  LayoutDashboard, LogOut, Users, Server, ShieldCheck, Sun, Moon, Shield, Mail, 
  RefreshCw, Eye, Menu, ChevronDown, ChevronLeft, ChevronRight, Globe, Check, 
  GraduationCap, Search, X, FileText, BookOpen, Layers, AlertCircle, Zap
} from './Icons';
import { Modal, Input, Button, Badge, ToastContainer } from './AdminUI';

const { Link, useLocation, useNavigate } = RouterDOM as any;

interface AdminLayoutProps { children: React.ReactNode; }
type ToastType = { id: string, message: string, type: 'success' | 'error' | 'info' };
type DockPosition = 'bottom' | 'left' | 'right';

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showUnsavedConfirm, setShowUnsavedConfirm] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dockPosition, setDockPosition] = useState<DockPosition>('bottom');
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Optimisation Recherche
  const [allData, setAllData] = useState<TimetableEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Authenticity Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await fetchAdminProfile(user.uid);
        if (profile) {
          setCurrentUser(profile);
          setEditName(profile.name);
          setEditEmail(profile.email);
          localStorage.setItem('adminProfile', JSON.stringify(profile));
        }
      } else {
        const stored = localStorage.getItem('adminProfile');
        if (stored) {
          const profile = JSON.parse(stored);
          setCurrentUser(profile);
          setEditName(profile.name);
          setEditEmail(profile.email);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const isDarkStored = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkStored);
    if (isDarkStored) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    const savedPos = localStorage.getItem('cmc_dock_pos') as DockPosition;
    if (savedPos) setDockPosition(savedPos);
  }, []);

  const loadSearchData = useCallback(async () => {
    if (allData.length > 0) return; 
    setIsSearching(true);
    try {
      const data = await fetchTimetables();
      const profile = currentUser || JSON.parse(localStorage.getItem('adminProfile') || '{}');
      const filtered = profile.role === 'SUPER_ADMIN' 
        ? data 
        : data.filter((e: any) => profile.allowedPoles.includes(e.pole));
      setAllData(filtered);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  }, [allData.length, currentUser]);

  useEffect(() => {
    if (isSearchOpen) {
      loadSearchData();
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen, loadSearchData]);

  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    return allData
      .map(item => {
        let score = 0;
        const group = item.group.toLowerCase();
        const pole = item.pole.toLowerCase();
        const spec = item.specialty.toLowerCase();
        const level = item.level.toLowerCase();

        if (group === q) score += 100;
        else if (group.startsWith(q)) score += 80;
        else if (group.includes(q)) score += 60;
        
        if (spec.includes(q)) score += 40;
        if (pole.includes(q)) score += 20;
        if (level.includes(q)) score += 10;

        return { ...item, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [allData, searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (filteredResults.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (filteredResults.length || 1)) % (filteredResults.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredResults[selectedIndex];
      if (selected) {
        window.open(selected.pdfUrl, '_blank');
        setIsSearchOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

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
    localStorage.removeItem('adminProfile');
    auth.signOut();
    navigate('/');
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleResetPassword = async () => {
    const emailToReset = currentUser?.email || auth.currentUser?.email;
    if (!emailToReset) {
      addToast("Erreur: Adresse email introuvable pour ce profil.", "error");
      return;
    }

    setIsResettingPassword(true);
    try {
      // Check for social login - Firebase doesn't allow reset emails for Google/Social providers
      const providerId = auth.currentUser?.providerData[0]?.providerId;
      if (providerId && providerId !== 'password') {
        throw new Error("Ce compte utilise une connexion sociale (Google). Le mot de passe doit être géré via votre compte Google.");
      }

      await sendPasswordResetEmail(auth, emailToReset);
      addToast("Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.", "success");
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/user-not-found') msg = "Aucun utilisateur trouvé avec cet email.";
      if (error.code === 'auth/too-many-requests') msg = "Trop de tentatives. Veuillez patienter.";
      addToast("Erreur : " + msg, "error");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);
    try {
      await updateAdminProfile(currentUser.id, { name: editName });
      const updated = { ...currentUser, name: editName };
      setCurrentUser(updated);
      localStorage.setItem('adminProfile', JSON.stringify(updated));
      addToast("Profil synchronisé avec succès.", "success");
      setIsProfileOpen(false);
    } catch (err) {
      addToast("Erreur de sauvegarde.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getDockClasses = () => {
    const base = "fixed z-[100] flex transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-none";
    if (dockPosition === 'bottom') return `${base} bottom-8 left-1/2 -translate-x-1/2 items-end`;
    if (dockPosition === 'left') return `${base} left-6 top-1/2 -translate-y-1/2 items-start flex-col`;
    return `${base} right-6 top-1/2 -translate-y-1/2 items-end flex-col`;
  };

  const getContainerClasses = () => {
    const base = "pointer-events-auto bg-gray-900/90 dark:bg-gray-800/90 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] border border-white/10 dark:border-white/5 p-2 flex gap-1 ring-8 ring-black/5";
    if (dockPosition === 'bottom') return `${base} items-center`;
    return `${base} flex-col items-center`;
  };

  const handleDragEnd = (_: any, info: any) => {
    const threshold = 100;
    const x = info.point.x;
    const screenWidth = window.innerWidth;
    if (x < threshold) { setDockPosition('left'); localStorage.setItem('cmc_dock_pos', 'left'); }
    else if (x > screenWidth - threshold) { setDockPosition('right'); localStorage.setItem('cmc_dock_pos', 'right'); }
    else { setDockPosition('bottom'); localStorage.setItem('cmc_dock_pos', 'bottom'); }
  };

  const navItems = [
    { label: 'Accueil', path: '/', icon: <Globe className="w-5 h-5" />, type: 'external' },
    { label: 'Dash', path: '/admin/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, type: 'link' },
    { label: 'Structure', path: '/admin/structure', icon: <Server className="w-5 h-5" />, type: 'link' },
    { label: 'Équipe', path: '/admin/team', icon: <Users className="w-5 h-5" />, type: 'link', adminOnly: true },
    { label: 'Étudiant', path: '/student', icon: <Eye className="w-5 h-5" />, type: 'external' },
    { label: 'Profil', action: () => setIsProfileOpen(true), icon: <ShieldCheck className="w-5 h-5" />, type: 'action' },
    { label: 'Mode', action: toggleTheme, icon: isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />, type: 'action' },
    { label: 'Quitter', action: handleLogout, icon: <LogOut className="w-5 h-5" />, type: 'logout' },
  ];

  const attemptCloseProfile = () => {
    if (currentUser && (editName !== currentUser.name || editEmail !== currentUser.email)) setShowUnsavedConfirm(true);
    else setIsProfileOpen(false);
  };

  const discardChanges = () => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditEmail(currentUser.email);
    }
    setShowUnsavedConfirm(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col transition-colors duration-500 selection:bg-[#31a1b8]/30 overflow-x-hidden">
      <ToastContainer toasts={toasts} removeToast={(id: string) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3.5 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -3 }}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm overflow-hidden"
            >
              <img src="logo.svg" alt="Logo" className="w-full h-full object-contain p-1.5" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-black text-[13px] uppercase tracking-[-0.02em] dark:text-white leading-none group-hover:text-[#31a1b8] transition-colors">
                CMC <span className="text-[#31a1b8]">Oriental</span>
              </span>
              <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em] mt-1 opacity-70">Espace Administrateur</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 px-3.5 py-2 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl border border-gray-200/50 dark:border-white/5 transition-all group shadow-sm ring-1 ring-transparent hover:ring-cmc-blue/10"
            >
              <Search className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#31a1b8] transition-colors" />
              <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden sm:block">Recherche</span>
              <div className="hidden md:flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-gray-900/50 px-1.5 py-0.5 font-mono text-[9px] font-black text-gray-400/80">
                <span className="text-[9px]">⌘</span>K
              </div>
            </button>

            <div className="hidden sm:flex items-center gap-2.5 pl-3.5 pr-2 py-1.5 bg-gray-100/30 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5 group transition-colors hover:bg-gray-100/50 dark:hover:bg-white/10 cursor-default">
               <div className="relative">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                 <div className="absolute inset-0 w-1.5 h-1.5 rounded-full bg-green-500 animate-ping opacity-40" />
               </div>
               <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest truncate max-w-[120px]">{currentUser?.name || "..."}</span>
               <div className="w-6 h-6 rounded-lg bg-cmc-blue/10 dark:bg-white/5 border border-cmc-blue/20 dark:border-white/10 flex items-center justify-center">
                  <span className="text-[9px] font-black text-[#31a1b8] dark:text-gray-300">{(currentUser?.name || "A").charAt(0)}</span>
               </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 mb-28 transition-all duration-700 ${isExpanded && dockPosition === 'left' ? 'lg:pl-32' : ''} ${isExpanded && dockPosition === 'right' ? 'lg:pr-32' : ''}`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <motion.div layout className={getDockClasses()}>
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsExpanded(false)} className="fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-sm pointer-events-auto cursor-zoom-out" />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button key="collapsed-dock" layoutId="dock-frame" onClick={() => setIsExpanded(true)} drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.9} onDragEnd={handleDragEnd} whileDrag={{ scale: 1.1, cursor: 'grabbing' }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pointer-events-auto bg-gray-900 dark:bg-gray-800 text-white px-6 py-3.5 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.3)] border border-white/10 dark:border-white/5 flex items-center gap-3 ring-4 ring-black/5 touch-none">
              <div className="relative pointer-events-none">
                <Menu className="w-5 h-5 text-[#31a1b8]" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900 dark:border-gray-800" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] whitespace-nowrap pointer-events-none">Administration</span>
            </motion.button>
          ) : (
            <motion.nav key="expanded-dock" layoutId="dock-frame" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', damping: 22, stiffness: 280 }} className={getContainerClasses()}>
              {navItems.filter(item => !item.adminOnly || currentUser?.role === 'SUPER_ADMIN').map((item, idx) => {
                const isActive = item.type === 'link' && location.pathname === item.path;
                const isVertical = dockPosition !== 'bottom';
                const content = (
                  <motion.div whileHover={isVertical ? { x: dockPosition === 'left' ? 6 : -6 } : { y: -6 }} className={`flex flex-col items-center justify-center ${isVertical ? 'h-16 w-16' : 'h-14 w-14 sm:h-16 sm:w-20'} rounded-[1.8rem] transition-all relative group`}>
                    {isActive && <motion.div layoutId="active-indicator" className="absolute inset-0 bg-white/10 dark:bg-[#31a1b8]/20 rounded-[1.8rem] border border-white/20 dark:border-[#31a1b8]/30 shadow-inner" transition={{ type: 'spring', bounce: 0.25, duration: 0.6 }} />}
                    <div className={`relative z-10 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(49,161,184,0.5)] ${isActive ? 'text-[#31a1b8] scale-110' : item.type === 'logout' ? 'text-red-400 group-hover:text-red-500' : 'text-gray-400 group-hover:text-white'}`}>
                      {item.icon}
                    </div>
                    <span className={`relative z-10 text-[8px] font-black uppercase mt-1 tracking-tighter transition-opacity duration-300 hidden sm:block ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-300 group-hover:opacity-100 opacity-60'}`}>{item.label}</span>
                    {isActive && <motion.div layoutId="dot" className={`absolute w-1.5 h-1.5 bg-[#31a1b8] rounded-full shadow-[0_0_5px_#31a1b8] ${isVertical ? (dockPosition === 'left' ? '-right-1' : '-left-1') : '-bottom-1.5'}`} />}
                  </motion.div>
                );
                if (item.type === 'link' || item.type === 'external') return ( <Link key={idx} to={item.path || '#'} className="focus:outline-none" onClick={() => setIsExpanded(false)}>{content}</Link> );
                return ( <button key={idx} onClick={() => { item.action?.(); if (item.type === 'action' && item.label !== 'Mode') setIsExpanded(false); }} className="focus:outline-none">{content}</button> );
              })}
              <div className={`${dockPosition === 'bottom' ? 'w-px h-8' : 'h-px w-8'} bg-white/10 mx-1 hidden sm:block`} />
              <motion.button whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.1)' }} whileTap={{ scale: 0.9 }} onClick={() => setIsExpanded(false)} className={`h-12 w-12 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-all`}>
                {dockPosition === 'bottom' && <ChevronDown className="w-5 h-5" />}
                {dockPosition === 'left' && <ChevronLeft className="w-5 h-5" />}
                {dockPosition === 'right' && <ChevronRight className="w-5 h-5" />}
              </motion.button>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.div>

      {/* OPTIMIZED COMMAND PALETTE SEARCH */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[150] flex items-start justify-center pt-[12vh] px-4 md:px-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSearchOpen(false)} className="absolute inset-0 bg-gray-950/70 backdrop-blur-2xl" />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, y: -20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-[2rem] shadow-[0_40px_120px_rgba(0,0,0,0.6)] border border-gray-100 dark:border-white/5 overflow-hidden flex flex-col relative z-10"
              onKeyDown={handleSearchKeyDown}
            >
              <div className="p-5 border-b border-gray-50 dark:border-white/5 flex items-center gap-4">
                <div className="p-2.5 bg-[#31a1b8]/10 rounded-xl">
                   <Search className="w-6 h-6 text-[#31a1b8]" />
                </div>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Trouver un groupe, un pôle ou une spécialité..." 
                  className="flex-1 bg-transparent border-none outline-none py-2 text-xl font-bold text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setSelectedIndex(0); }}
                />
                <div className="flex items-center gap-2">
                  {isSearching && <RefreshCw className="w-4 h-4 animate-spin text-[#31a1b8]" />}
                  <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[55vh] overflow-y-auto p-3 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {searchQuery.trim() === '' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12 text-center flex flex-col items-center">
                       <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-center mb-4">
                         <Zap className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                       </div>
                       <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] mb-4">Accès Rapides</h3>
                       <div className="flex flex-wrap justify-center gap-2 max-sm">
                          {['Dashboard', 'Structure', 'ID101', 'DEV201'].map(tag => (
                            <button key={tag} onClick={() => { setSearchQuery(tag); }} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-[#31a1b8]/10 border border-gray-100 dark:border-gray-700 rounded-lg text-[9px] font-black uppercase text-gray-500 hover:text-[#31a1b8] tracking-widest transition-all">
                              {tag}
                            </button>
                          ))}
                       </div>
                    </motion.div>
                  ) : filteredResults.length > 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
                       {filteredResults.map((item, idx) => (
                         <motion.button 
                            key={item.id}
                            initial={{ opacity: 0, x: -5 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => { window.open(item.pdfUrl, '_blank'); setIsSearchOpen(false); }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full p-4 rounded-xl flex items-center justify-between group transition-all duration-150 ${
                              selectedIndex === idx 
                                ? 'bg-[#31a1b8] shadow-lg shadow-[#31a1b8]/20 scale-[1.01]' 
                                : 'bg-transparent hover:bg-gray-50 dark:hover:bg-white/5'
                            }`}
                         >
                           <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                               selectedIndex === idx ? 'bg-white text-[#31a1b8]' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:scale-110'
                             }`}>
                               <FileText className="w-5 h-5" />
                             </div>
                             <div className="text-left">
                               <div className={`font-black uppercase tracking-tight text-sm leading-none mb-1.5 ${
                                 selectedIndex === idx ? 'text-white' : 'text-gray-900 dark:text-white'
                               }`}>{item.group}</div>
                               <div className="flex items-center gap-2">
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${selectedIndex === idx ? 'text-white/70' : 'text-gray-400'}`}>{item.pole}</span>
                                 <div className={`w-0.5 h-0.5 rounded-full ${selectedIndex === idx ? 'bg-white/40' : 'bg-gray-300 dark:bg-gray-700'}`} />
                                 <span className={`text-[8px] font-black uppercase tracking-widest ${selectedIndex === idx ? 'text-white/70' : 'text-gray-400'}`}>{item.level}</span>
                               </div>
                             </div>
                           </div>
                           <div className="flex flex-col items-end">
                              <Badge variant={selectedIndex === idx ? 'outline' : 'outline'} className={`text-[7px] font-black uppercase border-none ${selectedIndex === idx ? 'bg-white/20 text-white' : 'text-gray-400'}`}>
                                {item.specialty.length > 25 ? item.specialty.substring(0, 25) + '...' : item.specialty}
                              </Badge>
                              {selectedIndex === idx && (
                                <div className="flex items-center gap-1 text-[8px] font-black text-white uppercase mt-1 tracking-widest opacity-80">
                                  Entrée <ChevronRight className="w-3 h-3" />
                                </div>
                              )}
                           </div>
                         </motion.button>
                       ))}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
                       <div className="w-14 h-14 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mx-auto mb-4">
                         <AlertCircle className="w-6 h-6 text-red-400" />
                       </div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Aucun résultat pour "{searchQuery}"</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-8">
                 <div className="flex items-center gap-1.5">
                   <div className="flex gap-1">
                     <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[8px] font-black text-gray-400">↑</kbd>
                     <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[8px] font-black text-gray-400">↓</kbd>
                   </div>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Navigation</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[8px] font-black text-gray-400">↵</kbd>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Ouvrir PDF</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                   <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800 text-[8px] font-black text-gray-400">Esc</kbd>
                   <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Fermer</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Modal isOpen={isProfileOpen} onClose={attemptCloseProfile} title="Votre Profil">
        <form onSubmit={handleSaveProfile} className="space-y-6">
           <div className="flex flex-col items-center pt-2 pb-4">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#31a1b8] to-indigo-600 text-white flex items-center justify-center text-4xl font-black mb-4 shadow-2xl shadow-[#31a1b8]/30 border-4 border-white dark:border-gray-800">
                {currentUser?.name.charAt(0) || 'A'}
              </motion.div>
              <Badge variant="blue" className="px-5 py-1.5 uppercase font-black text-[9px] tracking-[0.2em]">
                {currentUser?.role === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Admin Pôle'}
              </Badge>
           </div>
           <div className="space-y-4">
             <Input label="Nom complet" value={editName} onChange={(e:any) => setEditName(e.target.value)} required />
             <div className="space-y-1.5 opacity-50 cursor-not-allowed">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email (Non modifiable)</label>
               <input value={editEmail} disabled className="flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-500" />
             </div>
           </div>
           <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-[2rem] border border-gray-100 dark:border-white/5">
              <h4 className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-widest mb-4 flex items-center gap-2">
                 <Shield className="w-3.5 h-3.5 text-[#31a1b8]" /> Sécurité du compte
              </h4>
              <button 
                type="button" 
                disabled={isResettingPassword}
                className="group w-full h-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-[#31a1b8] hover:text-[#31a1b8] transition-all disabled:opacity-50 disabled:cursor-wait" 
                onClick={handleResetPassword}
              >
                {isResettingPassword ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 transition-transform group-hover:-rotate-12" />
                )}
                {isResettingPassword ? "Envoi en cours..." : "Réinitialiser le mot de passe"}
              </button>
           </div>
           <Button type="submit" disabled={isSaving || !editName} className="w-full h-16 rounded-[1.5rem] shadow-2xl shadow-[#31a1b8]/30 font-black uppercase tracking-widest text-xs">
             {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Synchroniser Profil"}
           </Button>
        </form>
      </Modal>

      <Modal isOpen={showUnsavedConfirm} onClose={() => setShowUnsavedConfirm(false)} title="Modifications non sauvegardées">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8 font-medium">Voulez-vous vraiment quitter sans enregistrer ?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setShowUnsavedConfirm(false)}>Annuler</Button>
            <Button variant="destructive" className="flex-1 h-12 rounded-xl" onClick={discardChanges}>Abandonner</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminLayout;
