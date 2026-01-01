
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { fetchTimetables } from '../services/api';
import { UI_COLORS } from '../constants';
import { TimetableEntry, AnalysisResult, ScannedMetadata, ScheduleSlot, AdminProfile } from '../types';
import { analyzeTimetables } from '../services/analysis';
import { 
  Layers, Clock, Activity, 
  RefreshCw, Zap, PieChart, BarChart, 
  ShieldCheck, FileText, Users, MapPin, Coffee, ArrowUpRight, ChevronRight
} from '../components/Icons';
import { Card, Badge, Button, Modal, ToastContainer } from '../components/AdminUI';

type ToastType = { id: string, message: string, type: 'success' | 'error' | 'info' };

const SESSIONS = [
  { id: 1, start: "08:30", end: "11:00", startMin: 8 * 60 + 30, endMin: 11 * 60 },
  { id: 2, start: "11:00", end: "13:30", startMin: 11 * 60, endMin: 13 * 60 + 30 },
  { id: 3, start: "13:30", end: "16:00", startMin: 13 * 60 + 30, endMin: 16 * 60 },
  { id: 4, start: "16:00", end: "18:30", startMin: 16 * 60, endMin: 18 * 60 + 30 },
];
const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const GroupStatusItem: React.FC<{
  group: ScannedMetadata;
  type: 'active' | 'inactive';
  session: ScheduleSlot | null;
  onClick: () => void;
  index: number;
}> = ({ group, type, session, onClick, index }) => {
  const isActive = type === 'active';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.03 }} 
      onClick={isActive ? onClick : undefined}
      className={`p-5 rounded-2xl border transition-all relative overflow-hidden group/item
        ${isActive 
          ? 'border-green-100 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer' 
          : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 cursor-default opacity-80'
        }`}
    >
      <div className="absolute top-0 right-0 p-3 flex items-center gap-2">
        {isActive && (
          <>
            <span className="text-[8px] font-black opacity-0 group-hover/item:opacity-100 transition-opacity uppercase text-green-600">
              Détails
            </span>
            <Zap className="w-4 h-4 text-green-500 animate-pulse" />
          </>
        )}
        {!isActive && <Clock className="w-4 h-4 text-orange-400" />}
      </div>

      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-black text-gray-900 dark:text-white">{group.detectedGroup}</h4>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group.detectedPole}</p>
        </div>
        <Badge variant={isActive ? "success" : "default"} className="text-[9px] font-black uppercase">
          {isActive ? 'LIVE' : 'REPOS'}
        </Badge>
      </div>

      {isActive && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-100/50 dark:border-green-900/20">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[9px] font-black uppercase tracking-wider">
              <Users className="w-3 h-3" /> Formateur
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">{session?.teacher || "Non défini"}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gray-400 text-[9px] font-black uppercase tracking-wider">
              <MapPin className="w-3 h-3" /> Salle
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{session?.room || "Non défini"}</p>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase">
        <div className="flex items-center gap-2">
          {isActive ? <Clock className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
          {isActive ? (session?.time || "En cours") : "Aucune séance"}
        </div>
        {isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />}
      </div>
    </motion.div>
  );
};

const GroupStatusPopup: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'active' | 'inactive';
  groups: ScannedMetadata[];
  onSelectGroup: (group: ScannedMetadata) => void;
  getCurrentSession: (group: ScannedMetadata) => ScheduleSlot | null;
}> = ({ isOpen, onClose, title, type, groups, onSelectGroup, getCurrentSession }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className={`grid grid-cols-1 ${type === 'inactive' ? 'sm:grid-cols-2' : ''} gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar`}>
        {groups.length > 0 ? (
          groups.map((group, idx) => (
            <GroupStatusItem 
              key={group.detectedGroup}
              group={group}
              type={type}
              index={idx}
              session={getCurrentSession(group)}
              onClick={() => onSelectGroup(group)}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            {type === 'active' ? <Coffee className="w-12 h-12 text-gray-200 mx-auto mb-4" /> : <Zap className="w-12 h-12 text-gray-200 mx-auto mb-4" />}
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
              {type === 'active' ? "Aucune séance détectée" : "Tous les groupes sont actifs"}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

const StatCard: React.FC<{ 
  title: string, 
  value: number | string, 
  icon: React.ReactNode, 
  colorName: string, 
  index: number,
  onClick?: () => void,
  subtitle?: string
}> = ({ title, value, icon, colorName, index, onClick, subtitle }) => {
  const color = UI_COLORS.find(c => c.id === colorName) || UI_COLORS[0];
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={`h-full group ${onClick ? "cursor-pointer" : ""}`}
    >
      <Card className="border-none shadow-sm p-6 relative overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-gray-900">
         <div className="relative z-10">
           <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center ${color.light} ${color.text} group-hover:scale-110 transition-all`}>
             {icon}
           </div>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
           <h3 className="text-3xl font-black leading-none mb-2 text-gray-900 dark:text-white">
             {value}
           </h3>
           {subtitle && <p className="text-[10px] font-bold italic truncate text-gray-400">{subtitle}</p>}
         </div>
         <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${color.light} opacity-50 group-hover:scale-150 transition-transform`} />
      </Card>
    </motion.div>
  );
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TimetableEntry[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [viewingStatus, setViewingStatus] = useState<'active' | 'inactive' | null>(null);
  const [poleFilter, setPoleFilter] = useState<string | null>(null);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<ScannedMetadata | null>(null);
  const [currentUser, setCurrentUser] = useState<AdminProfile | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('adminProfile');
    if (stored) setCurrentUser(JSON.parse(stored));
    loadAndScan(); 
  }, []);

  const hasAccessToPole = (poleName: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    return currentUser.allowedPoles.includes(poleName);
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const loadAndScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    try {
      const entries = await fetchTimetables();
      
      // Filtrage des entrées par périmètre
      const profile = JSON.parse(localStorage.getItem('adminProfile') || '{}');
      const filteredEntries = profile.role === 'SUPER_ADMIN' 
        ? entries 
        : entries.filter(e => profile.allowedPoles.includes(e.pole));

      setData(filteredEntries);
      const result = await analyzeTimetables(filteredEntries, (p) => setScanProgress(p));
      setAnalysis(result);
      if (toasts.length === 0 || !isScanning) {
         addToast("Données synchronisées pour votre périmètre.", "success");
      }
    } catch (e) {
      addToast("Erreur lors de la synchronisation des données.", "error");
    } finally {
      setTimeout(() => setIsScanning(false), 500);
    }
  };

  const activeGroups = useMemo(() => {
    let base = analysis?.latestScans.filter(s => s.occupancyRate > 0) || [];
    if (poleFilter) base = base.filter(s => s.detectedPole === poleFilter);
    return base;
  }, [analysis, poleFilter]);

  const inactiveGroups = useMemo(() => analysis?.latestScans.filter(s => s.occupancyRate === 0) || [], [analysis]);

  const getCurrentSessionInfo = (group: ScannedMetadata): ScheduleSlot | null => {
    if (!group.fullSchedule) return null;
    const now = new Date();
    const currentDayName = DAYS[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const session = SESSIONS.find(s => currentMinutes >= s.startMin && currentMinutes < s.endMin);
    return session ? group.fullSchedule.find(slot => slot.day === currentDayName && slot.time.startsWith(session.start)) || null : null;
  };

  const livePoleStats = useMemo(() => {
    if (!analysis) return [];
    const stats: Record<string, { total: number, active: number }> = {};
    analysis.latestScans.forEach(scan => {
      const p = scan.detectedPole;
      if (!stats[p]) stats[p] = { total: 0, active: 0 };
      stats[p].total++;
      if (scan.occupancyRate > 0) stats[p].active++;
    });
    return Object.entries(stats).map(([name, s]) => ({
      name, percentage: Math.round((s.active / s.total) * 100), count: s.active, total: s.total
    })).sort((a, b) => b.percentage - a.percentage);
  }, [analysis]);

  const occupancyRate = analysis && analysis.totalGroups > 0 ? Math.round((analysis.activeGroups / analysis.totalGroups) * 100) : 0;

  return (
    <div className="space-y-8 pb-40">
      <ToastContainer toasts={toasts} removeToast={(id: string) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800">
               <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-wider">Tableau de Bord {currentUser?.role === 'SUPER_ADMIN' ? 'Général' : 'de Pôle'}</span>
            </div>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">CMC <span className="text-blue-600">Admin</span> Hub</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadAndScan} disabled={isScanning} className="rounded-xl border-gray-200 dark:border-gray-800 h-12 px-6">
             <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} /> 
             {isScanning ? 'Scan...' : 'Scanner les PDF'}
          </Button>
          <Button onClick={() => navigate('/admin/structure')} className="shadow-xl shadow-blue-500/20 rounded-xl h-12 px-6">Gérer Structure</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} title="Vos Groupes" value={data.length} icon={<Layers className="w-6 h-6" />} colorName="blue" subtitle="Périmètre affecté" />
        <StatCard index={1} title="En Séance" value={analysis?.activeGroups || 0} icon={<Zap className="w-6 h-6 animate-pulse" />} colorName="green" subtitle="Cliquer pour voir la liste" onClick={() => { setPoleFilter(null); setViewingStatus('active'); }} />
        <StatCard index={2} title="En Repos" value={analysis?.inactiveGroups || 0} icon={<Clock className="w-6 h-6" />} colorName="orange" subtitle="Cliquer pour voir la liste" onClick={() => setViewingStatus('inactive')} />
        <StatCard index={3} title="Taux d'Activité" value={`${occupancyRate}%`} icon={<PieChart className="w-6 h-6" />} colorName="indigo" subtitle="Efficacité Live" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-12">
        {/* Pole Activity Chart */}
        <Card className="p-8 border-none shadow-sm bg-white dark:bg-gray-900 rounded-[2.5rem]">
           <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><BarChart className="w-5 h-5 text-blue-600" /></div>
               <h3 className="font-black text-gray-900 dark:text-white uppercase text-[11px] tracking-[0.2em]">Occupation {currentUser?.role === 'SUPER_ADMIN' ? 'par Pôle' : 'de vos Pôles'}</h3>
             </div>
             <Badge variant="outline" className="font-black text-[9px] uppercase tracking-wider">Cliquable</Badge>
           </div>
           <div className="space-y-6">
             {isScanning ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2 animate-pulse">
                    <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 rounded-full" />
                    <div className="h-2 w-full bg-gray-50 dark:bg-gray-800/50 rounded-full" />
                  </div>
                ))
             ) : (
               livePoleStats.map((stat, idx) => (
                 <div 
                    key={stat.name} 
                    className="space-y-2 group/bar cursor-pointer" 
                    onClick={() => { setPoleFilter(stat.name); setViewingStatus('active'); }}
                  >
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                      <span className="text-gray-600 dark:text-gray-400 truncate w-3/4 group-hover/bar:text-blue-600 transition-colors">{stat.name}</span>
                      <span className="text-blue-600 dark:text-blue-400">{stat.percentage}%</span>
                   </div>
                   <div className="w-full h-2.5 bg-gray-50 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner group-hover/bar:ring-2 ring-blue-500/20 transition-all">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${stat.percentage}%` }} transition={{ duration: 1.2, ease: "easeOut", delay: idx * 0.1 }} className={`h-full relative overflow-hidden ${UI_COLORS[idx % UI_COLORS.length].bg}`}><div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" /></motion.div>
                   </div>
                   <div className="flex justify-between items-center px-1"><span className="text-[9px] font-bold text-gray-400">{stat.count} actifs sur {stat.total}</span></div>
                 </div>
               ))
             )}
           </div>
        </Card>

        {/* System Health */}
        <div className="space-y-6">
          <Card className="p-8 border-none shadow-sm bg-white dark:bg-gray-900 rounded-[2.5rem]">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg"><Activity className="w-5 h-5 text-indigo-500" /></div>
                 <h3 className="font-black text-gray-900 dark:text-white uppercase text-[11px] tracking-[0.2em]">État du Système</h3>
               </div>
               <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] font-black text-green-600 uppercase tracking-widest">En Ligne</span></div>
            </div>
            <div className="space-y-5">
               <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group">
                  <div className="flex items-center gap-3"><ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-blue-500" /><span className="font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px] tracking-widest">Intégrité PDF</span></div>
                  <Badge variant="success" className="font-black tracking-tight">SYNCHRONISÉ</Badge>
               </div>
               <div className="flex items-center justify-between p-5 rounded-3xl bg-gray-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all group">
                  <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-gray-400 group-hover:text-blue-500" /><span className="font-bold text-gray-600 dark:text-gray-400 uppercase text-[10px] tracking-widest">Périmètre Admin</span><Badge variant="outline" className="text-[9px] ml-1">{currentUser?.role}</Badge></div>
                  <span className="font-black text-gray-900 dark:text-white text-xs">{currentUser?.role === 'SUPER_ADMIN' ? 'ACCÈS TOTAL' : 'LIMITÉ'}</span>
               </div>
            </div>
          </Card>
          
          <Card className="p-8 border-none shadow-sm bg-gray-950 dark:bg-blue-900/10 rounded-[2.5rem] relative overflow-hidden">
             <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-black uppercase text-[11px] tracking-[0.3em] mb-2">Gestion Structure</h4>
                  <p className="text-white/50 text-xs font-medium max-w-[200px] leading-relaxed">Modifier les groupes et affectations de votre périmètre.</p>
                </div>
                <Button onClick={() => navigate('/admin/structure')} className="bg-white text-gray-950 hover:bg-gray-100 rounded-2xl h-14 w-14 p-0 shadow-2xl"><FileText className="w-6 h-6" /></Button>
             </div>
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
          </Card>
        </div>
      </div>

      <GroupStatusPopup 
        isOpen={viewingStatus === 'active'}
        onClose={() => { setViewingStatus(null); setPoleFilter(null); }}
        title={poleFilter ? `Séances : ${poleFilter}` : "Groupes Actuellement en Séance"}
        type="active"
        groups={activeGroups}
        onSelectGroup={(g) => setSelectedGroupDetails(g)}
        getCurrentSession={getCurrentSessionInfo}
      />

      <GroupStatusPopup 
        isOpen={viewingStatus === 'inactive'}
        onClose={() => setViewingStatus(null)}
        title="Groupes Actuellement en Repos"
        type="inactive"
        groups={inactiveGroups}
        onSelectGroup={() => {}} 
        getCurrentSession={getCurrentSessionInfo}
      />

      <Modal isOpen={!!selectedGroupDetails} onClose={() => setSelectedGroupDetails(null)} title="Détails de la Séance en Cours">
        {selectedGroupDetails && (() => {
          const session = getCurrentSessionInfo(selectedGroupDetails);
          return (
            <div className="space-y-8 py-2">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                       <Badge variant="outline" className="text-white border-white/20 bg-white/10 font-black tracking-widest">{selectedGroupDetails.detectedPole}</Badge>
                    </div>
                    <h2 className="text-4xl font-black mb-1">{selectedGroupDetails.detectedGroup}</h2>
                    <p className="text-blue-100 font-bold text-sm flex items-center gap-2 italic">
                       <Clock className="w-4 h-4" /> {session?.time || "Période active"}
                    </p>
                  </div>
                  <Zap className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                       <Users className="w-4 h-4 text-blue-500" /> Formateur
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{session?.teacher || "Non défini"}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tight">Affecté au groupe</p>
                  </div>

                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                       <MapPin className="w-4 h-4 text-green-500" /> Localisation
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white">{session?.room || "Salle Non Définie"}</p>
                    <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-tight">Emplacement séance</p>
                  </div>

                  <div className="col-span-full p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                       <FileText className="w-4 h-4" /> Module Enseigné
                    </div>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300 leading-tight">
                       {session?.module || "Non défini"}
                    </p>
                  </div>
               </div>

               <div className="flex items-center justify-between p-4 px-6 bg-gray-900 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-white uppercase tracking-widest">État : Groupe Actif</span>
                 </div>
                 <Button size="xs" variant="secondary" onClick={() => navigate('/admin/structure')} className="text-[10px] font-black uppercase px-4 bg-white/10 text-white border-transparent">Modifier PDF</Button>
               </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
