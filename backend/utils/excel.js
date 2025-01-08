const ExcelJS = require("exceljs");
const path = require("path");
const fs = require("fs");


/**
 * Genera un archivo Excel con los estilos y datos para alertas de stock bajo.
 * @param {Array} data Datos de las alertas.
 * @param {Object} options Opciones adicionales (como título y fechas).
 * @returns {Buffer} Buffer del archivo Excel.
 */
const exportarAlertasStockBajoExcel = async (alertas, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Alertas de Stock Bajo", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte con diseño mejorado**
    sheet.mergeCells("A1:D1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Alertas de Stock Bajo";

    // Estilo actualizado para el título
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = {
      bottom: { style: "medium", color: { argb: "4CAF50" } }, // Línea verde debajo
    };

    // **Espacio vacío entre título y fechas**
    sheet.addRow([]);

    // **Fechas**
    const fechas = [
      `Fecha de la Consulta: ${new Date().toISOString().split("T")[0]}`,
    ];
    fechas.forEach((texto) => {
      const fechaRow = sheet.addRow([texto]);
      fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
      fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // **Espacio vacío entre fechas y tabla**
    sheet.addRow([]);

    // **Encabezados de la tabla**
    const headerRow = sheet.addRow([
      "Producto",
      "Stock Actual",
      "Nivel Mínimo",
      "Diferencia",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } }; // Verde
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Agregar datos de las alertas**
    alertas.forEach((alerta) => {
      const row = sheet.addRow([
        alerta.nombre || "N/A",
        alerta.stock || 0,
        alerta.nivel_minimo || 0,
        (alerta.stock || 0) - (alerta.nivel_minimo || 0), // Diferencia
      ]);

      row.getCell(2).alignment = { horizontal: "center" }; // Alinear Stock Actual al centro
      row.getCell(3).alignment = { horizontal: "center" }; // Alinear Nivel Mínimo al centro
      row.getCell(4).alignment = { horizontal: "center" }; // Alinear Diferencia al centro

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "nombre", width: 30 },
      { key: "stock_actual", width: 20 },
      { key: "nivel_minimo", width: 20 },
      { key: "diferencia", width: 20 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("Error en la generación del archivo Excel.");
  }
};
/**
 * Generar un archivo Excel para exportar inventario.
 * @param {Array} productos - Lista de productos a incluir en el archivo.
 * @returns {Buffer} - El archivo Excel en forma de buffer.
 */
const exportarInventarioExcel = async (productos) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inventario", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte con diseño mejorado**
    sheet.mergeCells("A1:G1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Reporte de Inventario";

    // Estilo actualizado para el título
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = {
      bottom: { style: "medium", color: { argb: "4CAF50" } }, // Línea verde debajo
    };

    // **Espacio vacío entre título y fechas**
    sheet.addRow([]);

    // **Fechas**
    const fechas = [
      `Fecha de la Consulta: ${new Date().toISOString().split("T")[0]}`,
    ];
    fechas.forEach((texto) => {
      const fechaRow = sheet.addRow([texto]);
      fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
      fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // **Espacio vacío entre fechas y tabla**
    sheet.addRow([]);

    // **Encabezados de la tabla**
    const headerRow = sheet.addRow([
      "Nombre",
      "Precio Compra ($)",
      "Precio Venta ($)",
      "Stock",
      "Nivel Mínimo",
      "Unidad de Medida",
      "Categoría",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } }; // Verde
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Agregar datos de los productos**
    productos.forEach((producto) => {
      const row = sheet.addRow([
        producto.nombre,
        parseFloat(producto.precio_compra).toFixed(2),
        parseFloat(producto.precio_venta).toFixed(2),
        producto.stock,
        producto.nivel_minimo || "N/A",
        producto.unidad_medida || "N/A",
        producto.categoria || "N/A",
      ]);

      row.getCell(2).alignment = { horizontal: "center" }; // Alinear Precio Compra al centro
      row.getCell(3).alignment = { horizontal: "center" }; // Alinear Precio Venta al centro
      row.getCell(4).alignment = { horizontal: "center" }; // Alinear Stock al centro
      row.getCell(5).alignment = { horizontal: "center" }; // Alinear Nivel Mínimo al centro

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "nombre", width: 30 },
      { key: "precio_compra", width: 20 },
      { key: "precio_venta", width: 20 },
      { key: "stock", width: 15 },
      { key: "nivel_minimo", width: 15 },
      { key: "unidad_medida", width: 20 },
      { key: "categoria", width: 20 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel de inventario generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel de inventario:", error.message);
    throw new Error("Error en la generación del archivo Excel de inventario.");
  }
};

/**
 * Generar un archivo Excel con datos de una factura.
 * @param {string} nombreArchivo - Nombre del archivo a generar.
 * @param {Array} columnas - Columnas de la tabla.
 * @param {Object} factura - Datos de la factura.
 * @param {Array} productos - Productos incluidos en la factura.
 * @returns {Promise<string>} - Ruta del archivo Excel generado.
 */
const generarFacturaExcel = async (nombreArchivo, columnas, factura, productos) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Factura", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // Determina el tipo de factura
    const tipoFactura = factura.tipo === "venta" ? "Venta" : "Compra";

    // Título del reporte
    worksheet.mergeCells("A1:E1"); // Ajustado para 5 columnas
    const titulo = worksheet.getCell("A1");
    titulo.value = `Factura de ${tipoFactura}`;
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = { bottom: { style: "medium", color: { argb: "4CAF50" } } };

    // Espacio entre el título y los detalles
    worksheet.addRow([]);

    // Detalles de la factura
    const detallesFactura = [
      ["Factura ID", factura.id],
      ["Fecha", new Date(factura.fecha).toLocaleString()],
      ["Método de Pago", factura.metodo_pago.charAt(0).toUpperCase() + factura.metodo_pago.slice(1)],
      ["Cajera", factura.usuarios?.nombre_completo || "N/A"],
    ];

    if (factura.metodo_pago === "transferencia") {
      const detalles = JSON.parse(factura.detalles_pago || "{}");
      detallesFactura.push(["Detalles del Pago"]);
      detallesFactura.push(["Número de Tarjeta", detalles.numero_tarjeta || "N/A"]);
      detallesFactura.push(["Cliente", detalles.nombre_cliente || "N/A"]);
      detallesFactura.push(["CI Cliente", detalles.ci_cliente || "N/A"]);
    }

    detallesFactura.forEach((detalle) => {
      const row = worksheet.addRow(detalle);
      row.eachCell((cell) => {
        cell.font = { name: "Arial", size: 12 };
      });
    });

    // Espacio entre los detalles y la tabla
    worksheet.addRow([]);

    // Encabezados de la tabla de productos
    const columnasFinales = ["Nombre del Producto", "U/M", "Cantidad", "Precio Venta", "Importe"];
    const headerRow = worksheet.addRow(columnasFinales);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Agregar filas de productos
    productos.forEach((producto) => {
      const row = worksheet.addRow([
        producto.nombre || "N/A",
        producto.unidad_medida || "N/A",
        producto.cantidad || 0,
        `$${parseFloat(producto.precio || 0).toFixed(2)}`,
        `$${parseFloat(producto.importe || 0).toFixed(2)}`,
      ]);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Espacio adicional entre los productos y el total
    worksheet.addRow([]);

    // Total de la factura
    const totalRow = worksheet.addRow(["", "", "", "Total", `$${parseFloat(factura.total).toFixed(2)}`]);
    totalRow.eachCell((cell) => {
      cell.font = { bold: true, name: "Arial", size: 12 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Mensaje de generación automática
    worksheet.addRow([]);
    worksheet.addRow(["Generado automáticamente con EmpreX"]);

    // Ajuste de ancho de columnas
    worksheet.columns.forEach((col, i) => {
      if (i === 0) col.width = 30; // Nombre del Producto
      else col.width = 15; // Otras columnas
    });

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("No se pudo generar el archivo Excel.");
  }
};






const exportarProductosMasVendidosExcel = async (productos, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productos Más Vendidos", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte con diseño mejorado**
    sheet.mergeCells("A1:C1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Productos Más Vendidos";

    // Estilo actualizado para el título
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
titulo.alignment = { horizontal: "center", vertical: "middle" };
titulo.border = {
  bottom: { style: "medium", color: { argb: "4CAF50" } }, // Línea verde debajo
};


    // **Espacio vacío entre título y fechas**
    sheet.addRow([]);

    // **Fechas**
    const fechas = [
      `Fecha Inicio: ${detalles.fechaInicio}`,
      `Fecha Fin: ${detalles.fechaFin}`,
      `Fecha de la Consulta: ${new Date().toISOString().split("T")[0]}`,
    ];
    fechas.forEach((texto) => {
      const fechaRow = sheet.addRow([texto]);
      fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
      fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // **Espacio vacío entre fechas y tabla**
    sheet.addRow([]);

    // **Encabezados de la tabla**
    const headerRow = sheet.addRow(["Producto", "Cantidad Vendida", "Ingreso Total ($)"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } }; // Verde
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Agregar datos de los productos**
    productos.forEach((producto) => {
      const row = sheet.addRow([
        producto.nombre || "N/A",
        producto.cantidad_vendida || 0,
        parseFloat(producto.ingreso_total || 0).toFixed(2),
      ]);

      row.getCell(2).alignment = { horizontal: "center" }; // Alinear cantidad al centro
      row.getCell(3).alignment = { horizontal: "right" }; // Alinear ingreso total a la derecha

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "nombre", width: 30 },
      { key: "cantidad_vendida", width: 20 },
      { key: "ingreso_total", width: 25 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("Error en la generación del archivo Excel.");
  }
};
/**
 * Enviar un archivo Excel al cliente.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {string} rutaArchivo - Ruta del archivo Excel generado.
 * @param {string} nombreDescarga - Nombre del archivo que se descargará.
 */
const enviarExcel = (res, rutaArchivo, nombreDescarga) => {
  res.download(rutaArchivo, nombreDescarga, (err) => {
    if (err) {
      console.error("Error al enviar el archivo Excel:", err.message);
      res.status(500).json({ error: "Error al enviar el archivo Excel." });
    } else {
      fs.unlinkSync(rutaArchivo); // Eliminar el archivo después de enviarlo
    }
  });
};


const exportarResumenVentas = async (ventasData, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();
    // Función para obtener la hora de Cuba
const getCubaDate = () => {
  const options = {
    timeZone: "America/Havana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  const cubaDate = new Intl.DateTimeFormat("en-US", options).format(new Date());
  
  // Convertimos de MM/DD/YYYY a YYYY-MM-DD
  const [month, day, year] = cubaDate.split("/");
  return `${year}-${month}-${day}`;
};

    
    const sheet = workbook.addWorksheet("Resumen de Ventas", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte**
    sheet.mergeCells("A1:D1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Resumen de Ventas";

    // Estilo del título
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = {
      bottom: { style: "medium", color: { argb: "4CAF50" } }, // Línea verde debajo
    };

    // **Espacio vacío**
    sheet.addRow([]);

// **Fechas**
const fechas = [
  `Fecha Inicio: ${detalles.fechaInicio}`,
  `Fecha Fin: ${detalles.fechaFin}`,
  `Fecha de la Consulta: ${getCubaDate()}`, // Ajuste a formato YYYY-MM-DD
];
fechas.forEach((texto) => {
  const fechaRow = sheet.addRow([texto]);
  fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
  fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
});

    // **Espacio vacío**
    sheet.addRow([]);

    // **Encabezados de productos vendidos**
    const headerRow = sheet.addRow(["Producto", "Precio Unitario ($)", "Cantidad Total", "Importe Total ($)"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Datos de productos vendidos**
  ventasData.productosVendidos.forEach((producto) => {
  const nombre = producto?.Producto || "N/A";
  const precioUnitario = `$${parseFloat(producto["Precio Unitario"] || 0).toFixed(2)}`;
  const cantidadTotal = producto["Cantidad Total"] || 0;
  const importeTotal = `$${parseFloat(producto["Importe Total"] || 0).toFixed(2)}`;

  const row = sheet.addRow([nombre, precioUnitario, cantidadTotal, importeTotal]);

  row.getCell(2).alignment = { horizontal: "right" }; // Alinear precio unitario a la derecha
  row.getCell(3).alignment = { horizontal: "center" }; // Alinear cantidad al centro
  row.getCell(4).alignment = { horizontal: "right" }; // Alinear importe total a la derecha

  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
});

// Espacio antes de totales
sheet.addRow([]);
sheet.addRow(["Cierre Económico"]);

// Totales Generales
const totalesHeaderRow = sheet.addRow([
  "Total de Unidades Vendidas",
  "Total en Efectivo ($)",
  "Total en Transferencias ($)",
  "Ingresos Totales ($)",
]);
totalesHeaderRow.eachCell((cell) => {
  cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
});

const totalesRow = sheet.addRow([
  ventasData.totales.productos_totales || 0,
  `$${ventasData.totales.total_efectivo || "0.00"}`,
  `$${ventasData.totales.total_transferencia || "0.00"}`,
  `$${ventasData.totales.ingresos_totales || "0.00"}`,
]);
totalesRow.eachCell((cell) => {
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };
});



    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "Producto", width: 30 },
      { key: "Precio Unitario", width: 20 },
      { key: "Cantidad Total", width: 20 },
      { key: "Importe Total", width: 25 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("Error en la generación del archivo Excel.");
  }
};

/**
 * Generar un archivo Excel para exportar pagos a empleados.
 * @param {Array} pagos - Lista de pagos a incluir en el archivo.
 * @param {Object} detalles - Detalles del reporte (fechas de inicio y fin).
 * @returns {Buffer} - El archivo Excel en forma de buffer.
 */
const exportarPagosEmpleadosExcel = async (pagos, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Pagos a Empleados", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte**
    sheet.mergeCells("A1:E1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Pagos a Empleados";
    titulo.font = { size: 16, bold: true, name: "Calibri", color: { argb: "4CAF50" } }; // Verde
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = { bottom: { style: "medium", color: { argb: "4CAF50" } } };

    // **Fechas del reporte**
    sheet.addRow([]);
    const fechas = [
      `Fecha de Inicio: ${detalles.fechaInicio}`,
      `Fecha de Fin: ${detalles.fechaFin}`,
      `Generado el: ${new Date().toISOString().split("T")[0]}`,
    ];
    fechas.forEach((texto) => {
      const row = sheet.addRow([texto]);
      row.getCell(1).font = { size: 12, name: "Calibri" };
      row.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // Espacio vacío
    sheet.addRow([]);

    // **Encabezados de la tabla**
    const headerRow = sheet.addRow([
      "Empleado",
      "Monto Pagado ($)",
      "Fecha de Pago",
      "Método de Pago",
      "Notas",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Calibri", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } }; // Verde
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin", color: { argb: "4CAF50" } },
        left: { style: "thin", color: { argb: "4CAF50" } },
        bottom: { style: "thin", color: { argb: "4CAF50" } },
        right: { style: "thin", color: { argb: "4CAF50" } },
      };
    });

    // **Contenido de la tabla**
    pagos.forEach((pago) => {
      const row = sheet.addRow([
        pago.nombre_empleado || "N/A",
        `$${parseFloat(pago.monto || 0).toFixed(2)}`,
        new Date(pago.fecha_pago).toLocaleString(),
        pago.metodo_pago || "N/A",
        pago.notas || "Sin notas",
      ]);

      row.getCell(2).alignment = { horizontal: "right" };
      row.getCell(3).alignment = { horizontal: "center" };
      row.getCell(4).alignment = { horizontal: "center" };
      row.getCell(5).alignment = { horizontal: "left" };

      row.eachCell((cell) => {
        cell.font = { size: 11, name: "Calibri" };
        cell.border = {
          top: { style: "thin", color: { argb: "4CAF50" } }, // Verde
          left: { style: "thin", color: { argb: "4CAF50" } },
          bottom: { style: "thin", color: { argb: "4CAF50" } },
          right: { style: "thin", color: { argb: "4CAF50" } },
        };
      });
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "empleado", width: 30 },
      { key: "monto_pagado", width: 20 },
      { key: "fecha_pago", width: 25 },
      { key: "metodo_pago", width: 20 },
      { key: "notas", width: 40 },
    ];

    // **Espacio extra y pie de página**
    sheet.addRow([]);
    const footer = sheet.addRow(["Reporte generado automáticamente por EmpreX"]);
    footer.getCell(1).font = { italic: true, size: 10, name: "Calibri" };
    footer.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("Error en la generación del archivo Excel.");
  }
};
// Exportar resumen de compras a Excel
const exportarResumenCompras = async (comprasData, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Función para obtener la hora en formato YYYY-MM-DD
    const getCubaDate = () => {
      const options = {
        timeZone: "America/Havana",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const cubaDate = new Intl.DateTimeFormat("en-US", options).format(new Date());
      const [month, day, year] = cubaDate.split("/");
      return `${year}-${month}-${day}`;
    };

    // Crear hoja
    const sheet = workbook.addWorksheet("Resumen de Compras", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte**
    sheet.mergeCells("A1:D1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Resumen de Compras";
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = {
      bottom: { style: "medium", color: { argb: "4CAF50" } },
    };

    // **Fechas**
    sheet.addRow([]);
    const fechas = [
      `Fecha Inicio: ${detalles.fechaInicio}`,
      `Fecha Fin: ${detalles.fechaFin}`,
      `Fecha de la Consulta: ${getCubaDate()}`,
    ];
    fechas.forEach((texto) => {
      const fechaRow = sheet.addRow([texto]);
      fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
      fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // **Espacio vacío**
    sheet.addRow([]);

    // **Encabezados de productos**
    const headerRow = sheet.addRow(["Producto", "Precio Unitario ($)", "Cantidad Total", "Importe Total ($)"]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Datos de productos**
    // **Datos de productos**
comprasData.productosComprados.forEach((producto) => {
  const nombre = producto.Producto || "N/A";
  const cantidadTotal = producto["Cantidad Total"] || 0;
  const precioUnitario = producto["Precio Unitario"] || "0.00";
  const importeTotal = producto["Importe Total"] || "0.00";

  const row = sheet.addRow([
    nombre,
    precioUnitario.startsWith("$") ? precioUnitario : `$${precioUnitario}`, // Asegura el formato de precio
    cantidadTotal,
    importeTotal.startsWith("$") ? importeTotal : `$${importeTotal}`, // Asegura el formato de importe
  ]);

  row.getCell(2).alignment = { horizontal: "right" };
  row.getCell(3).alignment = { horizontal: "center" };
  row.getCell(4).alignment = { horizontal: "right" };

  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
});



    // **Espacio antes de totales**
    sheet.addRow([]);
    sheet.addRow(["Cierre Económico"]);

    // **Totales generales**
    const totalesHeaderRow = sheet.addRow([
      "Total de Unidades Compradas",
      "Total en Efectivo ($)",
      "Total en Transferencias ($)",
      "Gastos Totales ($)",
    ]);
    totalesHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    const totalesRow = sheet.addRow([
      comprasData.totales.productos_totales || 0,
      `$${parseFloat(comprasData.totales.total_efectivo || 0).toFixed(2)}`,
      `$${parseFloat(comprasData.totales.total_transferencia || 0).toFixed(2)}`,
      `$${parseFloat(comprasData.totales.gastos_totales || 0).toFixed(2)}`,
    ]);
    totalesRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "Producto", width: 30 },
      { key: "Precio Unitario", width: 20 },
      { key: "Cantidad Total", width: 20 },
      { key: "Importe Total", width: 25 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel:", error.message);
    throw new Error("Error en la generación del archivo Excel.");
  }
};
const exportarBalanceGeneral = async (balanceData, detalles) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Función para obtener la hora de Cuba
    const getCubaDate = () => {
      const options = {
        timeZone: "America/Havana",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      };
      const cubaDate = new Intl.DateTimeFormat("en-US", options).format(new Date());

      // Convertimos de MM/DD/YYYY a YYYY-MM-DD
      const [month, day, year] = cubaDate.split("/");
      return `${year}-${month}-${day}`;
    };

    const sheet = workbook.addWorksheet("Balance General", {
      pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    });

    // **Título del reporte**
    sheet.mergeCells("A1:D1");
    const titulo = sheet.getCell("A1");
    titulo.value = "Balance General";

    // Estilo del título
    titulo.font = { size: 16, bold: true, name: "Arial", color: { argb: "4CAF50" } };
    titulo.alignment = { horizontal: "center", vertical: "middle" };
    titulo.border = {
      bottom: { style: "medium", color: { argb: "4CAF50" } }, // Línea verde debajo
    };

    // **Espacio vacío**
    sheet.addRow([]);

    // **Fechas**
    const fechas = [
      `Fecha Inicio: ${detalles.fechaInicio}`,
      `Fecha Fin: ${detalles.fechaFin}`,
      `Fecha de la Consulta: ${getCubaDate()}`,
    ];
    fechas.forEach((texto) => {
      const fechaRow = sheet.addRow([texto]);
      fechaRow.getCell(1).font = { bold: true, name: "Arial", size: 12 };
      fechaRow.getCell(1).alignment = { horizontal: "left", vertical: "middle" };
    });

    // **Espacio vacío**
    sheet.addRow([]);

    // **Encabezados de resumen financiero**
    const headerRow = sheet.addRow([
      "Total Ingresos ($)",
      "Total Egresos ($)",
      "Utilidad/Pérdida Neta ($)",
      "Utilidad Neta Después de Pagos ($)",
    ]);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Datos del resumen financiero**
    const resumenRow = sheet.addRow([
      `$${parseFloat(balanceData.resumenFinanciero.totalIngresos || 0).toFixed(2)}`,
      `$${parseFloat(balanceData.resumenFinanciero.totalEgresos || 0).toFixed(2)}`,
      `$${parseFloat(balanceData.resumenFinanciero.utilidadNeta || 0).toFixed(2)}`,
      `$${parseFloat(balanceData.resumenFinanciero.utilidadNetaDespuesPagos || 0).toFixed(2)}`,
    ]);
    resumenRow.eachCell((cell) => {
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Espacio vacío**
    sheet.addRow([]);

    // **Encabezados de detalles**
    const detallesHeaderRow = sheet.addRow(["Tipo", "Descripción", "Monto ($)"]);
    detallesHeaderRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" }, name: "Arial", size: 12 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "4CAF50" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // **Datos de los detalles**
    balanceData.detalles.forEach((detalle) => {
      const row = sheet.addRow([
        detalle.tipo || "N/A",
        detalle.descripcion || "N/A",
        `$${parseFloat(detalle.monto || 0).toFixed(2)}`,
      ]);
      row.getCell(3).alignment = { horizontal: "right" }; // Alinear montos a la derecha
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // **Ajustar ancho de columnas**
    sheet.columns = [
      { key: "Tipo", width: 20 },
      { key: "Descripción", width: 40 },
      { key: "Monto", width: 20 },
    ];

    // **Espacio adicional antes del pie de página**
    sheet.addRow([]);

    // **Pie de página**
    const footerRow = sheet.addRow(["Generado automáticamente por EmpreX."]);
    footerRow.getCell(1).font = { italic: true, size: 10, name: "Arial" };
    footerRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    console.log("Archivo Excel del Balance General generado exitosamente.");
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error("Error al generar el archivo Excel del Balance General:", error.message);
    throw new Error("Error en la generación del archivo Excel del Balance General.");
  }
};




module.exports = {
  exportarInventarioExcel,
  exportarBalanceGeneral,
  generarFacturaExcel,
  exportarProductosMasVendidosExcel,
  exportarResumenVentas, exportarResumenCompras,
  exportarPagosEmpleadosExcel, // Añadir la nueva función al módulo
  enviarExcel,
  exportarAlertasStockBajoExcel,
};
