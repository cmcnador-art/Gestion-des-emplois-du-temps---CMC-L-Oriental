
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetables, addTimetable, deleteTimetablesByFilter, uploadTimetablePdf } from '../services/api';
import { supabase } from '../services/supabase';
import { DEFAULT_COLOR_ORDER, UI_COLORS } from '../constants';
import { TimetableEntry } from '../types';
import { 
  Plus, Search, Trash2, X, Edit,
  ChevronRight, FileText, AlertCircle, RefreshCw, BookOpen, Download, Check
} from '../components/Icons';
import { 
  Button, Input, Badge, 
  Collapsible, Modal, ToastContainer, Select
} from '../components/AdminUI';

type ToastType = { id: string, message: string, type: 'success' | 'error' | 'info' };

interface TreeStructure {
  poles: {
    name: string;
    color: string;
    specialties: {
      name: string;
      levels: string[];
    }[];
  }[];
}

const AdminStructure: React.FC = () => {
  const [rawData, setRawData] = useState<TimetableEntry[]>([]);
  const [academicTree, setAcademicTree] = useState<TreeStructure>({ poles: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'ADD_POLE' | 'EDIT_POLE' | 'ADD_SPECIALTY' | 'ADD_GROUP' | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{type: string, id: string, name: string} | null>(null);
  
  const [formValues, setFormValues] = useState({
    poleName: '',
    poleColor: DEFAULT_COLOR_ORDER[0],
    originalPoleName: '',
    specName: '',
    levelName: '1ère Année',
    groupName: '',
    pdfUrl: '',
    file: null as File | null
  });

  useEffect(() => { 
    loadStructureAndData(); 
  }, []);

  const loadStructureAndData = async () => {
    setLoading(true);
    try {
      const entries = await fetchTimetables();
      setRawData(entries);

      const tree: TreeStructure = { poles: [] };
      entries.forEach(e => {
        let pole = tree.poles.find(p => p.name === e.pole);
        if (!pole) {
          pole = { 
            name: e.pole, 
            color: e.poleColor || DEFAULT_COLOR_ORDER[tree.poles.length % DEFAULT_COLOR_ORDER.length], 
            specialties: [] 
          };
          tree.poles.push(pole);
        }
        let spec = pole.specialties.find(s => s.name === e.specialty);
        if (!spec) {
          spec = { name: e.specialty, levels: [] };
          pole.specialties.push(spec);
        }
        if (!spec.levels.includes(e.level)) spec.levels.push(e.level);
      });
      
      setAcademicTree(tree);
    } catch (e) { 
      addToast("Erreur de connexion à Supabase.", "error"); 
    } finally { 
      setLoading(false); 
    }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormValues(prev => ({ ...prev, file: e.target.files![0] }));
    }
  };

  const validateUniqueness = () => {
    const pName = formValues.poleName.trim().toUpperCase();
    const sName = formValues.specName.trim();
    const gName = formValues.groupName.trim();

    if (modalType === 'ADD_POLE' || (modalType === 'EDIT_POLE' && pName !== formValues.originalPoleName.toUpperCase())) {
      const existingPole = academicTree.poles.find(p => p.name.toUpperCase() === pName);
      if (existingPole) return `Le pôle "${pName}" existe déjà.`;
    }

    if (modalType === 'ADD_POLE' || modalType === 'EDIT_POLE') {
      const originalPole = academicTree.poles.find(p => p.name === formValues.originalPoleName);
      if (formValues.poleColor !== originalPole?.color) {
        const existingColor = academicTree.poles.find(p => p.color === formValues.poleColor);
        if (existingColor) return "Cette couleur est déjà attribuée à un autre pôle.";
      }
    }

    if (modalType !== 'EDIT_POLE') {
        if (modalType === 'ADD_SPECIALTY' || modalType === 'ADD_POLE') {
           const existingSpec = rawData.find(r => r.specialty.toLowerCase() === sName.toLowerCase() && r.pole.toUpperCase() !== pName);
           if (existingSpec) return `La spécialité "${sName}" appartient déjà au pôle ${existingSpec.pole}.`;
        }
        const existingGroup = rawData.find(r => r.group.toLowerCase() === gName.toLowerCase());
        if (existingGroup) return `Le groupe "${gName}" existe déjà dans le système.`;
    }

    return null;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Strict validation for ADD_POLE, ADD_SPECIALTY, ADD_GROUP to prevent entries without specialty or file
    if (modalType === 'ADD_POLE' || modalType === 'ADD_SPECIALTY' || modalType === 'ADD_GROUP') {
      if (modalType === 'ADD_POLE') {
        if (!formValues.poleName.trim() || !formValues.specName.trim() || !formValues.groupName.trim()) {
          addToast("Veuillez remplir le nom du pôle, de la spécialité et du premier groupe.", "error");
          return;
        }
      }
      if (!formValues.file && !formValues.pdfUrl) {
        addToast("Veuillez uploader un fichier PDF pour l'emploi du temps.", "error");
        return;
      }
    }

    const errorMsg = validateUniqueness();
    if (errorMsg) {
      addToast(errorMsg, "error");
      return;
    }

    setLoading(true);
    try {
      if (modalType === 'EDIT_POLE') {
        const { error } = await supabase
          .from('timetables')
          .update({ 
            pole: formValues.poleName.trim().toUpperCase(), 
            pole_color: formValues.poleColor 
          })
          .eq('pole', formValues.originalPoleName);
        
        if (error) throw error;
        addToast("Pôle mis à jour avec succès.", "success");
      } else {
        let finalPdfUrl = formValues.pdfUrl;

        if (formValues.file) {
          setUploading(true);
          finalPdfUrl = await uploadTimetablePdf(formValues.file, formValues.groupName);
          setUploading(false);
        }

        await addTimetable({
          pole: formValues.poleName.toUpperCase(),
          poleColor: formValues.poleColor,
          specialty: formValues.specName,
          level: formValues.levelName,
          group: formValues.groupName,
          pdfUrl: finalPdfUrl || "#",
          active: true
        });
        addToast("Données synchronisées avec Supabase.", "success");
      }

      await loadStructureAndData();
      handleCloseModal();
    } catch (err) {
      addToast("Échec de l'opération.", "error");
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const openAddModal = (type: 'ADD_POLE' | 'ADD_SPECIALTY' | 'ADD_GROUP', pole?: string, spec?: string) => {
    const poleObj = academicTree.poles.find(p => p.name === pole);
    
    // For new poles, find the first available color that isn't used by another pole
    const usedColors = academicTree.poles.map(p => p.color);
    const availableColor = DEFAULT_COLOR_ORDER.find(c => !usedColors.includes(c)) || DEFAULT_COLOR_ORDER[0];

    setFormValues({
      poleName: pole || '',
      poleColor: poleObj?.color || availableColor,
      originalPoleName: pole || '',
      specName: spec || '',
      levelName: '1ère Année',
      groupName: '',
      pdfUrl: '',
      file: null
    });
    setModalType(type);
  };

  const openEditPoleModal = (poleName: string) => {
    const poleObj = academicTree.poles.find(p => p.name === poleName);
    if (!poleObj) return;
    
    setFormValues({
      poleName: poleObj.name,
      poleColor: poleObj.color,
      originalPoleName: poleObj.name,
      specName: '',
      levelName: '',
      groupName: '',
      pdfUrl: '',
      file: null
    });
    setModalType('EDIT_POLE');
  };

  const handleCloseModal = () => {
    setModalType(null);
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      if (confirmDelete.type === 'GROUP') { 
        await deleteTimetablesByFilter({ id: confirmDelete.id });
      } else if (confirmDelete.type === 'POLE') {
        await deleteTimetablesByFilter({ pole: confirmDelete.id });
      }
      addToast("Données supprimées.", "success");
      await loadStructureAndData();
    } catch (e) { addToast("Erreur lors de la suppression.", "error"); }
    setConfirmDelete(null);
    setLoading(false);
  };

  const filteredPoles = useMemo(() => {
    let result = academicTree.poles;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.specialties.some(s => s.name.toLowerCase().includes(q))
      );
    }
    // Tri alphabétique systématique
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [academicTree.poles, searchQuery]);

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={(id: string) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Structure Académique</h1>
          <p className="text-gray-500 font-medium">Gérez les pôles, spécialités et groupes.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-cmc-blue/20"
            />
          </div>
          <Button onClick={() => openAddModal('ADD_POLE')} className="h-12 px-6 rounded-2xl shadow-lg shadow-cmc-blue/20">
            <Plus className="w-5 h-5 mr-2" /> Nouveau Pôle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredPoles.map(pole => {
          const color = UI_COLORS.find(c => c.id === pole.color) || UI_COLORS[0];
          return (
            <Collapsible 
              key={pole.name}
              title={pole.name}
              icon={<div className={`w-8 h-8 rounded-lg ${color.bg} text-white flex items-center justify-center font-bold`}>{pole.name.charAt(0)}</div>}
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Modifier le pôle" onClick={() => openEditPoleModal(pole.name)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" title="Ajouter une spécialité" onClick={() => openAddModal('ADD_SPECIALTY', pole.name)}><Plus className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" title="Supprimer le pôle" onClick={() => setConfirmDelete({type: 'POLE', id: pole.name, name: pole.name})}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                </div>
              }
            >
              <div className="space-y-4">
                {pole.specialties.map(spec => (
                  <div key={spec.name} className="pl-4 border-l-2 border-gray-100 dark:border-gray-800 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-cmc-blue" /> {spec.name}
                      </h5>
                      <Button variant="ghost" size="xs" onClick={() => openAddModal('ADD_GROUP', pole.name, spec.name)}>+ Groupe</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {rawData.filter(r => r.pole === pole.name && r.specialty === spec.name).map(group => (
                        <div key={group.id} className="group relative flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-cmc-blue transition-all">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{group.group}</span>
                          <span className="text-[10px] text-gray-400">({group.level})</span>
                          <div className="flex items-center gap-1 ml-1">
                             <button onClick={() => window.open(group.pdfUrl, '_blank')} className="p-1 hover:text-cmc-blue" title="Voir PDF"><FileText className="w-3 h-3" /></button>
                             <button onClick={() => setConfirmDelete({type: 'GROUP', id: group.id, name: group.group})} className="p-1 hover:text-red-500" title="Supprimer groupe"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Collapsible>
          );
        })}
      </div>

      <Modal 
        isOpen={!!modalType} 
        onClose={handleCloseModal} 
        title={
          modalType === 'ADD_POLE' ? 'Initialisation d\'un Nouveau Pôle' : 
          modalType === 'EDIT_POLE' ? 'Modifier le Pôle' :
          modalType === 'ADD_SPECIALTY' ? 'Nouvelle Spécialité' : 'Nouveau Groupe'
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {(modalType === 'ADD_POLE' || modalType === 'EDIT_POLE') && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase text-cmc-blue tracking-widest mb-1">Étape 1 : Identité du Pôle</p>
              </div>
              <Input label="Nom du Pôle" name="poleName" value={formValues.poleName} onChange={handleInputChange} required placeholder="Ex: INDUSTRIE" />
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Couleur Distinctive</label>
                <div className="flex flex-wrap gap-2">
                  {UI_COLORS.map(c => {
                    // Check if this color is already used by another pole
                    const isUsed = academicTree.poles.some(p => p.color === c.id);
                    // Allow selecting current color if we are editing the pole
                    const currentPole = academicTree.poles.find(p => p.name === formValues.originalPoleName);
                    const isSelectable = modalType === 'ADD_POLE' ? !isUsed : (!isUsed || c.id === currentPole?.color);
                    
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={!isSelectable}
                        onClick={() => setFormValues(prev => ({...prev, poleColor: c.id}))}
                        className={`w-8 h-8 rounded-full ${c.bg} transition-all relative ${
                          formValues.poleColor === c.id 
                            ? 'ring-2 ring-offset-2 ring-black dark:ring-white scale-110 shadow-lg' 
                            : 'opacity-60 hover:opacity-100'
                        } ${!isSelectable ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                      >
                        {!isSelectable && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-red-500/50 rotate-45" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {modalType === 'ADD_POLE' && (
            <div className="space-y-4 pt-2">
              <div className="pb-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black uppercase text-cmc-blue tracking-widest mb-1">Étape 2 : Premier Contenu</p>
              </div>
              <Input label="Première Spécialité" name="specName" value={formValues.specName} onChange={handleInputChange} required placeholder="Ex: Infrastructure Digitale" />
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Premier Groupe" name="groupName" value={formValues.groupName} onChange={handleInputChange} required placeholder="Ex: ID101" />
                 <Select 
                  label="Niveau" 
                  name="levelName" 
                  value={formValues.levelName} 
                  onChange={(v: string) => setFormValues(prev => ({...prev, levelName: v}))}
                  options={['1ère Année', '2ème Année']}
                />
              </div>

              {/* PDF Section for New Pole */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Emploi du temps (Initial)</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cmc-blue/10 file:text-cmc-blue hover:file:bg-cmc-blue/20 cursor-pointer" required />
              </div>
            </div>
          )}

          {modalType === 'ADD_SPECIALTY' && (
            <div className="space-y-4">
              <Input label="Nom de la Spécialité" name="specName" value={formValues.specName} onChange={handleInputChange} required placeholder="Ex: Développement Digital" />
              <p className="text-[10px] text-gray-400 font-bold uppercase italic mt-1">Note : Une spécialité doit être initialisée avec un premier groupe.</p>
              <div className="grid grid-cols-2 gap-4">
                 <Input label="Code Groupe" name="groupName" value={formValues.groupName} onChange={handleInputChange} required placeholder="Ex: DEV101" />
                 <Select 
                  label="Niveau" 
                  name="levelName" 
                  value={formValues.levelName} 
                  onChange={(v: string) => setFormValues(prev => ({...prev, levelName: v}))}
                  options={['1ère Année', '2ème Année']}
                />
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Emploi du temps (Initial)</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cmc-blue/10 file:text-cmc-blue hover:file:bg-cmc-blue/20 cursor-pointer" required />
              </div>
            </div>
          )}

          {modalType === 'ADD_GROUP' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input label="Nom du Groupe" name="groupName" value={formValues.groupName} onChange={handleInputChange} required placeholder="Ex: DEV101" />
                </div>
                <div className="flex-1">
                  <Select 
                    label="Niveau" 
                    name="levelName" 
                    value={formValues.levelName} 
                    onChange={(v: string) => setFormValues(prev => ({...prev, levelName: v}))}
                    options={['1ère Année', '2ème Année', 'Qualification', 'Spécialisation']}
                  />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Emploi du temps (PDF)</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-cmc-blue/10 file:text-cmc-blue hover:file:bg-cmc-blue/20 cursor-pointer" required />
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading || uploading} className="w-full h-14 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-950 font-black uppercase tracking-widest">
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : (modalType === 'EDIT_POLE' ? 'Mettre à jour' : 'Créer & Enregistrer')}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmation de suppression">
        <div className="p-4 text-center">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10" />
          </div>
          <p className="mb-6 font-medium text-gray-700 dark:text-gray-300">
            Voulez-vous vraiment supprimer <strong className="text-gray-900 dark:text-white">"{confirmDelete?.name}"</strong> ? 
            <br /> <span className="text-xs text-red-500 mt-2 block">Cette action supprimera tout le contenu associé.</span>
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => setConfirmDelete(null)} className="flex-1 h-12 rounded-xl">Annuler</Button>
            <Button variant="destructive" onClick={executeDelete} className="flex-1 h-12 rounded-xl">Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStructure;
