const express = require("express");
const router = express.Router();
const supabase = require("../database");

// Obtener todas las recepciones
router.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("recepciones")
    .select("*, recepcion_productos(*), proveedores(nombre_o_razon_social), empleados(nombre_completo)");
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// Crear una nueva recepción
router.post("/", async (req, res) => {
	  console.log("Solicitud recibida en /recepciones con datos:", req.body);

  const { id_proveedor, id_empleado, fecha_recepcion, id_solicitud_compra, productos, observaciones } = req.body;

  const { data: recepcion, error: recepcionError } = await supabase
    .from("recepciones")
    .insert([{ id_proveedor, id_empleado, fecha_recepcion, id_solicitud_compra, observaciones }])
    .select();

  if (recepcionError) return res.status(500).json({ error: recepcionError });

  const id_recepcion = recepcion[0].id;
  const productosConRecepcion = productos.map((prod) => ({ ...prod, id_recepcion }));

  const { error: productosError } = await supabase.from("recepcion_productos").insert(productosConRecepcion);
  if (productosError) return res.status(500).json({ error: productosError });

  res.status(201).json({ message: "Recepción creada exitosamente" });
});

// Obtener detalles de una recepción
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("recepciones")
    .select("*, recepcion_productos(*), proveedores(nombre_o_razon_social), empleados(nombre_completo)")
    .eq("id", id)
    .single();

  if (error) return res.status(404).json({ error });
  res.json(data);
});

// Actualizar una recepción
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { observaciones } = req.body;

  const { error } = await supabase.from("recepciones").update({ estado, observaciones }).eq("id", id);
  if (error) return res.status(500).json({ error });

  res.json({ message: "Recepción actualizada correctamente" });
});

module.exports = router;
