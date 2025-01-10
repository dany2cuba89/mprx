/**
 * Formatea una fecha en el formato "DD/MM/YYYY".
 * @param {string|Date} fecha - La fecha a formatear.
 * @returns {string} - La fecha formateada.
 */
export const formatFecha = (fecha) => {
  const date = new Date(fecha);
  const dia = String(date.getDate()).padStart(2, "0");
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const anio = date.getFullYear();
  return `${dia}/${mes}/${anio}`;
};

/**
 * Formatea un número como moneda en CUP.
 * @param {number} cantidad - El número a formatear.
 * @returns {string} - La cantidad formateada como moneda.
 */
export const formatMoneda = (cantidad) => {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "CUP",
  }).format(cantidad);
};

/**
 * Capitaliza la primera letra de un texto.
 * @param {string} texto - El texto a capitalizar.
 * @returns {string} - El texto con la primera letra en mayúscula.
 */
export const capitalize = (texto) => {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};
