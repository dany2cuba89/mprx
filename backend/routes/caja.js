const express = require("express");
const supabase = require("../database");

const router = express.Router();
let carrito = []; // Carrito temporal para la operación de ventas

// Escanear QR y agregar producto al carrito
router.post("/agregar-qr", async (req, res) => {
  const { codigo_qr, cantidad } = req.body;

  try {
    const { data: producto, error } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_qr", codigo_qr)
      .single();

    if (error || !producto) throw new Error("Producto no encontrado");

    if (producto.stock < cantidad) {
      return res.status(400).json({
        error: `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
      });
    }

    const importe = producto.precio * cantidad;

    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad,
      unidad_medida: producto.unidad_medida,
      importe,
    });

    res.status(200).json({
      message: "Producto añadido al carrito",
      carrito,
      total: carrito.reduce((suma, item) => suma + item.importe, 0),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Confirmar la venta
router.post("/venta", async (req, res) => {
  const { metodo_pago, cajera, numero_tarjeta, nombre_cliente, ci_cliente } = req.body;

  if (carrito.length === 0) {
    return res.status(400).json({ error: "El carrito está vacío" });
  }

  if (!["efectivo", "transferencia"].includes(metodo_pago)) {
    return res.status(400).json({ error: "Método de pago no válido" });
  }

  if (metodo_pago === "transferencia") {
    if (!numero_tarjeta || !nombre_cliente || !ci_cliente) {
      return res.status(400).json({
        error: "Faltan datos para completar el pago por transferencia bancaria (tarjeta, cliente o CI).",
      });
    }
  }

  try {
    const total = carrito.reduce((suma, item) => suma + item.importe, 0);

    const detalles_pago =
      metodo_pago === "transferencia"
        ? { numero_tarjeta, nombre_cliente, ci_cliente }
        : null;

    const { data: venta, error: ventaError } = await supabase
      .from("facturas")
      .insert([
        {
          tipo: "venta",
          fecha: new Date().toISOString(),
          total,
          productos: JSON.stringify(carrito),
          metodo_pago,
          cajera,
          detalles_pago: detalles_pago ? JSON.stringify(detalles_pago) : null,
        },
      ]);

    if (ventaError) throw ventaError;

    // Reducir el stock usando la función RPC
    for (const item of carrito) {
      const { error: updateError } = await supabase.rpc("reducir_stock", {
        producto_id: item.id,
        cantidad: item.cantidad,
      });

      if (updateError) throw updateError;
    }

    carrito = [];

    res.status(201).json({
      message: "Venta registrada exitosamente",
      venta,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vaciar el carrito
router.post("/vaciar-carrito", (req, res) => {
  carrito = [];
  res.status(200).json({ message: "Carrito vaciado" });
});

// Obtener reporte diario de ventas
router.get("/reporte-diario", async (req, res) => {
  const hoy = new Date().toISOString().split("T")[0];

  try {
    const { data: ventas, error } = await supabase
      .from("facturas")
      .select("id, productos, total, metodo_pago, fecha, cajera, detalles_pago")
      .eq("tipo", "venta")
      .gte("fecha", `${hoy}T00:00:00`)
      .lte("fecha", `${hoy}T23:59:59`);

    if (error) throw error;

    const totalIngresos = ventas.reduce((acc, venta) => acc + venta.total, 0);

    res.status(200).json({
      fecha: hoy,
      totalIngresos,
      detalleVentas: ventas,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
