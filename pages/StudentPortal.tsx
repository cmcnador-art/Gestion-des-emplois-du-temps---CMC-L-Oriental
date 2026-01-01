
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetables } from '../services/api';
import { TimetableEntry } from '../types';
import { UI_COLORS, DEFAULT_COLOR_ORDER } from '../constants';
// Added missing Shield and Globe icon imports
import { 
  FileText, RefreshCw, ChevronRight, ChevronLeft, AlertCircle, Search, X, Layers, BookOpen, GraduationCap, Shield, Globe
} from '../components/Icons';
import { Button, Badge } from '../components/AdminUI';

const StudentPortal: React.FC = () => {
  const [data, setData] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedPole, setSelectedPole] = useState<string | null>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchTimetables();
      setData(result.filter(item => item.active));
    } catch (err) { 
      setError("Erreur de connexion au serveur Supabase."); 
    } finally { 
      setLoading(false); 
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return data.filter(item => 
      item.group.toLowerCase().includes(q) ||
      item.pole.toLowerCase().includes(q) ||
      item.specialty.toLowerCase().includes(q) ||
      item.level.toLowerCase().includes(q)
    );
  }, [data, searchQuery]);

  const polesWithColors = useMemo(() => {
    const uniquePoles = [...new Set(data.map(i => i.pole))].sort();
    return uniquePoles.map((poleName, index) => {
      const colorId = DEFAULT_COLOR_ORDER[index % DEFAULT_COLOR_ORDER.length];
      const colorStyle = UI_COLORS.find(c => c.id === colorId) || UI_COLORS[0];
      return { name: poleName, colorStyle };
    });
  }, [data]);

  const specialties = useMemo(() => !selectedPole ? [] : [...new Set(data.filter(i => i.pole === selectedPole).map(i => i.specialty))].sort(), [data, selectedPole]);
  const levels = useMemo(() => !selectedSpecialty ? [] : [...new Set(data.filter(i => i.pole === selectedPole && i.specialty === selectedSpecialty).map(i => i.level))].sort(), [data, selectedSpecialty]);
  const groups = useMemo(() => !selectedLevel ? [] : [...new Set(data.filter(i => i.pole === selectedPole && i.specialty === selectedSpecialty && i.level === selectedLevel).map(i => i.group))].sort(), [data, selectedLevel]);

  const finalResult = useMemo(() => {
    if (selectedGroup) {
      return data.find(i => i.group === selectedGroup);
    }
    return data.find(i => 
      i.pole === selectedPole && i.specialty === selectedSpecialty && i.level === selectedLevel && (groups.length === 0 || i.group === selectedGroup)
    );
  }, [data, selectedPole, selectedSpecialty, selectedLevel, selectedGroup, groups.length]);

  const handleSearchResultClick = (item: TimetableEntry) => {
    setSelectedPole(item.pole);
    setSelectedSpecialty(item.specialty);
    setSelectedLevel(item.level);
    setSelectedGroup(item.group);
    setIsConfirmed(true);
    setSearchQuery('');
  };

  const resetSelection = () => { 
    setSelectedPole(null); 
    setSelectedSpecialty(null); 
    setSelectedLevel(null); 
    setSelectedGroup(null); 
    setIsConfirmed(false); 
    setSearchQuery('');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto py-8 pb-32 px-4">
      {/* Dynamic Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full text-center mb-10"
      >
        <div className="inline-block px-4 py-1.5 bg-cmc-blue/10 rounded-full border border-cmc-blue/20 mb-3">
          <p className="text-[10px] font-black text-cmc-blue uppercase tracking-[0.3em]">CMC Oriental Cloud</p>
        </div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-none">
          Emplois <span className="text-cmc-blue">du temps</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-3">Recherche instantanée par groupe ou pôle</p>
      </motion.div>

      {/* Optimized Search Bar */}
      {!isConfirmed && !loading && !error && (
        <motion.div 
          layout
          className="w-full mb-10 sticky top-20 z-30"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-cmc-blue/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center">
              <div className="absolute left-6 text-gray-400 group-focus-within:text-cmc-blue transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input 
                type="text" 
                placeholder="Ex: ID101, Industrie, Digital..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-16 pl-16 pr-12 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-sm outline-none focus:ring-4 focus:ring-cmc-blue/10 focus:border-cmc-blue transition-all font-bold text-gray-800 dark:text-white text-lg placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          <AnimatePresence>
            {!searchQuery && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2 mt-4 overflow-x-auto pb-2 px-2 no-scrollbar"
              >
                {['ID101', 'DEV201', 'INDUSTRIE', 'DIGITAL'].map(tag => (
                  <button 
                    key={tag} 
                    onClick={() => setSearchQuery(tag)}
                    className="whitespace-nowrap px-4 py-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-cmc-blue hover:text-cmc-blue transition-all shadow-sm"
                  >
                    #{tag}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="w-full min-h-[500px]">
        <AnimatePresence mode="wait">
          {loading ? (
             <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center pt-32">
               <div className="relative">
                 <RefreshCw className="w-16 h-16 text-cmc-blue animate-spin" />
                 <div className="absolute inset-0 bg-cmc-blue blur-2xl opacity-20" />
               </div>
               <p className="mt-8 text-[11px] font-black uppercase text-gray-400 tracking-[0.3em] animate-pulse">Synchronisation Cloud...</p>
             </motion.div>
          ) : error ? (
            <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 dark:bg-red-900/10 p-12 rounded-[3rem] border border-red-100 dark:border-red-900/30 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
              <h3 className="text-xl font-black text-red-900 dark:text-red-200 mb-2 uppercase">Erreur de Connexion</h3>
              <p className="text-red-600 dark:text-red-400 font-medium mb-8">{error}</p>
              <Button onClick={loadData} className="bg-red-600 hover:bg-red-700 h-14 px-10 rounded-2xl">Réessayer</Button>
            </motion.div>
          ) : isConfirmed && finalResult ? (
             <motion.div 
               key="result" 
               initial={{ opacity: 0, y: 30 }} 
               animate={{ opacity: 1, y: 0 }} 
               className="bg-white dark:bg-gray-900 rounded-[3.5rem] shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
             >
                <div className="bg-gradient-to-br from-cmc-blue via-[#268596] to-indigo-800 p-12 text-white relative">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                   <button 
                    onClick={() => { setIsConfirmed(false); setSelectedGroup(null); }} 
                    className="absolute top-8 left-8 bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all active:scale-95"
                   >
                     <ChevronLeft className="w-4 h-4" /> Retour
                   </button>
                   <div className="mt-12 text-center">
                      <div className="flex justify-center mb-6">
                        <div className="p-4 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20">
                          <FileText className="w-10 h-10" />
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 block mb-4">Emploi du temps officiel</span>
                      <h1 className="text-6xl font-black tracking-tighter mb-6">{finalResult.group}</h1>
                      <div className="flex flex-wrap justify-center gap-2">
                         <Badge className="bg-white/10 border-white/20 text-white px-4 py-1.5 font-bold uppercase text-[9px] tracking-widest">{finalResult.pole}</Badge>
                         <Badge className="bg-white/10 border-white/20 text-white px-4 py-1.5 font-bold uppercase text-[9px] tracking-widest">{finalResult.level}</Badge>
                      </div>
                   </div>
                </div>
                <div className="p-12 space-y-8 text-center bg-gray-50/50 dark:bg-transparent">
                   <div className="space-y-2">
                     <p className="text-[11px] font-black text-cmc-blue uppercase tracking-[0.3em]">Spécialité</p>
                     <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{finalResult.specialty}</p>
                   </div>
                   
                   <div className="flex flex-col gap-4">
                     <Button 
                      className="flex items-center justify-center gap-4 w-full py-10 text-2xl rounded-3xl shadow-2xl shadow-cmc-blue/30 group relative overflow-hidden"
                      onClick={() => window.open(finalResult.pdfUrl, '_blank')}
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <FileText className="w-8 h-8" /> 
                        <span>Ouvrir le Planning</span>
                     </Button>
                     <button 
                      onClick={resetSelection} 
                      className="text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] mt-2 py-4 hover:text-cmc-blue transition-all"
                     >
                       Rechercher un autre groupe
                     </button>
                   </div>
                </div>
             </motion.div>
          ) : searchQuery.trim() !== '' ? (
            <motion.div 
              key="search-results" 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-4"
            >
               <div className="flex items-center justify-between px-4 mb-4">
                 <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
                   Résultats trouvés <span className="text-cmc-blue ml-1">({searchResults.length})</span>
                 </h3>
               </div>
               
               {searchResults.length > 0 ? (
                 <div className="grid grid-cols-1 gap-3">
                   {searchResults.map((item) => (
                     <motion.button 
                        key={item.id} 
                        variants={itemVariants}
                        layout
                        onClick={() => handleSearchResultClick(item)}
                        className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between group hover:border-cmc-blue hover:shadow-xl hover:shadow-cmc-blue/5 transition-all text-left"
                      >
                        <div className="flex items-center gap-5">
                           <div className="w-14 h-14 bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-cmc-blue group-hover:text-white rounded-2xl flex items-center justify-center font-black text-xl transition-all">
                             {item.group.charAt(0)}
                           </div>
                           <div>
                             <h4 className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight group-hover:text-cmc-blue transition-colors">
                               {item.group}
                             </h4>
                             <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.pole}</span>
                               <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                               <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.level}</span>
                             </div>
                           </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-cmc-blue/10 group-hover:text-cmc-blue transition-all">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </motion.button>
                   ))}
                 </div>
               ) : (
                 <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="text-center py-24 bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800"
                 >
                    <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search className="w-8 h-8 text-gray-200" />
                    </div>
                    <p className="text-gray-400 font-black uppercase text-[11px] tracking-[0.4em]">Aucune correspondance trouvée</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-cmc-blue font-bold text-sm hover:underline">Effacer la recherche</button>
                 </motion.div>
               )}
            </motion.div>
          ) : !selectedPole ? (
             <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-5"
             >
                {polesWithColors.map((p) => (
                   <motion.button 
                    key={p.name} 
                    variants={itemVariants}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPole(p.name)} 
                    className="p-10 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[3rem] text-left hover:border-cmc-blue shadow-sm hover:shadow-2xl hover:shadow-cmc-blue/5 relative overflow-hidden group transition-all"
                   >
                      <div className="relative z-10">
                        <div 
                          className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl mb-8 ${p.colorStyle.light} ${p.colorStyle.text} group-hover:scale-110 transition-transform`}
                        >
                          {p.name.charAt(0)}
                        </div>
                        <h3 className="font-black text-2xl text-gray-900 dark:text-white uppercase tracking-tight mb-2 leading-none">{p.name}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Accéder aux spécialités</p>
                        
                        <div className="mt-8 flex items-center gap-2 text-cmc-blue font-black text-[10px] uppercase tracking-widest translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                          Parcourir <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-cmc-blue opacity-[0.02] group-hover:opacity-[0.05] rounded-full transition-all duration-500 scale-0 group-hover:scale-100" />
                   </motion.button>
                ))}
             </motion.div>
          ) : (
             <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="space-y-6"
             >
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between sticky top-20 z-20 backdrop-blur-xl bg-white/90">
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => { if(selectedLevel) setSelectedLevel(null); else if(selectedSpecialty) setSelectedSpecialty(null); else setSelectedPole(null); }} 
                      className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-cmc-blue hover:text-white transition-all active:scale-90"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-cmc-blue text-white uppercase text-[8px] px-2 h-4 font-black">{selectedPole}</Badge>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">
                        {!selectedSpecialty ? "Spécialités" : !selectedLevel ? "Niveaux" : "Groupes"}
                      </h2>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedSpecialty ? 'bg-cmc-blue' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedLevel ? 'bg-cmc-blue' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    <div className={`w-1.5 h-1.5 rounded-full ${selectedGroup ? 'bg-cmc-blue' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                   {(!selectedSpecialty ? specialties : !selectedLevel ? levels : groups).map((item, idx) => (
                      <motion.button 
                        key={item} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => { if(!selectedSpecialty) setSelectedSpecialty(item); else if(!selectedLevel) setSelectedLevel(item); else { setSelectedGroup(item); setIsConfirmed(true); } }} 
                        className="w-full p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between group hover:border-cmc-blue hover:bg-cmc-blue/[0.02] transition-all"
                      >
                         <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-cmc-blue/10 transition-colors">
                              {!selectedSpecialty ? <BookOpen className="w-5 h-5 text-cmc-blue" /> : !selectedLevel ? <Layers className="w-5 h-5 text-indigo-500" /> : <GraduationCap className="w-5 h-5 text-emerald-500" />}
                            </div>
                            <span className="font-bold text-lg text-gray-700 dark:text-gray-200 group-hover:text-cmc-blue transition-colors">
                              {item}
                            </span>
                         </div>
                         <div className="w-8 h-8 rounded-full flex items-center justify-center group-hover:bg-cmc-blue/10 transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-cmc-blue group-hover:translate-x-1 transition-all" />
                         </div>
                      </motion.button>
                   ))}
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Visual Support Info */}
      {!isConfirmed && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1 }}
          className="mt-16 text-center"
        >
          <p className="text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.4em] mb-4">Support & Aide</p>
          <div className="flex justify-center gap-8">
            <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity cursor-help">
              <Shield className="w-5 h-5 mb-1" />
              <span className="text-[8px] font-black uppercase">Sécurisé</span>
            </div>
            <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity cursor-help">
              <RefreshCw className="w-5 h-5 mb-1" />
              <span className="text-[8px] font-black uppercase">Live</span>
            </div>
            <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity cursor-help">
              <Globe className="w-5 h-5 mb-1" />
              <span className="text-[8px] font-black uppercase">Cloud</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default StudentPortal;
