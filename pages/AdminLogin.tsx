
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithPopup, updatePassword } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { fetchAdminProfile, updateAdminProfile } from '../services/api';
import { ChevronRight, ShieldCheck, AlertCircle, RefreshCw, Lock, Mail, CheckCircle2, Eye, EyeOff } from '../components/Icons';
import { Button, Input } from '../components/AdminUI';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activationMode, setActivationMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Récupération du profil persistant dans Supabase
      const profile = await fetchAdminProfile(user.uid);
      
      if (!profile) {
        throw new Error("Profil administrateur non trouvé dans la base de données. Contactez un Super Admin.");
      }

      // Stockage temporaire du profil
      localStorage.setItem('adminProfile', JSON.stringify(profile));
      localStorage.setItem('adminToken', await user.getIdToken());

      // Vérification de l'activation
      if (!profile.isActivated) {
        setActivationMode(true);
        setIsLoading(false);
        return;
      }

      // Mise à jour de la date de dernière connexion
      await updateAdminProfile(user.uid, { lastLogin: new Date().toISOString() });
      
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message.includes('auth/invalid-credential') ? "Identifiants incorrects." : err.message);
      setIsLoading(false);
    }
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Session expirée.");

      // Mise à jour dans Firebase Auth
      await updatePassword(user, newPassword);
      
      // Mise à jour du flag d'activation dans Supabase
      await updateAdminProfile(user.uid, { 
        isActivated: true, 
        lastLogin: new Date().toISOString() 
      });

      // Mettre à jour le profil local
      const stored = localStorage.getItem('adminProfile');
      if (stored) {
        const p = JSON.parse(stored);
        p.isActivated = true;
        localStorage.setItem('adminProfile', JSON.stringify(p));
      }

      navigate('/admin/dashboard');
    } catch (err: any) {
      setError("Erreur d'activation : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const profile = await fetchAdminProfile(user.uid);
      if (!profile) {
         throw new Error("Accès refusé. Aucun profil administrateur lié à ce compte Google.");
      }

      localStorage.setItem('adminToken', await user.getIdToken());
      localStorage.setItem('adminProfile', JSON.stringify(profile));
      
      await updateAdminProfile(user.uid, { lastLogin: new Date().toISOString() });
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || "Échec de la connexion Google.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px] border border-gray-100 dark:border-gray-800">
        
        <div className="lg:flex-1 bg-gray-950 relative flex items-center justify-center p-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cmc-blue/20 to-blue-900/40 z-10" />
          <div className="relative z-20 text-center max-w-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <img src="logo.svg" alt="CMC" className="w-28 h-28 mx-auto mb-8" />
              <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">Administration CMC</h2>
              <p className="text-gray-400 font-medium mb-10 leading-relaxed">Plateforme de gestion centralisée pour le CMC Oriental.</p>
              
              <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cmc-blue/20 rounded-xl"><ShieldCheck className="w-5 h-5 text-cmc-blue" /></div>
                  <span className="text-xs font-black text-white uppercase tracking-widest">Sécurité Cloud</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase tracking-wider">
                  Accès restreint. Vos activités sont tracées pour garantir la fiabilité des emplois du temps étudiants.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="flex-[1.2] flex flex-col justify-center p-8 lg:p-20 bg-white dark:bg-gray-900">
          <div className="max-w-md mx-auto w-full">
            <AnimatePresence mode="wait">
              {!activationMode ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter mb-10 uppercase">Connexion Admin</h1>

                  <button 
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-4 w-full h-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-black uppercase tracking-widest text-gray-700 dark:text-gray-200">Continuer avec Google</span>
                  </button>

                  <div className="relative flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OU PAR EMAIL</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Mail className="w-3" /> Email</label>
                      <input 
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 px-5 bg-gray-50 dark:bg-gray-800 border rounded-[1.2rem] outline-none focus:border-cmc-blue dark:text-white"
                        required 
                        placeholder="admin@cmc.ma"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-400 flex items-center gap-2"><Lock className="w-3" /> Mot de passe</label>
                      <div className="relative">
                        <input 
                          type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-14 px-5 bg-gray-50 dark:bg-gray-800 border rounded-[1.2rem] outline-none focus:border-cmc-blue dark:text-white"
                          required 
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-red-500 text-[10px] font-black uppercase p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button 
                      type="submit" disabled={isLoading}
                      className="w-full h-16 bg-gray-900 dark:bg-cmc-blue text-white font-black uppercase tracking-widest rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" /> : <><span>Se connecter</span> <ChevronRight className="w-5 h-5" /></>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="activation-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800">
                    <div className="flex items-center gap-3 mb-4">
                      <CheckCircle2 className="w-6 h-6 text-cmc-blue" />
                      <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Activation du compte</h3>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                      C'est votre première connexion avec le mot de passe standard. Pour activer votre compte, veuillez définir un nouveau mot de passe sécurisé.
                    </p>
                  </div>

                  <form onSubmit={handleActivation} className="space-y-5">
                    <Input 
                      label="Nouveau mot de passe" 
                      type="password" 
                      value={newPassword} 
                      onChange={(e:any) => setNewPassword(e.target.value)} 
                      required 
                      placeholder="8 caractères min."
                    />
                    <Input 
                      label="Confirmer le mot de passe" 
                      type="password" 
                      value={confirmNewPassword} 
                      onChange={(e:any) => setConfirmNewPassword(e.target.value)} 
                      required 
                      placeholder="Répétez le mot de passe"
                    />

                    {error && <div className="text-red-500 text-xs font-bold uppercase p-4 bg-red-50 rounded-xl">{error}</div>}

                    <Button type="submit" disabled={isLoading} className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest">
                      {isLoading ? <RefreshCw className="animate-spin" /> : "Activer mon compte"}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
