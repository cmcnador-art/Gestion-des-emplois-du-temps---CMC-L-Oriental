
import { supabase } from './supabase';
import { TimetableEntry, AdminProfile } from '../types';

/**
 * Mapping helper: Supabase columns to our App types
 */
const mapFromDb = (item: any): TimetableEntry | null => {
  if (!item) return null;
  return {
    id: item.id,
    pole: item.pole,
    poleColor: item.pole_color, // Explicitly map the color column
    specialty: item.specialty,
    level: item.level,
    group: item.group_name,
    pdfUrl: item.pdf_url,
    active: item.is_active,
    lastUpdated: item.created_at
  };
};

export const fetchTimetables = async (): Promise<TimetableEntry[]> => {
  const { data, error } = await supabase
    .from('timetables')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Fetch Error:", error);
    throw error;
  }
  return (data || []).map(mapFromDb).filter(Boolean) as TimetableEntry[];
};

export const addTimetable = async (entry: Omit<TimetableEntry, 'id'>) => {
  const { data, error } = await supabase
    .from('timetables')
    .insert([{
      pole: entry.pole.trim(),
      pole_color: entry.poleColor, // Persist the color choice
      specialty: entry.specialty.trim(),
      level: entry.level,
      group_name: entry.group.trim(),
      pdf_url: entry.pdfUrl,
      is_active: entry.active
    }])
    .select();

  if (error) {
    console.error("Supabase Insert Error:", error);
    throw error;
  }
  
  if (!data || data.length === 0) return null;
  return mapFromDb(data[0]);
};

export const updateTimetable = async (entry: TimetableEntry) => {
  const { data, error } = await supabase
    .from('timetables')
    .update({
      pole: entry.pole,
      pole_color: entry.poleColor,
      specialty: entry.specialty,
      level: entry.level,
      group_name: entry.group,
      pdf_url: entry.pdfUrl,
      is_active: entry.active
    })
    .eq('id', entry.id)
    .select();

  if (error) throw error;
  return mapFromDb(data[0]);
};

export const deleteTimetablesByFilter = async (filterData: any) => {
  if (filterData.id) {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', filterData.id);
    if (error) throw error;
  } else if (filterData.pole) {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('pole', filterData.pole);
    if (error) throw error;
  }
};

export const uploadTimetablePdf = async (file: File, fileName: string): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filePath = `${Date.now()}_${cleanFileName}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('timetables')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      if (error.message.includes('row-level security')) {
        throw new Error("Erreur de Sécurité (RLS) : Vous devez autoriser l'insertion dans le bucket 'timetables' via l'Editeur SQL de Supabase.");
      }
      throw new Error(`Erreur Upload: ${error.message}.`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('timetables')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err: any) {
    throw err;
  }
};

// --- ADMIN PROFILES MANAGEMENT ---

export const fetchAdminProfile = async (uid: string): Promise<AdminProfile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error) return null;
  
  return {
    id: data.id,
    name: data.full_name,
    email: data.email,
    role: data.role,
    allowedPoles: data.allowed_poles || [],
    isActivated: data.is_activated,
    lastLogin: data.last_login
  };
};

export const updateAdminProfile = async (uid: string, updates: Partial<AdminProfile>) => {
  const dbUpdates: any = {};
  if (updates.name !== undefined) dbUpdates.full_name = updates.name;
  if (updates.isActivated !== undefined) dbUpdates.is_activated = updates.isActivated;
  if (updates.lastLogin !== undefined) dbUpdates.last_login = updates.lastLogin;
  if (updates.allowedPoles !== undefined) dbUpdates.allowed_poles = updates.allowedPoles;
  if (updates.role !== undefined) dbUpdates.role = updates.role;

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', uid);

  if (error) throw error;
};

export const fetchAllAdminProfiles = async (): Promise<AdminProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  if (error) throw error;

  return (data || []).map(d => ({
    id: d.id,
    name: d.full_name,
    email: d.email,
    role: d.role,
    allowedPoles: d.allowed_poles || [],
    isActivated: d.is_activated,
    lastLogin: d.last_login
  }));
};

export const upsertAdminProfile = async (profile: AdminProfile) => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      full_name: profile.name,
      email: profile.email,
      role: profile.role,
      allowed_poles: profile.allowedPoles,
      is_activated: profile.isActivated,
      last_login: profile.lastLogin
    });

  if (error) throw error;
};

export const deleteAdminProfile = async (uid: string) => {
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', uid);

  if (error) throw error;
};
