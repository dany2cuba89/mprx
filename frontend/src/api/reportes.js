import { supabase } from "./supabase";

// Obtener el Balance General
export const getBalanceGeneral = async (fechaInicio, fechaFin) => {
  try {
    const response = await fetch(
      `${process.env.REACT_APP_BACKEND_URL}/api/reportes/balance-general?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
    );
    if (!response.ok) {
      throw new Error("Error al obtener el balance general.");
    }
    return await response.json();
  } catch (error) {
    console.error("Error al obtener el balance general:", error.message);
    throw error;
  }
};

// Exportar el Balance General a Excel
export const exportarBalanceGeneral = async (fechaInicio, fechaFin) => {
  try {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-balance-general?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Error al descargar el archivo Excel.");
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Balance_General_${fechaInicio}_a_${fechaFin}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al exportar Balance General:", error.message);
    throw error; // Asegúrate de lanzar el error para que sea capturado en el bloque try-catch
  }
};

// Obtener Pagos de Empleados
export const getPagosEmpleados = async (fechaInicio, fechaFin) => {
  try {
    const inicioISO = new Date(`${fechaInicio}T00:00:00Z`).toISOString();
    const finISO = new Date(`${fechaFin}T23:59:59Z`).toISOString();

    console.log("Fechas para consulta:", { inicioISO, finISO });

    const { data, error } = await supabase
      .from("pagos_empleados")
      .select("*")
      .gte("fecha_pago", inicioISO)
      .lte("fecha_pago", finISO);

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("No se encontraron registros de pagos en el rango seleccionado.");
    }

    return data;
  } catch (error) {
    console.error("Error al obtener pagos de empleados:", error.message);
    throw error;
  }
};

// Obtener Productos Más Vendidos
export const getReportesVentas = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase.rpc("productos_mas_vendidos", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) {
      throw error;
    }

    return data.map((item) => ({
      nombre: item.nombre || "Sin nombre",
      cantidad_vendida: item.cantidad_vendida || 0,
      ingreso_total: parseFloat(item.ingreso_total || 0).toFixed(2),
    }));
  } catch (error) {
    console.error("Error al obtener productos más vendidos:", error.message);
    throw error;
  }
};

// Obtener Alertas de Stock Bajo
export const getAlertasStockBajo = async () => {
  try {
    const { data, error } = await supabase.rpc("obtener_alertas_bajo_stock");

    if (error) {
      throw error;
    }

    return data.map((producto) => ({
      nombre: producto.nombre,
      stock_actual: producto.stock || 0,
      nivel_minimo: producto.nivel_minimo || 0,
      diferencia: (producto.stock || 0) - (producto.nivel_minimo || 0),
    }));
  } catch (error) {
    console.error("Error al obtener alertas de stock bajo:", error.message);
    throw error;
  }
};

// Obtener Resumen de Ventas
export const getResumenVentas = async (fechaInicio, fechaFin) => {
  try {
    const { data, error } = await supabase.rpc("resumen_ventas_por_intervalo", {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { productos: [], totales: {} };
    }

    const totales = {
      total_efectivo: `$${parseFloat(data[0]?.total_efectivo_general || 0).toFixed(2)}`,
      total_transferencia: `$${parseFloat(data[0]?.total_transferencia_general || 0).toFixed(2)}`,
      ingresos_totales: `$${parseFloat(data[0]?.ingresos_totales || 0).toFixed(2)}`,
      productos_totales: data[0]?.productos_totales || 0,
    };

    const productos = data
      .filter((item) => item.nombre_producto)
      .map((item) => ({
        nombre_producto: item.nombre_producto || "Sin nombre",
        precio_unitario: `$${parseFloat((item.total_ingreso || 0) / (item.cantidad_total || 1)).toFixed(2)}`,
        cantidad_total: item.cantidad_total || 0,
        total_ingreso: `$${parseFloat(item.total_ingreso || 0).toFixed(2)}`,
      }));

    return { productos, totales };
  } catch (error) {
    console.error("Error al obtener resumen de ventas:", error.message);
    throw error;
  }
};

// Exportar Productos Más Vendidos a Excel
export const exportarProductosMasVendidos = async (fechaInicio, fechaFin) => {
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-productos-mas-vendidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Error al descargar el archivo Excel.");
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Productos_Mas_Vendidos_${fechaInicio}_a_${fechaFin}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar Alertas de Stock Bajo a Excel
export const exportarAlertasStockBajo = async () => {
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-alertas-stock-bajo`;
  const response = await fetch(url);

  if (!response.ok) throw new Error("Error al descargar el archivo Excel.");

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Alertas_Stock_Bajo.xlsx";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar Resumen de Ventas a Excel
export const exportarResumenVentas = async (fechaInicio, fechaFin) => {
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-resumen-ventas?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Error al descargar el archivo Excel.");
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Resumen_Ventas_${fechaInicio}_a_${fechaFin}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Obtener Resumen de Compras
export const getResumenCompras = async (fechaInicio, fechaFin) => {
  try {
    console.log("[Frontend] Llamando al endpoint de compras con fechas:", { fechaInicio, fechaFin });

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/reportes/compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    if (!response.ok) {
      console.error("[Frontend] Error en la respuesta del servidor:", response.statusText);
      return { productos: [], totales: {} };
    }

    const data = await response.json();
    console.log("[Frontend] Respuesta completa del backend:", data);

    if (!data || !Array.isArray(data.productos) || typeof data.totales !== "object") {
      console.warn("[Frontend] Datos inválidos recibidos desde el backend:", data);
      return { productos: [], totales: {} };
    }

    const productos = data.productos.map((item) => ({
      Producto: item.nombre_producto || "N/A",
      "Cantidad Comprada": item.cantidad_total || 0,
      "Precio Unitario": `$${parseFloat(item.precio_unitario || 0).toFixed(2)}`,
      "Importe Total": `$${parseFloat(item.importe_total || 0).toFixed(2)}`,
    }));

    console.log("[Frontend] Productos procesados:", productos);

    const totales = {
      "Total de Unidades Compradas": data.totales.productos_totales || 0,
      "Gastos Totales": `$${parseFloat(data.totales.gastos_totales || 0).toFixed(2)}`,
      "Total en Efectivo": `$${parseFloat(data.totales.total_efectivo_general || 0).toFixed(2)}`,
      "Total en Transferencias": `$${parseFloat(data.totales.total_transferencia_general || 0).toFixed(2)}`,
    };

    console.log("[Frontend] Totales procesados:", totales);

    return { productos, totales };
  } catch (error) {
    console.error("[Frontend] Error en la función getResumenCompras:", error.message);
    throw error;
  }
};

// Exportar Resumen de Compras a Excel
export const exportarResumenCompras = async (fechaInicio, fechaFin) => {
  const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-resumen-compras?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Error al descargar el archivo Excel.");
  }

  const blob = await response.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `Resumen_Compras_${fechaInicio}_a_${fechaFin}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar Pagos de Empleados a Excel
export const exportarPagosEmpleados = async (fechaInicio, fechaFin) => {
  try {
    const url = `${process.env.REACT_APP_BACKEND_URL}/api/reportes/exportar-pagos-empleados?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error al descargar el archivo Excel: ${response.statusText}`);
    }

    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Pagos_Empleados_${fechaInicio}_a_${fechaFin}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Error al exportar pagos de empleados:", error.message);
    throw error; // Asegúrate de lanzar el error para que sea capturado en el bloque try-catch
  }
};
