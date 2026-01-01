
// Fix: Removed incorrect import of UI_COLORS from './types' which caused a name conflict with the local declaration.
export const UI_COLORS = [
  { id: 'blue', label: 'Bleu CMC', bg: 'bg-[#31a1b8]', text: 'text-[#31a1b8]', border: 'border-[#31a1b8]', light: 'bg-[#31a1b8]/10' },
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500', text: 'text-indigo-600', border: 'border-indigo-500', light: 'bg-indigo-50' },
  { id: 'purple', label: 'Violet', bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-500', light: 'bg-purple-50' },
  { id: 'pink', label: 'Rose', bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-500', light: 'bg-pink-50' },
  { id: 'rose', label: 'Bordeaux', bg: 'bg-rose-700', text: 'text-rose-700', border: 'border-rose-700', light: 'bg-rose-50' },
  { id: 'orange', label: 'Orange', bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500', light: 'bg-orange-50' },
  { id: 'amber', label: 'Ambre', bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', light: 'bg-amber-50' },
  { id: 'emerald', label: 'Émeraude', bg: 'bg-emerald-500', text: 'text-emerald-600', border: 'border-emerald-500', light: 'bg-emerald-50' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-500', light: 'bg-cyan-50' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500', text: 'text-teal-600', border: 'border-teal-500', light: 'bg-teal-50' },
];

export const DEFAULT_COLOR_ORDER = UI_COLORS.map(c => c.id);