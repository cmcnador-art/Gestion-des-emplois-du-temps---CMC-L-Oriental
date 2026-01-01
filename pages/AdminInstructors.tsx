
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetables } from '../services/api';
import { analyzeTimetables } from '../services/analysis';
import { TimetableEntry, ScheduleSlot } from '../types';
import { 
  Users, Search, GraduationCap, Mail, Info, 
  RefreshCw, MapPin, BookOpen, Layers, Filter
} from '../components/Icons';
import { 
  Button, Card, Badge, Input, ToastContainer 
} from '../components/AdminUI';

interface TeacherData {
  name: string;
  pole: string;
  modules: string[];
  groups: string[];
  rooms: string[];
}

const AdminInstructors: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  useEffect(() => {
    loadInstructors();
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const loadInstructors = async () => {
    setLoading(true);
    try {
      const entries = await fetchTimetables();
      const analysis = await analyzeTimetables(entries);
      
      const teacherMap: Record<string, TeacherData> = {};

      analysis.latestScans.forEach(scan => {
        if (!scan.fullSchedule) return;
        
        scan.fullSchedule.forEach(slot => {
          if (!slot.teacher || slot.teacher === "Non défini") return;
          
          const key = `${slot.teacher}-${scan.detectedPole}`;
          if (!teacherMap[key]) {
            teacherMap[key] = {
              name: slot.teacher,
              pole: scan.detectedPole,
              modules: [],
              groups: [],
              rooms: []
            };
          }
          
          if (!teacherMap[key].modules.includes(slot.module)) teacherMap[key].modules.push(slot.module);
          if (!teacherMap[key].groups.includes(scan.detectedGroup)) teacherMap[key].groups.push(scan.detectedGroup);
          if (!teacherMap[key].rooms.includes(slot.room)) teacherMap[key].rooms.push(slot.room);
        });
      });

      setTeachers(Object.values(teacherMap).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (e) {
      addToast("Erreur lors de l'extraction des formateurs.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(t => 
      t.name.toLowerCase().includes(q) || 
      t.pole.toLowerCase().includes(q) ||
      t.modules.some(m => m.toLowerCase().includes(q)) ||
      t.groups.some(g => g.toLowerCase().includes(q))
    );
  }, [teachers, searchQuery]);

  return (
    <div className="space-y-6 pb-20">
      <ToastContainer toasts={toasts} removeToast={(id: string) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Corps Enseignant</h1>
          <p className="text-gray-500 font-medium italic">Liste automatisée basée sur les scans d'emplois du temps.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Nom, pôle, module..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-cmc-blue/20"
            />
          </div>
          <Button variant="secondary" onClick={loadInstructors} disabled={loading} className="h-12 px-5 rounded-2xl">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <RefreshCw className="w-12 h-12 text-cmc-blue animate-spin mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Analyse du corps enseignant...</p>
          </motion.div>
        ) : filteredTeachers.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredTeachers.map((teacher, idx) => (
              <motion.div
                key={`${teacher.name}-${teacher.pole}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card className="h-full border-none shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="w-14 h-14 bg-gradient-to-br from-cmc-blue to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cmc-blue/20">
                        {teacher.name.charAt(0)}
                      </div>
                      <Badge variant="blue" className="text-[8px] font-black uppercase tracking-widest">{teacher.pole}</Badge>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-4 group-hover:text-cmc-blue transition-colors">
                      {teacher.name}
                    </h3>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          <BookOpen className="w-3 h-3 text-cmc-blue" /> Modules enseignés
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {teacher.modules.slice(0, 3).map(m => (
                            <span key={m} className="px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-md text-[9px] font-bold text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                              {m}
                            </span>
                          ))}
                          {teacher.modules.length > 3 && (
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-[9px] font-black rounded-md">
                              +{teacher.modules.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          <Layers className="w-3 h-3 text-indigo-500" /> Groupes affectés
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {teacher.groups.slice(0, 4).map(g => (
                            <span key={g} className="px-2 py-0.5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-md text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                              {g}
                            </span>
                          ))}
                          {teacher.groups.length > 4 && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 text-[9px] font-black rounded-md">
                              +{teacher.groups.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {teacher.rooms.length} Salle(s) habituelle(s)
                    </div>
                    <Button size="xs" variant="ghost" className="text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Consulter Planning
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center bg-white dark:bg-gray-900 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2">Aucun formateur trouvé</h3>
            <p className="text-gray-500 max-w-sm mx-auto font-medium">L'extraction automatique n'a pas trouvé de formateurs correspondant à votre recherche.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInstructors;
