import { supabase } from "./supabase";

// Obtener todas las recepciones
export const getRecepciones = async () => {
  const { data, error } = await supabase
    .from("recepciones")
    .select("*, recepcion_productos(*), proveedores(nombre_o_razon_social), empleados(nombre_completo)");

  if (error) {
    console.error("Error al obtener recepciones:", error.message);
    throw error;
  }

  return data;
};

// Crear una nueva recepción
export const createRecepcion = async (recepcion) => {
  const {
    id_proveedor,
    id_empleado,
    fecha_recepcion,
    id_solicitud_compra,
    productos,
    observaciones,
  } = recepcion;

  try {
    // Insertar la recepción principal
    const { data: recepcionData, error: recepcionError } = await supabase
      .from("recepciones")
      .insert([{ id_proveedor, id_empleado, fecha_recepcion, id_solicitud_compra, observaciones }])
      .select()
      .single();

    if (recepcionError) throw new Error("Error al insertar en la tabla 'recepciones': " + recepcionError.message);

    const id_recepcion = recepcionData.id;

    // Preparar los productos para la tabla `recepcion_productos`
    const productosConRecepcion = productos.map((producto) => ({
      id_recepcion,
      id_producto: producto.id_producto,
      cantidad_recibida: producto.cantidad_recibida,
      unidad_medida: producto.unidad_medida,
      precio_unitario: producto.precio_unitario,
      estado_producto: producto.estado_producto || "Bueno",
      observaciones: producto.observaciones || "",
    }));

    // Insertar los productos asociados
    const { error: productosError } = await supabase.from("recepcion_productos").insert(productosConRecepcion);
    if (productosError) throw new Error("Error al insertar en la tabla 'recepcion_productos': " + productosError.message);

    return { message: "Recepción creada exitosamente", recepcionId: id_recepcion };
  } catch (error) {
    console.error("Error al crear recepción:", error.message);
    throw error;
  }
};

export const addproducto = async (producto) => {
  const { data, error } = await supabase.from("productos").insert([producto]);
  if (error) throw new Error(error.message);
  return data;
};
