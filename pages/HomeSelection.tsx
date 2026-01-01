import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, ShieldCheck, ChevronRight, BookOpen, 
  Database, LayoutDashboard, Globe, AlertCircle, 
  CheckCircle2, Server, Activity, TrendingUp, Clock,
  Check, Zap, Coffee, Shield, Mail, FileText, Menu, Search, Lock, Star, Table, ShieldAlert, Layers
} from '../components/Icons';

const HomeSelection: React.FC = () => {
  return (
    <div className="flex flex-col items-center w-full min-h-screen pt-8 pb-24">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16 px-4"
      >
        <motion.img 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          src="logo.svg" 
          alt="CMC Logo" 
          className="w-32 h-32 mx-auto mb-8 drop-shadow-2xl"
        />
        <div className="inline-block mb-4 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-100 dark:border-blue-800">
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cités des Métiers et des Compétences</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-gray-900 dark:text-white mb-6 tracking-tighter">
          CMC <span className="text-cmc-blue">Oriental</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Plateforme officielle de consultation des emplois du temps et gestion administrative de l'Oriental.
        </p>
      </motion.div>

      {/* Main Access Cards */}
      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl px-4 mb-32">
        <Link to="/student" className="group">
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white dark:bg-gray-900 p-10 rounded-[3rem] shadow-2xl shadow-blue-500/10 border border-gray-100 dark:border-gray-800 hover:border-cmc-blue transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 text-cmc-blue rounded-3xl flex items-center justify-center mb-8 group-hover:bg-cmc-blue group-hover:text-white transition-all duration-300">
              <Users className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Espace Étudiant</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 flex-1 font-medium leading-relaxed">
              Consultez votre planning instantanément via QR Code, filtrez par spécialité et accédez à vos documents 24h/7j.
            </p>
            <div className="flex items-center gap-2 text-cmc-blue font-black uppercase text-xs tracking-[0.2em] group-hover:gap-4 transition-all">
              <span>Accès direct</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </Link>

        <Link to="/admin" className="group">
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gray-950 p-10 rounded-[3rem] shadow-2xl shadow-black/50 border border-white/5 hover:border-gray-700 transition-all duration-300 h-full flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 bg-gray-800 text-gray-300 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-gray-900 transition-all duration-300">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">Administration</h2>
            <p className="text-gray-400 mb-8 flex-1 font-medium leading-relaxed">
              Supervision "Live" de l'occupation des salles, gestion de la structure académique et audit des plannings.
            </p>
            <div className="flex items-center gap-2 text-white font-black uppercase text-xs tracking-[0.2em] group-hover:gap-4 transition-all">
              <span>Gestion sécurisée</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* --- SECTION RAPPORT DE PROJET POUR M. EL OUAZZANI SOUFIANE --- */}
      <div className="w-full bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pt-24 pb-32">
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-6xl mx-auto px-6"
        >
          <div className="mb-24 text-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              className="inline-block p-1 bg-gradient-to-r from-cmc-blue to-blue-600 rounded-[2rem] mb-8"
            >
              <div className="bg-white dark:bg-gray-950 px-8 py-10 rounded-[1.8rem]">
                <h3 className="text-xs font-black text-cmc-blue uppercase tracking-[0.4em] mb-4">Rapport de Projet de Fin de Module</h3>
                <p className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-6">
                  À l'attention de M. <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cmc-blue to-blue-500">
                    El Ouazzani Soufiane
                  </span>
                </p>
                <div className="max-w-2xl mx-auto h-px bg-gray-100 dark:bg-gray-800 mb-6" />
                
                {/* PROTOTYPE STATUS */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-[2rem] mb-6 flex flex-col md:flex-row items-center gap-6 text-left max-w-4xl mx-auto">
                  <div className="p-4 bg-green-100 dark:bg-green-900/40 rounded-2xl shrink-0">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase text-green-800 dark:text-green-400 tracking-widest mb-2">Statut du Système : OPÉRATIONNEL</h4>
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium leading-relaxed">
                      Monsieur, nous avons le plaisir de vous informer que le backend de l'application est désormais **entièrement relié à Google Sheets Cloud**. La phase de simulation est terminée ; chaque donnée consultée par les étudiants provient en temps réel de la base de données officielle de l'Oriental.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7 space-y-16">
              
              {/* 1. Couche Firebase & Sécurité */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-2xl">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Sécurité Firebase</h4>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <p>L'application utilise Google Firebase pour la couche de sécurité administrative :</p>
                  <ul className="space-y-3 list-none pl-0">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <span>**Firebase Auth** : Protection des accès par emails authentifiés. Seuls les agents autorisés peuvent modifier les emplois du temps.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                      <span>**Audit Cloud** : Toutes les connexions et modifications sont tracées pour garantir l'intégrité de l'affichage étudiant.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 2. Management Administratif */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-2xl">
                    <ShieldCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Gestion d'Équipe Admin</h4>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <p>L'interface d'administration permet un contrôle total de la plateforme :</p>
                  <ul className="space-y-3 list-none pl-0">
                    <li className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <span>**Contrôle d'Accès (RBAC)** : Distinction entre **Super Admin** (accès total) et **Admin Pôle** (gestion restreinte à un pôle spécifique).</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <span>**Gestion Team** : Création et révocation des accès pour chaque membre du staff administratif en temps réel.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Layers className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
                      <span>**Audit Live** : Supervision instantanée de l'occupation des salles pour optimiser les ressources de la Cité.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3. Base de données Google Sheets */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl">
                    <Database className="w-6 h-6 text-green-600" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Backend Google Sheets Live</h4>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <p>Le moteur de données repose sur une API personnalisée Google Sheets :</p>
                  <ul className="space-y-3 list-none pl-0">
                    <li className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>**Google Apps Script** : Un micro-service qui transforme le tableur en une base de données haute performance accessible 24h/24.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Table className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span>**Zero Latence** : Les données sont mises en cache localement sur les téléphones des étudiants pour une consultation instantanée.</span>
                    </li>
                  </ul>
                </div>
              </section>

              {/* 4. Hébergement Vercel */}
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-black dark:bg-white/10 rounded-2xl">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Déploiement Vercel</h4>
                </div>
                <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                  <p>L'application est servie par l'infrastructure Cloud de Vercel :</p>
                  <ul className="space-y-3 list-none pl-0">
                    <li className="flex items-start gap-3">
                      <Zap className="w-5 h-5 text-cmc-blue shrink-0 mt-0.5" />
                      <span>**Performance** : Diffusion via CDN pour un affichage fluide quel que soit le trafic.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Activity className="w-5 h-5 text-cmc-blue shrink-0 mt-0.5" />
                      <span>**Mises à jour atomiques** : Chaque modification du code est déployée de manière invisible pour l'utilisateur final.</span>
                    </li>
                  </ul>
                </div>
              </section>

            </div>

            {/* Sidebar Technologique */}
            <div className="lg:col-span-5">
              <div className="sticky top-24 space-y-6">
                <div className="bg-gray-950 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                  <div className="relative z-10">
                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-cmc-blue mb-6">Architecture Temps Réel</h4>
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-black text-cmc-blue">R</div>
                        <div>
                          <p className="text-sm font-black">React 19 & Tailwind</p>
                          <p className="text-[10px] text-white/50 font-bold uppercase">Interface Réactive</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Database className="w-5 h-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-black">Google Sheets API</p>
                          <p className="text-[10px] text-white/50 font-bold uppercase">Backend Opérationnel</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-black">Cloud Vercel</p>
                          <p className="text-[10px] text-white/50 font-bold uppercase">Hébergement Production</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cmc-blue/10 rounded-full blur-3xl" />
                </div>

                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20">
                   <div className="flex items-center gap-2 mb-4">
                     <Star className="w-4 h-4 text-yellow-300" />
                     <h4 className="text-xs font-black uppercase tracking-[0.3em]">Bilan Économique</h4>
                   </div>
                  <p className="text-xl font-black leading-tight mb-4">Architecture Cloud Zero MAD</p>
                  <p className="text-[10px] font-medium text-blue-100 leading-relaxed uppercase tracking-wider">
                    L'utilisation des tiers gratuits de Vercel, Firebase et Google Cloud permet une exploitation pérenne sans aucun budget serveur pour l'Oriental.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default HomeSelection;