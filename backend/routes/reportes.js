const express = require("express");
const supabase = require("../database");
const ExcelJS = require("exceljs");

const {
  exportarProductosMasVendidosExcel,
  exportarAlertasStockBajoExcel,
  exportarResumenVentas, exportarResumenCompras,
  exportarPagosEmpleadosExcel,
  exportarBalanceGeneral,
} = require("../utils/excel");

const router = express.Router();

// Endpoint para exportar Balance General
router.get("/exportar-balance-general", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin para exportar el balance." });
    }

    console.log("[Backend] Exportando balance general. Fechas:", { fechaInicio, fechaFin });

    // Consultar datos de compras, ventas y pagos
    const { data: compras, error: errorCompras } = await supabase.rpc("resumen_compras_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (errorCompras) throw new Error(`Error al obtener compras: ${errorCompras.message}`);

    const { data: ventas, error: errorVentas } = await supabase.rpc("resumen_ventas_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (errorVentas) throw new Error(`Error al obtener ventas: ${errorVentas.message}`);

    const { data: pagos, error: errorPagos } = await supabase
      .from("pagos_empleados")
      .select("*")
      .gte("fecha_pago", fechaInicio)
      .lte("fecha_pago", fechaFin);

    if (errorPagos) throw new Error(`Error al obtener pagos: ${errorPagos.message}`);

    // Procesar datos
    const balanceData = {
      resumenFinanciero: {
        totalIngresos: ventas.reduce((acc, venta) => acc + (venta.total_ingreso || 0), 0),
        totalEgresos: compras.reduce((acc, compra) => acc + (compra.gastos_totales || 0), 0),
        utilidadNeta: 0, // Calculado en exportarBalanceGeneral
        utilidadNetaDespuesPagos: 0, // Calculado en exportarBalanceGeneral
      },
      detalles: [
        ...compras.map((compra) => ({
          tipo: "Compra",
          descripcion: compra.nombre_producto,
          monto: compra.gastos_totales,
        })),
        ...ventas.map((venta) => ({
          tipo: "Venta",
          descripcion: venta.nombre_producto,
          monto: venta.total_ingreso,
        })),
        ...pagos.map((pago) => ({
          tipo: "Pago",
          descripcion: pago.nombre_empleado,
          monto: pago.monto,
        })),
      ],
    };

    balanceData.resumenFinanciero.utilidadNeta =
      balanceData.resumenFinanciero.totalIngresos - balanceData.resumenFinanciero.totalEgresos;
    balanceData.resumenFinanciero.utilidadNetaDespuesPagos =
      balanceData.resumenFinanciero.utilidadNeta -
      pagos.reduce((acc, pago) => acc + (pago.monto || 0), 0);

    // Generar archivo Excel
    const buffer = await exportarBalanceGeneral(balanceData, { fechaInicio, fechaFin });

    // Configurar la respuesta
    res.setHeader("Content-Disposition", "attachment; filename=Balance_General.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar Balance General:", error.message);
    res.status(500).json({ error: "Error al exportar Balance General." });
  }
});



// Reporte financiero general (ingresos, egresos, balance)
router.get("/balance-general", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    // Ejecutar las consultas de forma paralela
    const [
      comprasResponse,
      ventasResponse,
      pagosResponse,
      productosResponse,
      alertasResponse,
    ] = await Promise.all([
      supabase.rpc("resumen_compras_por_intervalo", { fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
      supabase.rpc("resumen_ventas_por_intervalo", { fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
      supabase.from("pagos_empleados").select("*").gte("fecha_pago", fechaInicio).lte("fecha_pago", fechaFin),
      supabase.rpc("productos_mas_vendidos", { fecha_inicio: fechaInicio, fecha_fin: fechaFin }),
      supabase.rpc("obtener_alertas_bajo_stock"),
    ]);

    // Verificar si alguna de las consultas falló
    if (
      comprasResponse.error ||
      ventasResponse.error ||
      pagosResponse.error ||
      productosResponse.error ||
      alertasResponse.error
    ) {
      throw new Error(
        comprasResponse.error?.message ||
          ventasResponse.error?.message ||
          pagosResponse.error?.message ||
          productosResponse.error?.message ||
          alertasResponse.error?.message
      );
    }

    // Consolidar los datos
    res.json({
      compras: comprasResponse.data || [],
      ventas: ventasResponse.data || [],
      pagos: pagosResponse.data || [],
      productosMasVendidos: productosResponse.data || [],
      alertasStock: alertasResponse.data || [],
    });
  } catch (error) {
    console.error("Error al obtener balance general:", error.message);
    res.status(500).json({ error: "Error al obtener balance general." });
  }
});

// Generar reporte de productos más vendidos
router.get("/productos-mas-vendidos", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin para generar el reporte." });
    }

    const { data, error } = await supabase.rpc("productos_mas_vendidos", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) throw new Error(`Error desde Supabase: ${error.message}`);
    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No se encontraron productos más vendidos." });
    }

    res.status(200).json(data);
  } catch (err) {
    console.error("Error al obtener productos más vendidos:", err.message);
    res.status(500).json({ error: "Error al obtener productos más vendidos." });
  }
});

// Generar reporte de pago a empleados
router.get("/exportar-pagos-empleados", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    if (!fechaInicio || !fechaFin) {
      return res
        .status(400)
        .json({ error: "Se requieren fechaInicio y fechaFin para exportar los pagos." });
    }

    // Consultar la base de datos
    const { data, error } = await supabase
      .from("pagos_empleados")
      .select("*")
      .gte("fecha_pago", fechaInicio)
      .lte("fecha_pago", fechaFin);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No se encontraron pagos para el rango de fechas." });
    }

    // Generar el archivo Excel
    const buffer = await exportarPagosEmpleadosExcel(data, { fechaInicio, fechaFin });

    // Configurar la respuesta
    res.setHeader("Content-Disposition", "attachment; filename=Pagos_Empleados.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Error al exportar pagos de empleados:", error.message);
    res.status(500).json({ error: "Error al exportar pagos de empleados." });
  }
});




// Generar reporte de alertas de stock bajo
router.get("/alertas-stock-bajo", async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("obtener_alertas_bajo_stock");

    if (error) throw new Error(`Error al obtener alertas de bajo stock: ${error.message}`);

    res.status(200).json(data);
  } catch (error) {
    console.error("Error al obtener alertas de bajo stock:", error.message);
    res.status(500).json({ error: "Error al obtener alertas de bajo stock." });
  }
});

// Generar resumen de ventas
router.get("/ventas", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: "Se requieren fechaInicio y fechaFin para generar el reporte." });
    }

    const { data, error } = await supabase.rpc("resumen_ventas_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) throw new Error(error.message);

    res.status(200).json({
      productos: data.detalle_por_producto || [],
      totales: data.resumen_general || {},
    });
  } catch (error) {
    console.error("Error al obtener resumen de ventas:", error.message);
    res.status(500).json({ error: "Error al obtener resumen de ventas." });
  }
});


// Exportar productos más vendidos a Excel
router.get("/exportar-productos-mas-vendidos", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    const { data, error } = await supabase.rpc("productos_mas_vendidos", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No se encontraron productos más vendidos." });
    }

    const buffer = await exportarProductosMasVendidosExcel(data, { fechaInicio, fechaFin });
    res.setHeader("Content-Disposition", "attachment; filename=Productos_Mas_Vendidos.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar productos más vendidos:", error.message);
    res.status(500).json({ error: "Error al exportar productos más vendidos." });
  }
});

// Exportar alertas de stock bajo a Excel
router.get("/exportar-alertas-stock-bajo", async (req, res) => {
  try {
    const { data, error } = await supabase.rpc("obtener_alertas_bajo_stock");

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No se encontraron alertas de stock bajo." });
    }

    const buffer = await exportarAlertasStockBajoExcel(data, { title: "Alertas de Stock Bajo" });
    res.setHeader("Content-Disposition", "attachment; filename=Alertas_Stock_Bajo.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar alertas de stock bajo:", error.message);
    res.status(500).json({ error: "Error al exportar alertas de stock bajo." });
  }
});

// Exportar resumen de ventas a Excel
router.get("/exportar-resumen-ventas", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    const { data, error } = await supabase.rpc("resumen_ventas_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return res.status(404).json({ error: "No se encontraron datos de ventas para el período especificado." });
    }

    // Procesar productos válidos
    const productosValidos = data
      .filter((producto) => producto.nombre_producto !== null && producto.nombre_producto.trim() !== "")
      .map((producto) => ({
        Producto: producto.nombre_producto,
        "Precio Unitario": producto.cantidad_total > 0 
          ? parseFloat(producto.total_ingreso / producto.cantidad_total).toFixed(2) 
          : "0.00",
        "Cantidad Total": producto.cantidad_total || 0,
        "Importe Total": parseFloat(producto.total_ingreso || 0).toFixed(2),
      }));

    const buffer = await exportarResumenVentas(
      {
        productosVendidos: productosValidos,
        totales: {
          productos_totales: data[0]?.productos_totales || 0,
          ingresos_totales: parseFloat(data[0]?.ingresos_totales || 0).toFixed(2),
          total_efectivo: parseFloat(data[0]?.total_efectivo_general || 0).toFixed(2),
          total_transferencia: parseFloat(data[0]?.total_transferencia_general || 0).toFixed(2),
        },
      },
      { fechaInicio, fechaFin }
    );

    res.setHeader("Content-Disposition", "attachment; filename=Resumen_Ventas.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar resumen de ventas:", error.message);
    res.status(500).json({ error: "Error al exportar resumen de ventas." });
  }
});

// Exportar resumen de compras a Excel
router.get("/exportar-resumen-compras", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    const { data, error } = await supabase.rpc("resumen_compras_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) {
      console.error("Error en Supabase RPC:", error.message); // Agrega este log
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      console.warn("No se encontraron datos para el intervalo especificado:", { fechaInicio, fechaFin }); // Agrega este log
      return res.status(404).json({ error: "No se encontraron datos de compras para el período especificado." });
    }

    // Procesar productos válidos
    // Transformar los datos devueltos por la base de datos para Excel
// Transformar los datos devueltos por la base de datos para Excel
const productosValidos = data.map((producto) => ({
  Producto: producto.nombre_producto || "N/A",
  "Cantidad Total": producto.cantidad_total || 0,
  "Precio Unitario": producto.cantidad_total > 0
    ? (producto.importe_total / producto.cantidad_total).toFixed(2) // Calcular precio unitario
    : "0.00",
  "Importe Total": producto.importe_total ? parseFloat(producto.importe_total).toFixed(2) : "0.00", // Total del producto
}));



    console.log("Productos procesados para exportación:", productosValidos); // Agrega este log

    const buffer = await exportarResumenCompras(
      {
        productosComprados: productosValidos,
        totales: {
          productos_totales: data[0]?.productos_totales || 0,
          gastos_totales: data[0]?.gastos_totales ? parseFloat(data[0].gastos_totales).toFixed(2) : "0.00",
          total_efectivo: data[0]?.total_efectivo_general ? parseFloat(data[0].total_efectivo_general).toFixed(2) : "0.00",
          total_transferencia: data[0]?.total_transferencia_general ? parseFloat(data[0].total_transferencia_general).toFixed(2) : "0.00",
        },
      },
      { fechaInicio, fechaFin }
    );

    res.setHeader("Content-Disposition", "attachment; filename=Resumen_Compras.xlsx");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error al exportar resumen de compras:", error.message); // Agrega este log
    res.status(500).json({ error: "Error al exportar resumen de compras." });
  }
});

// Generar resumen de compras
// Actualizar la ruta `/compras` para dividir productos y totales
// routes/reportes.js (Actualización de la ruta /compras)
router.get("/compras", async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;

  try {
    console.log("[Backend] Llamando a resumen_compras_por_intervalo con fechas:", { fechaInicio, fechaFin });

    const { data, error } = await supabase.rpc("resumen_compras_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) throw error;

    console.log("[Backend] Datos crudos devueltos por la función SQL:", data);

    if (!data || data.length === 0) {
      console.warn("[Backend] No se encontraron datos de compras.");
      return res.status(404).json({ productos: [], totales: {} });
    }

    // Productos procesados directamente desde SQL
    const productos = data.map((item) => ({
      nombre_producto: item.nombre_producto,
      cantidad_total: item.cantidad_total,
      precio_unitario: item.precio_unitario, // Sin cálculo adicional
      importe_total: item.importe_total, // Sin cálculo adicional
    }));

    // Totales procesados directamente desde el primer registro
    const totales = {
      productos_totales: data[0]?.productos_totales || 0,
      gastos_totales: data[0]?.gastos_totales || 0,
      total_efectivo_general: data[0]?.total_efectivo_general || 0,
      total_transferencia_general: data[0]?.total_transferencia_general || 0,
    };

    console.log("[Backend] Productos procesados:", productos);
    console.log("[Backend] Totales procesados:", totales);

    res.status(200).json({ productos, totales });
  } catch (error) {
    console.error("[Backend] Error al procesar resumen de compras:", error.message);
    res.status(500).json({ error: "Error interno del servidor al obtener resumen de compras." });
  }
});



module.exports = router;
