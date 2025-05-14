import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://djtriaizzxfknrfsogbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqdHJpYWl6enhma25yZnNvZ2JzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMjcyMTMsImV4cCI6MjA2MjgwMzIxM30.L80d5pvNZ_fCZF9WucvgvUIK729wgleX9m0I5buR84w';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 