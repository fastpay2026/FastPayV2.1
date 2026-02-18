import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://klbjyszxifszuwvliilr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtsYmp5c3p4aWZzenV3dmxpaWxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTk2MjYsImV4cCI6MjA4NjgzNTYyNn0.sHijGwdGQNkJCLu8DqDqU9GS8FmnmOzjSS_sREs9usk;'


export const supabase = createClient(supabaseUrl, supabaseAnonKey);

