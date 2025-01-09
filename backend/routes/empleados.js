const express = require("express");
const supabase = require("../database");

const router = express.Router();

// Crear un empleado
router.post("/", async (req, res) => {
    const {
        nombre, puesto, salario, metodo_pago, sistema_pago,
        intervalo_pago_inicio, intervalo_pago_fin, correo
    } = req.body;

    try {
        const { data, error } = await supabase
            .from("empleados")
            .insert([{
                nombre_completo: nombre,
                puesto,
                salario,
                metodo_pago,
                sistema_pago,
                intervalo_pago_inicio,
                intervalo_pago_fin,
                correo,
            }]);

        if (error) throw error;

        res.status(201).json({
            message: "Empleado registrado exitosamente",
            empleado: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Consultar todos los empleados (con filtros opcionales)
router.get("/", async (req, res) => {
    const { nombre, puesto } = req.query;

    try {
        let query = supabase.from("empleados").select("*");

        if (nombre) query = query.ilike("nombre", `%${nombre}%`);
        if (puesto) query = query.ilike("puesto", `%${puesto}%`);

        const { data: empleados, error } = await query;

        if (error) throw error;

        res.status(200).json(empleados);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Consultar un empleado por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data: empleado, error } = await supabase
            .from("empleados")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !empleado) throw new Error("Empleado no encontrado");

        res.status(200).json(empleado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar un empleado
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const {
        nombre, puesto, salario, metodo_pago, sistema_pago,
        intervalo_pago_inicio, intervalo_pago_fin, correo
    } = req.body;

    try {
        const { data, error } = await supabase
            .from("empleados")
            .update({
                nombre_completo: nombre,
                puesto,
                salario,
                metodo_pago,
                sistema_pago,
                intervalo_pago_inicio,
                intervalo_pago_fin,
                correo,
            })
            .eq("id", id);

        if (error) throw error;

        res.status(200).json({
            message: "Empleado actualizado exitosamente",
            empleado: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Eliminar un empleado
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase.from("empleados").delete().eq("id", id);

        if (error) throw error;

        res.status(200).json({
            message: "Empleado eliminado exitosamente",
            empleado: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Registrar un pago a un empleado
// Registrar un pago a un empleado
router.post("/:id/pago", async (req, res) => {
  const { id } = req.params;
  const {
    monto,
    intervalo_pago, // Incluir intervalo_pago aquí
    fecha_inicio_periodo,
    fecha_fin_periodo,
    metodo_pago,
    numero_tarjeta,
    notas,
  } = req.body;

  try {
    // Validar que el empleado existe
    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("*")
      .eq("id", id)
      .single();

    if (empleadoError || !empleado) {
      throw new Error("Empleado no encontrado");
    }

    // Insertar el registro de pago
    const { data, error } = await supabase.from("pagos_empleados").insert([
      {
        empleado_id: id,
        nombre_empleado: empleado.nombre_completo,
        monto: parseFloat(monto),
        intervalo_pago, // Guardar el intervalo_pago aquí
        metodo_pago,
        numero_tarjeta: metodo_pago === "transferencia" ? numero_tarjeta : null,
        intervalo_inicio: fecha_inicio_periodo,
        intervalo_fin: fecha_fin_periodo,
        notas,
        fecha_pago: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    res.status(201).json({
      message: "Pago registrado exitosamente",
      pago: data[0],
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});





// Consultar historial de pagos de un empleado
router.get("/:id/pagos", async (req, res) => {
    const { id } = req.params;

    try {
        const { data: pagos, error } = await supabase
            .from("pagos_empleados")
            .select("*")
            .eq("empleado_id", id);

        if (error) throw error;

        res.status(200).json(pagos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Generar reporte de pagos
router.get("/reporte", async (req, res) => {
    const { fechaInicio, fechaFin } = req.query;

    try {
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin para generar el reporte." });
        }

        const { data: pagos, error } = await supabase
            .from("pagos_empleados")
            .select("monto, fecha, empleado_id, empleados(nombre)")
            .gte("fecha", fechaInicio)
            .lte("fecha", fechaFin)
            .order("fecha", { ascending: true });

        if (error) throw error;

        const resumen = pagos.reduce((acc, pago) => {
            acc.totalPagos++;
            acc.montoTotal += pago.monto;
            return acc;
        }, { totalPagos: 0, montoTotal: 0 });

        res.status(200).json({
            resumen,
            detalle: pagos,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
