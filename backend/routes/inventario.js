const express = require("express");
const supabase = require("../database");
const { exportarInventarioExcel } = require("../utils/excel");
const router = express.Router();


router.post("/", async (req, res) => {
  const {
    nombre,
    precio_compra,
    precio_venta,
    stock,
    nivel_minimo,
    unidad_medida,
    categoria,
    metodo_pago,
    proveedor,
    cajera,
  } = req.body;

  try {
    const { data, error } = await supabase.rpc("registrar_compra", {
      nombre,
      precio_compra: parseFloat(precio_compra),
      precio_venta: parseFloat(precio_venta),
      stock: parseInt(stock, 10),
      nivel_minimo: parseInt(nivel_minimo, 10),
      unidad_medida,
      categoria,
      metodo_pago,
      proveedor,
      cajera,
    });

    if (error) throw error;
    res.status(201).json({ message: "Producto agregado y compra registrada.", data });
  } catch (error) {
    console.error("Error al agregar producto y registrar compra:", error.message);
    res.status(400).json({ error: error.message });
  }
});


// Actualizar un producto en el inventario
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, precio_compra, precio_venta, stock, nivel_minimo, unidad_medida, categoria } =
    req.body;

  try {
    const { data, error } = await supabase
      .from("productos")
      .update({ nombre, precio_compra, precio_venta, stock, nivel_minimo, unidad_medida, categoria })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Producto actualizado", producto: data[0] });
  } catch (error) {
    console.error("Error al actualizar producto:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Consultar productos con filtros
router.get("/", async (req, res) => {
  const { nombre, categoria, stock_min, stock_max } = req.query;

  try {
    let query = supabase
      .from("productos")
      .select(
        "id, nombre, precio_compra, precio_venta, stock, nivel_minimo, unidad_medida, categoria"
      );

    if (nombre) query = query.ilike("nombre", `%${nombre}%`);
    if (categoria) query = query.ilike("categoria", `%${categoria}%`);
    if (stock_min) query = query.gte("stock", parseInt(stock_min, 10));
    if (stock_max) query = query.lte("stock", parseInt(stock_max, 10));

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json(data || []);
  } catch (error) {
    console.error("Error al consultar productos:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Exportar inventario a Excel
router.get("/exportar-excel", async (req, res) => {
  try {
    const { nombre, categoria } = req.query;

    let query = supabase
      .from("productos")
      .select("nombre, precio_compra, precio_venta, stock, nivel_minimo, unidad_medida, categoria");

    if (nombre) query = query.ilike("nombre", `%${nombre}%`);
    if (categoria) query = query.ilike("categoria", `%${categoria}%`);

    const { data: productos, error } = await query;

    if (error) {
      console.error("Error al obtener productos:", error.message);
      return res.status(500).json({ error: "Error al obtener productos." });
    }

    console.log("Productos a exportar:", productos);

    const buffer = await exportarInventarioExcel(productos);

    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Inventario.xlsx"'
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar el inventario:", error.message);
    res.status(500).json({ error: "Error al exportar el inventario." });
  }
});

module.exports = router;
