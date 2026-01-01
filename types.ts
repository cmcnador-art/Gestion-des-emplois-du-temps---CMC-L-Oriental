
export interface TimetableEntry {
  id: string;
  pole: string;
  poleColor?: string; // Persisted color choice
  specialty: string;
  level: string;
  group: string;
  pdfUrl: string;
  active: boolean;
  lastUpdated?: string; // Format ISO ou DD/MM/YYYY
}

export interface Teacher {
  name: string;
  modules: string[];
}

export interface ScheduleSlot {
  day: string;
  time: string;
  teacher: string;
  room: string;
  module: string;
}

export interface ScannedMetadata {
  fileName: string;
  detectedPole: string;
  detectedGroup: string;
  idCode: string;
  period: string;
  teachers: string[];
  rooms: string[];
  modules: string[];
  occupancyRate: number;
  fullSchedule?: ScheduleSlot[];
}

export interface AnalysisResult {
  totalGroups: number;
  activeGroups: number;
  inactiveGroups: number;
  latestScans: ScannedMetadata[];
}

export type AdminRole = 'SUPER_ADMIN' | 'POLE_ADMIN';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  allowedPoles: string[];
  isActivated: boolean;
  lastLogin?: string;
}

export interface Pole {
  id: string;
  name: string;
  color: string;
}

export interface Specialty {
  id: string;
  poleId: string;
  name: string;
}

export interface Level {
  id: string;
  specialtyId: string;
  name: string;
}

export interface Group {
  id: string;
  levelId: string;
  name: string;
  pdfUrl: string;
  active: boolean;
  lastUpdated: Date;
}
