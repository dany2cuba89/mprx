import { supabase } from "./supabase";

// Agregar producto al carrito usando el código QR
export const addToCart = async (id, cantidad) => {
    const { data: producto, error } = await supabase
        .from("productos")
        .select("*")
        .eq("id", id) // Busca el producto por ID
        .single();

    if (error || !producto) throw new Error("Producto no encontrado");

    return {
        id: producto.id,
        nombre: producto.nombre,
        precio_venta: producto.precio_venta,
        stock: producto.stock,
        unidad_medida: producto.unidad_medida,
    };
};



// Confirmar venta
export const confirmarVenta = async ({ carrito, metodo_pago, cajera, detalles_pago }) => {
  const { data: venta, error: ventaError } = await supabase.from("facturas").insert([
    {
      tipo: "venta",
      fecha: new Date().toISOString(),
      total: carrito.reduce((sum, item) => sum + item.importe, 0),
      productos: JSON.stringify(carrito),
      metodo_pago,
      cajera,
      detalles_pago: metodo_pago === "transferencia" ? JSON.stringify(detalles_pago) : null,
    },
  ]);

  if (ventaError) throw new Error(ventaError.message);

  return venta;
};

// Vaciar el carrito (solo en el frontend)
export const vaciarCarrito = () => {
  return [];
};
