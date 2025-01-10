import { supabase } from "./supabase";

// Registrar una factura de compra
export const registrarFacturaCompra = async (factura) => {
  try {
    const { data, error } = await supabase.rpc("registrar_compra", factura);

    if (error) throw new Error(error.message);

    return data;
  } catch (error) {
    console.error("Error al registrar la factura:", error.message);
    throw error;
  }
};
// Obtener todas las facturas
export const getFacturas = async () => {
  const { data, error } = await supabase.from("facturas").select("*");
  if (error) throw new Error(error.message);
  return data;
};
// Obtener facturas por tipo (compra o venta)
export const getFacturasPorTipo = async (tipo, { fechaInicio = null, fechaFin = null } = {}) => {
  let query = supabase
    .from("facturas")
    .select(`
      *,
      usuarios:usuarios (nombre_completo)
    `)
    .eq("tipo", tipo);

  if (fechaInicio && fechaFin) {
    const inicioHoraCompleta = `${fechaInicio}T00:00:00`;
    const finHoraCompleta = `${fechaFin}T23:59:59`;

    if (fechaInicio === fechaFin) {
      // Mismo día: usar rango exacto para todo el día
      query = query.gte("fecha", inicioHoraCompleta).lte("fecha", finHoraCompleta);
    } else {
      // Rango de fechas: usar >= y <=
      query = query.gte("fecha", inicioHoraCompleta).lte("fecha", finHoraCompleta);
    }
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  console.log("Facturas obtenidas del backend:", data);

  return data;
};
// Agregar una factura
export const addFactura = async (factura) => {
  const { data, error } = await supabase.from("facturas").insert([factura]);
  if (error) throw new Error(error.message);
  return data;
};

// Filtrar facturas por rango de fechas
export const getFacturasPorFechas = async (fechaInicio, fechaFin) => {
  const { data, error } = await supabase
    .from("facturas")
    .select("*")
    .gte("fecha", fechaInicio)
    .lte("fecha", fechaFin);

  if (error) throw new Error(error.message);
  return data;
};
