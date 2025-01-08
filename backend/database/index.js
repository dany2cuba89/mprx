// database/index.js
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// Asegúrate de que las variables de entorno estén correctamente configuradas
const supabaseUrl = process.env.SUPABASE_URL;  // Asegúrate de que esta variable esté definida
const supabaseKey = process.env.SUPABASE_KEY;  // Asegúrate de que esta variable esté definida

// Verifica que las variables tengan valores (esto es para debug)
console.log("Supabase URL Backend:", supabaseUrl);
console.log("Supabase Key Backend:", supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);



// Función que ejecuta la actualización de la depreciación
const actualizarDepreciacion = async () => {
  const { data, error } = await supabase
    .rpc('actualizar_depreciacion'); // Suponiendo que tienes una función en Supabase llamada actualizar_depreciacion
  if (error) {
    console.error('Error al actualizar depreciación:', error);
  } else {
    console.log('Depreciación actualizada correctamente:', data);
  }
};

// Configurar el cron job para ejecutarse todos los días a las 8 AM
cron.schedule('0 8 * * *', actualizarDepreciacion);

// Exporta el cliente de supabase para que se pueda usar en otras partes de tu backend
module.exports = supabase;
