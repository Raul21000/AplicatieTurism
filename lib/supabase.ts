import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const YOUR_PROJECT_URL = 'https://bbnoamjnhtdvltbwngug.supabase.co';
const YOUR_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibm9hbWpuaHRkdmx0YnduZ3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5OTQ2MTIsImV4cCI6MjA3OTU3MDYxMn0.n3yLcL-5X9kEA2odULP4KRdb8NR1cqhQMJd7GViGy40';

export const supabase = createClient(YOUR_PROJECT_URL, YOUR_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

