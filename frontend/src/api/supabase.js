import { createClient } from "@supabase/supabase-js";

// Variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Crear cliente de Supabase
export { supabase };
