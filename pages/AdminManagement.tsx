
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTimetables, fetchAllAdminProfiles, upsertAdminProfile, deleteAdminProfile } from '../services/api';
import { AdminProfile, AdminRole } from '../types';
import { 
  Users, Plus, Trash2, ShieldCheck, Mail, AlertCircle, Edit, 
  CheckCircle2, RefreshCw, Shield, Check, Server, Info
} from '../components/Icons';
import { 
  Button, Input, Table, TableHeader, TableRow, TableHead, TableCell, 
  Modal, ToastContainer, Select, Badge
} from '../components/AdminUI';

type ToastType = { id: string, message: string, type: 'success' | 'error' | 'info' };

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [availablePoles, setAvailablePoles] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Confirmation states
  const [confirmDelete, setConfirmDelete] = useState<AdminProfile | null>(null);
  const [confirmUpdate, setConfirmUpdate] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'POLE_ADMIN' as AdminRole,
    allowedPoles: [] as string[]
  });

  useEffect(() => { loadAdmins(); loadPoles(); }, []);

  useEffect(() => {
    if (isModalOpen && editingAdmin) {
      setFormData({ 
        name: editingAdmin.name, 
        email: editingAdmin.email, 
        role: editingAdmin.role, 
        allowedPoles: editingAdmin.allowedPoles 
      });
    } else if (isModalOpen && !editingAdmin) {
      setFormData({ 
        name: '', 
        email: '', 
        role: 'POLE_ADMIN', 
        allowedPoles: [] 
      });
    }
  }, [isModalOpen, editingAdmin]);

  const loadAdmins = async () => {
    setLoading(true);
    try {
      const data = await fetchAllAdminProfiles();
      setAdmins(data);
    } catch (e) {
      addToast("Erreur lors du chargement de l'équipe.", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadPoles = async () => {
    try {
      const entries = await fetchTimetables();
      const uniquePoles = [...new Set(entries.map(e => e.pole))].sort();
      setAvailablePoles(uniquePoles);
    } catch (e) {
      console.error(e);
    }
  };

  const managedPolesMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    admins.forEach(admin => {
      if (editingAdmin && admin.id === editingAdmin.id) return;
      if (admin.role === 'POLE_ADMIN') {
        admin.allowedPoles.forEach(pole => {
          if (!map[pole]) map[pole] = [];
          map[pole].push(admin.name);
        });
      }
    });
    return map;
  }, [admins, editingAdmin]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAdmin(null);
  };

  const togglePole = (pole: string) => {
    const current = [...formData.allowedPoles];
    if (current.includes(pole)) {
      setFormData({ ...formData, allowedPoles: current.filter(p => p !== pole) });
    } else {
      setFormData({ ...formData, allowedPoles: [...current, pole] });
    }
  };

  const handleSubmitAttempt = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.role === 'POLE_ADMIN' && formData.allowedPoles.length === 0) {
      addToast("Veuillez sélectionner au moins un pôle.", "error");
      return;
    }
    setConfirmUpdate(true);
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const finalAllowedPoles = formData.role === 'SUPER_ADMIN' ? ['ALL'] : formData.allowedPoles;
      
      const profileToSave: AdminProfile = {
        id: editingAdmin ? editingAdmin.id : Math.random().toString(36).substr(2, 9), // En production, utiliser l'ID Firebase
        name: formData.name,
        email: formData.email,
        role: formData.role,
        allowedPoles: finalAllowedPoles,
        isActivated: editingAdmin ? editingAdmin.isActivated : false, // Par défaut inactif pour les nouveaux
        lastLogin: editingAdmin ? editingAdmin.lastLogin : undefined
      };

      await upsertAdminProfile(profileToSave);
      addToast("Équipe synchronisée avec Supabase.", "success");
      await loadAdmins();
      handleCloseModal();
    } catch (err) {
      addToast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setLoading(false);
      setConfirmUpdate(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await deleteAdminProfile(confirmDelete.id);
      addToast("Accès révoqué définitivement.", "success");
      await loadAdmins();
      setConfirmDelete(null);
    } catch (e) {
      addToast("Erreur lors de la révocation.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} removeToast={(id: string) => setToasts(prev => prev.filter(t => t.id !== id))} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Équipe Admin</h1>
          <p className="text-gray-500 font-medium">Gestion des accès et périmètres de responsabilité.</p>
        </div>
        <Button onClick={() => { setEditingAdmin(null); setIsModalOpen(true); }} className="h-12 px-8 rounded-2xl shadow-xl shadow-cmc-blue/20">
          <Plus className="w-5 h-5 mr-2" /> Nouveau Membre
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {loading && admins.length === 0 ? (
          <div className="py-20 text-center"><RefreshCw className="animate-spin mx-auto w-10 h-10 text-cmc-blue" /></div>
        ) : admins.length > 0 ? (
          <Table>
            <TableHeader>
              <tr className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableHead>Administrateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Activation</TableHead>
                <TableHead>Affectation</TableHead>
                <TableHead className="text-right">Gestion</TableHead>
              </tr>
            </TableHeader>
            <tbody>
              {admins.map(admin => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-cmc-blue/10 text-cmc-blue flex items-center justify-center font-black">
                        {admin.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{admin.name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase">{admin.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.role === 'SUPER_ADMIN' ? 'purple' : 'blue'}>{admin.role === 'SUPER_ADMIN' ? 'SUPER' : 'PÔLE'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.isActivated ? 'success' : 'warning'}>{admin.isActivated ? 'ACTIVÉ' : 'EN ATTENTE'}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[250px] flex flex-wrap gap-1">
                      {admin.role === 'SUPER_ADMIN' ? (
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">Accès Total</span>
                      ) : (
                        admin.allowedPoles.map(p => (
                          <span key={p} className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase">{p}</span>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingAdmin(admin); setIsModalOpen(true); }}><Edit className="w-4 h-4 text-cmc-blue" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(admin)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="py-20 text-center">
            <Users className="w-16 h-16 text-gray-200 mx-auto mb-6" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2">Aucun membre d'équipe</h3>
            <p className="text-gray-500 max-w-sm mx-auto">Commencez par ajouter des administrateurs pour gérer les pôles.</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAdmin ? "Modifier Profil" : "Nouveau Membre"}>
        <form onSubmit={handleSubmitAttempt} className="space-y-6">
          <Input 
            label="Nom Complet" 
            value={formData.name} 
            onChange={(e:any) => setFormData({...formData, name: e.target.value})} 
            required 
            placeholder="Ex: M. El Ouazzani"
          />
          <Input 
            label="Email Professionnel" 
            type="email" 
            value={formData.email} 
            onChange={(e:any) => setFormData({...formData, email: e.target.value})} 
            required 
            placeholder="admin@cmc.ma"
            disabled={!!editingAdmin}
          />
          {!editingAdmin && (
             <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
               <p className="text-[10px] font-black uppercase text-gray-400 mb-1">Note de sécurité</p>
               <p className="text-[9px] text-gray-500 font-medium">Le mot de passe par défaut sera <strong>CMC123</strong>. L'administrateur devra le changer à sa première connexion.</p>
             </div>
          )}
          <Select 
            label="Type de compte" 
            value={formData.role} 
            onChange={(v:string) => setFormData({...formData, role: v as AdminRole})} 
            options={[
              {label:'Administrateur de Pôle', value:'POLE_ADMIN'}, 
              {label:'Super Administrateur', value:'SUPER_ADMIN'}
            ]} 
          />

          {formData.role === 'POLE_ADMIN' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                   <Server className="w-3.5 h-3.5 text-cmc-blue" /> Périmètre de responsabilité
                </label>
                <Badge variant="blue" className="text-[9px] font-black">{formData.allowedPoles.length} sélectionnés</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {availablePoles.map(pole => {
                  const isSelected = formData.allowedPoles.includes(pole);
                  const managedBy = managedPolesMap[pole];
                  const isAlreadyManaged = managedBy && managedBy.length > 0;

                  return (
                    <button
                      key={pole}
                      type="button"
                      onClick={() => togglePole(pole)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all group relative overflow-hidden ${
                        isSelected 
                          ? 'bg-cmc-blue border-cmc-blue text-white shadow-lg shadow-cmc-blue/20' 
                          : isAlreadyManaged
                            ? 'bg-orange-50/50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/30'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-cmc-blue'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className={`text-[10px] font-black uppercase truncate pr-2 ${isSelected ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                          {pole}
                        </span>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <div className={`w-3.5 h-3.5 rounded-full border-2 ${isAlreadyManaged ? 'border-orange-400' : 'border-gray-200 dark:border-gray-700'} group-hover:border-cmc-blue`} />
                        )}
                      </div>

                      {isAlreadyManaged && !isSelected && (
                        <div className="flex items-center gap-1 mt-1">
                          <Badge variant="warning" className="text-[7px] px-1 py-0 leading-none h-3 font-black">GÉRÉ</Badge>
                          <span className="text-[8px] text-orange-600/70 dark:text-orange-400/70 font-bold truncate">
                            Par: {managedBy[0]}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl shadow-xl shadow-cmc-blue/20">
            {editingAdmin ? "Enregistrer les modifications" : "Créer le profil administrateur"}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={confirmUpdate} onClose={() => setConfirmUpdate(false)} title="Confirmation de modification">
        <div className="text-center py-4">
          <CheckCircle2 className="w-16 h-16 text-cmc-blue mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase">Vérification de sécurité</h3>
          <p className="text-sm text-gray-500 mb-8">Voulez-vous valider ces nouveaux droits d'accès pour {formData.name} ?</p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-12" onClick={() => setConfirmUpdate(false)}>Annuler</Button>
            <Button className="flex-1 h-12 shadow-lg shadow-cmc-blue/20" onClick={executeSave}>Valider les droits</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Révocation d'accès">
        <div className="text-center py-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase">Suppression définitive</h3>
          <p className="text-sm text-gray-500 mb-8">
            Attention, la suppression de l'accès pour <strong>{confirmDelete?.name}</strong> est immédiate dans la base de données.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-12" onClick={() => setConfirmDelete(null)}>Annuler</Button>
            <Button variant="destructive" className="flex-1 h-12 shadow-lg shadow-red-500/20" onClick={executeDelete}>Révoquer l'accès</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminManagement;
