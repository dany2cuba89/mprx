import { supabase } from "./supabase"; // Asegúrate de configurar Supabase correctamente
/*Obtiene todas las solicitudes de compra desde la tabla `solicitudes_compra`.*/
export const getSolicitudesCompra = async () => {
  const { data, error } = await supabase.from("solicitudes_compra").select("*");

  if (error) {
    throw new Error(`Error al obtener solicitudes: ${error.message}`);
  }

  return data;
};

export const getSolicitudesComprarecep = async () => {
  const { data, error } = await supabase
    .from("solicitudes_compra")
    .select(`
      id,
      id_proveedor,
      proveedores (nombre_o_razon_social),
      estado_solicitud
    `); // Quita la coma extra

  if (error) {
    console.error("Error al obtener solicitudes:", error);
    return [];
  }

  return data; // Devolvemos los datos al frontend
};

/* Registra una nueva solicitud de compra en la tabla `solicitudes_compra`.*/
export const registerSolicitudCompra = async (solicitud) => {
  const { data, error } = await supabase
    .from("solicitudes_compra")
    .insert([solicitud])
    .select(); // Asegúrate de usar `.select()` para obtener el ID de la solicitud recién creada

  if (error) {
    throw new Error(`Error al registrar solicitud: ${error.message}`);
  }

  return data[0]; // Esto debería devolver la primera fila con el ID de la solicitud
};
/*Actualiza una solicitud de compra existente en la tabla `solicitudes_compra`.*/
export const updateSolicitudCompra = async (id, solicitud) => {
  const { error } = await supabase
    .from("solicitudes_compra")
    .update(solicitud)
    .eq("id", id);

  if (error) {
    throw new Error(`Error al actualizar solicitud: ${error.message}`);
  }

  return { success: true }; // Indica que el `UPDATE` se realizó con éxito
};

/*Elimina una solicitud de compra de la tabla `solicitudes_compra`.*/
export const deleteSolicitudCompra = async (id) => {
  const { error } = await supabase.from("solicitudes_compra").delete().eq("id", id);

  if (error) {
    throw new Error(`Error al eliminar solicitud: ${error.message}`);
  }
};
// Obtener productos solicitados por ID de solicitud
export const getProductosSolicitados = async (idSolicitud) => {
  try {
    const { data, error } = await supabase
      .from("productos_solicitados")
      .select("*")
      .eq("id_solicitud", idSolicitud);

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error("Error al obtener productos solicitados:", err.message);
    throw err;
  }
};
// Registrar un producto solicitado
export const registerProductoSolicitado = async (producto) => {
  try {
    const { data, error } = await supabase
      .from("productos_solicitados")
      .insert(producto);

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error("Error al registrar producto solicitado:", err.message);
    throw err;
  }
};
// Actualizar un producto solicitado
export const updateProductoSolicitado = async (idProducto, producto) => {
  try {
    const { data, error } = await supabase
      .from("productos_solicitados")
      .update(producto)
      .eq("id", idProducto);

    if (error) throw new Error(error.message);
    return data;
  } catch (err) {
    console.error("Error al actualizar producto solicitado:", err.message);
    throw err;
  }
};
// Eliminar un producto solicitado
export const deleteProductoSolicitado = async (idProducto) => {
  try {
    const { error } = await supabase
      .from("productos_solicitados")
      .delete()
      .eq("id", idProducto);

    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Error al eliminar producto solicitado:", err.message);
    throw err;
  }
};
