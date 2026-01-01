
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X, CheckCircle2, AlertCircle } from './Icons';

// --- Card ---
export const Card = ({ children, className = '', ...props }: any) => (
  <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: any) => (
  <div className={`p-6 border-b border-gray-50 dark:border-gray-800 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={`font-semibold text-lg text-gray-900 dark:text-white tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

// --- Badge ---
export const Badge = ({ children, variant = 'default', className = '' }: any) => {
  const styles = {
    default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    success: "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
    warning: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    blue: "bg-[#31a1b8]/10 text-[#31a1b8] border border-[#31a1b8]/20",
    purple: "bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
    outline: "bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant as keyof typeof styles]} ${className}`}>
      {children}
    </span>
  );
};

// --- Button ---
export const Button = ({ children, variant = 'default', size = 'default', className = '', ...props }: any) => {
  const base = "inline-flex items-center justify-center font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:pointer-events-none rounded-lg active:scale-95";
  const variants = {
    default: "bg-[#31a1b8] text-white hover:bg-[#288a9e] focus:ring-[#31a1b8] shadow-sm shadow-[#31a1b8]/30",
    secondary: "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-200 dark:focus:ring-gray-700",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-500/30",
    outline: "border border-gray-200 dark:border-gray-700 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-900 dark:text-white"
  };
  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md text-sm",
    xs: "h-7 px-2 rounded text-xs",
    lg: "h-12 px-8 rounded-xl text-lg",
    icon: "h-10 w-10"
  };

  return (
    <motion.button 
      className={`${base} ${variants[variant as keyof typeof variants]} ${sizes[size as keyof typeof sizes]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// --- Form Elements ---
export const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <input 
      className={`flex h-10 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#31a1b8]/20 dark:focus:ring-[#31a1b8]/40 focus:border-[#31a1b8] dark:focus:border-[#31a1b8] transition-all ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-500">{error}</span>}
  </div>
);

export const Select = ({ label, options, value, onChange, className = '', ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
    <div className="relative">
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className={`flex h-10 w-full appearance-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 pr-8 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#31a1b8]/20 dark:focus:ring-[#31a1b8]/40 focus:border-[#31a1b8] dark:focus:border-[#31a1b8] transition-all ${className}`}
        {...props}
      >
        <option value="" disabled>Sélectionner...</option>
        {options.map((opt: any) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
            {typeof opt === 'string' ? opt : opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
);

// --- Table ---
export const Table = ({ children, className = '' }: any) => (
  <div className="w-full overflow-auto">
    <table className={`w-full text-sm text-left ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children }: any) => (
  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 [&_tr]:border-b">
    {children}
  </thead>
);

export const TableRow = ({ children, className = '', ...props }: any) => (
  <motion.tr 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${className}`} 
    {...props}
  >
    {children}
  </motion.tr>
);

export const TableHead = ({ children, className = '' }: any) => (
  <th className={`h-10 px-4 text-left align-middle font-medium text-gray-500 dark:text-gray-400 [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }: any) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </td>
);

// --- Collapsible ---
export const Collapsible = ({ title, children, defaultOpen = false, count, icon, actions, className = '' }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900 mb-3 ${className}`}>
      <div 
        className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
           <motion.div 
             animate={{ rotate: isOpen ? 90 : 0 }}
             transition={{ duration: 0.2 }}
           >
             <ChevronRight className="w-5 h-5 text-gray-400" />
           </motion.div>
           {icon}
           <h4 className="font-semibold text-gray-900 dark:text-white">{title}</h4>
           {count !== undefined && <Badge variant="default" className="ml-2">{count}</Badge>}
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
           {actions}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Modal ---
export const Modal = ({ isOpen, onClose, title, children }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800"
        >
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// --- Toast Notification ---
export const ToastContainer = ({ toasts, removeToast }: any) => (
  <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2">
    <AnimatePresence>
      {toasts.map((toast: any) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${
            toast.type === 'success' ? 'bg-white dark:bg-gray-800 border-green-200 dark:border-green-900 text-green-800 dark:text-green-300' :
            toast.type === 'error' ? 'bg-white dark:bg-gray-800 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300' :
            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);
