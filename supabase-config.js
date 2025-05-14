import { createClient } from '@supabase/supabase-js';

const supabaseUrl = '${YOUR_SUPABASE_URL}';
const supabaseKey = '${YOUR_SUPABASE_ANON_KEY}';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 