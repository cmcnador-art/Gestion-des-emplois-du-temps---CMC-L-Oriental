
import { createClient } from '@supabase/supabase-js';

// Configuration réelle du projet Supabase CMC Oriental
const supabaseUrl = 'https://nowynhoxjaftpahljrvc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vd3luaG94amFmdHBhaGxqcnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4NjY0MjEsImV4cCI6MjA4MjQ0MjQyMX0.lGSPehGYJdAD6AmSTg6i0pW1v3hU5UpFME16Z7Bktk0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
