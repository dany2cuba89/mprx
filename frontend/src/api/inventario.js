import { supabase } from "./supabase";

// Buscar productos por nombre
export const buscarProductosPorNombre = async (nombre) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .ilike("nombre", `%${nombre}%`);

    if (error) throw new Error("Error al buscar productos: " + error.message);

    return data || [];
  } catch (err) {
    console.error(err.message);
    throw err;
  }
};

// Obtener productos con bajo stock
export const getLowStockAlerts = async () => {
  try {
    const { data, error } = await supabase.rpc("obtener_alertas_bajo_stock"); // Llama a una función definida en tu base de datos

    if (error) {
      throw new Error(`Error al obtener alertas de bajo stock: ${error.message}`);
    }

    return data.map((producto) => ({
      nombre: producto.nombre,
      stock_actual: producto.stock,
      nivel_minimo: producto.nivel_minimo,
      diferencia: producto.nivel_minimo - producto.stock,
    }));
  } catch (error) {
    console.error(error.message);
    throw error;
  }
};

// Obtener productos con filtros y paginación
export const getProductos = async (filtros = {}) => {
  const { nombre, categoria, stock_min, stock_max, page, pageSize } = filtros;

  try {
    let query = supabase
      .from("productos")
      .select(
        "id, nombre, precio_compra, precio_venta, stock, nivel_minimo, unidad_medida, categoria",
        { count: "exact" }
      );

    if (nombre) query = query.ilike("nombre", `%${nombre}%`);
    if (categoria) query = query.ilike("categoria", `%${categoria}%`);
    if (stock_min) query = query.gte("stock", parseInt(stock_min, 10));
    if (stock_max) query = query.lte("stock", parseInt(stock_max, 10));

    if (page && pageSize) {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw new Error(error.message);

    return { data: data || [], total: count || 0 };
  } catch (error) {
    console.error("Error al obtener productos:", error.message);
    throw error;
  }
};

// Agregar un nuevo producto, crear factura y registrar compra diaria
export const addProducto = async (producto) => {
  try {
    // Conversión de valores para coincidir con los tipos de PostgreSQL
    const { 
      id_producto, // Agregar este campo
      nombre, 
      precio_compra, 
      precio_venta, 
      stock, 
      nivel_minimo, 
      unidad_medida, 
      categoria, 
      metodo_pago, 
      proveedor, 
      cajera 
    } = producto;

    const { data, error } = await supabase.rpc("registrar_compra", {
      id_producto, // INTEGER
      nombre,      // TEXT
      precio_compra: parseFloat(precio_compra), // NUMERIC
      precio_venta: parseFloat(precio_venta),   // NUMERIC
      stock: parseInt(stock, 10),              // INTEGER
      nivel_minimo: parseInt(nivel_minimo, 10), // INTEGER
      unidad_medida, // TEXT
      categoria,     // TEXT
      metodo_pago,   // TEXT
      proveedor,     // INTEGER
      cajera,        // UUID
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error al agregar producto y registrar compra:", error.message);
    throw error;
  }
};



// Actualizar un producto existente
export const updateProducto = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .update(updates)
      .eq("id", id)
      .select("*");

    if (error) throw new Error(error.message);

    return data[0];
  } catch (error) {
    console.error("Error al actualizar producto:", error.message);
    throw error;
  }
};

// Eliminar un producto del inventario
export const deleteProducto = async (id) => {
  try {
    const { data, error } = await supabase
      .from("productos")
      .delete()
      .eq("id", id)
      .select("*");

    if (error) throw new Error(error.message);

    return data[0];
  } catch (error) {
    console.error("Error al eliminar producto:", error.message);
    throw error;
  }
};

// Exportar inventario a excel
export const exportarInventario = async (filtros = {}) => {
  try {
    const params = new URLSearchParams(filtros).toString();
    const url = `${process.env.REACT_APP_BACKEND_URL}/inventario/exportar-excel?${params}`;

    console.log("URL de exportación de inventario:", url);

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Error al descargar el archivo Excel.");
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Inventario.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al exportar el inventario:", error.message);
    throw error;
  }
};
