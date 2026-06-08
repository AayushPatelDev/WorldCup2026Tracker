import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(url && anon && url.startsWith('http'));

// Single shared client for the whole app.
export const db = configured ? createClient(url, anon) : null;
