
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Importations Firebase pour la création de compte
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
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

// Configuration pour l'instance secondaire Firebase (nécessaire pour créer un user sans se déconnecter)
const firebaseConfig = {
  apiKey: "AIzaSyBxVxVOI81XB1Fs2mhoG3dL0SASAOO6N2U",
  authDomain: "cmc-oriental-app.firebaseapp.com",
  projectId: "cmc-oriental-app",
  storageBucket: "cmc-oriental-app.firebasestorage.app",
  messagingSenderId: "708143742384",
  appId: "1:708143742384:web:8be08c1f2b0d68d798ea75"
};

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [availablePoles, setAvailablePoles] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
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
    let firebaseUid = editingAdmin?.id;

    try {
      // ÉTAPE 1 : Si c'est un nouveau membre, on le crée d'abord dans Firebase Auth
      if (!editingAdmin) {
        // Initialisation de l'app secondaire pour ne pas interférer avec la session du Super Admin
        const secondaryAppName = "secondary-" + Date.now();
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
          // Création du compte dans Firebase avec le mot de passe par défaut
          const userCredential = await createUserWithEmailAndPassword(
            secondaryAuth, 
            formData.email, 
            "CMC123"
          );
          firebaseUid = userCredential.user.uid;
          
          // Déconnexion immédiate de l'app secondaire
          await signOut(secondaryAuth);
        } catch (fbError: any) {
          if (fbError.code === 'auth/email-already-in-use') {
            throw new Error("Cet email est déjà utilisé dans Firebase Auth. Si le profil Supabase manque, contactez le support.");
          }
          throw fbError;
        }
      }

      // ÉTAPE 2 : On enregistre le profil dans Supabase avec le vrai UID Firebase
      const finalAllowedPoles = formData.role === 'SUPER_ADMIN' ? ['ALL'] : formData.allowedPoles;
      
      const profileToSave: AdminProfile = {
        id: firebaseUid!, 
        name: formData.name,
        email: formData.email,
        role: formData.role,
        allowedPoles: finalAllowedPoles,
        isActivated: editingAdmin ? editingAdmin.isActivated : false,
        lastLogin: editingAdmin ? editingAdmin.lastLogin : undefined
      };

      await upsertAdminProfile(profileToSave);
      addToast(editingAdmin ? "Profil mis à jour." : "Compte créé avec succès dans Firebase & Supabase.", "success");
      
      await loadAdmins();
      handleCloseModal();
    } catch (err: any) {
      console.error("Erreur de sauvegarde complète:", err);
      addToast(err.message || "Erreur lors de la synchronisation des comptes.", "error");
    } finally {
      setLoading(false);
      setConfirmUpdate(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    setLoading(true);
    try {
      // Note: La suppression dans Firebase Auth nécessite généralement le SDK Admin ou une fonction cloud.
      // Ici on révoque uniquement l'accès dans Supabase pour bloquer l'entrée.
      await deleteAdminProfile(confirmDelete.id);
      addToast("Accès révoqué dans la base de données.", "success");
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
          <p className="text-gray-500 font-medium">Gestion automatisée Firebase Auth & Supabase.</p>
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
             <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-dashed border-blue-100 dark:border-blue-800">
               <div className="flex items-center gap-2 mb-1">
                 <ShieldCheck className="w-4 h-4 text-cmc-blue" />
                 <p className="text-[10px] font-black uppercase text-cmc-blue tracking-widest">Liaison automatique Cloud</p>
               </div>
               <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                 Cette action va créer un compte dans **Firebase Auth** et synchroniser le profil dans **Supabase**. 
                 Mot de passe par défaut : <strong className="text-cmc-blue">CMC123</strong>
               </p>
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
            {loading ? <RefreshCw className="animate-spin w-5 h-5" /> : (editingAdmin ? "Enregistrer les modifications" : "Créer les comptes Cloud")}
          </Button>
        </form>
      </Modal>

      <Modal isOpen={confirmUpdate} onClose={() => setConfirmUpdate(false)} title="Confirmation Cloud">
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-cmc-blue rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase">Prêt pour la synchronisation</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-4">
            L'application va créer les accès sécurisés pour <strong>{formData.name}</strong>. 
            Il/Elle pourra se connecter immédiatement après validation.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 h-12 rounded-xl" onClick={() => setConfirmUpdate(false)}>Annuler</Button>
            <Button className="flex-1 h-12 shadow-lg shadow-cmc-blue/20 rounded-xl" onClick={executeSave}>Démarrer la création</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Révocation d'accès">
        <div className="text-center py-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 uppercase">Suppression de profil</h3>
          <p className="text-sm text-gray-500 mb-8">
            Révoquer l'accès pour <strong>{confirmDelete?.name}</strong>. 
            <br/><span className="text-[10px] text-red-500 uppercase font-bold mt-2 block">Note: Le compte Firebase Auth doit être supprimé manuellement via la console Firebase pour une sécurité totale.</span>
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
