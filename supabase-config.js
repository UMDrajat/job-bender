import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_PROJECT_URL'; // Replace with your Supabase project URL
const supabaseKey = 'YOUR_ANON_KEY'; // Replace with your Supabase anon key

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 