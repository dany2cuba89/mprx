const express = require("express");
const supabase = require("../database");
const { generarFacturaExcel, enviarExcel } = require("../utils/excel");
const { generarPDF, enviarPDF } = require("../utils/pdf");

const router = express.Router();

router.post("/factura-compra", async (req, res) => {
  const { productos, metodo_pago, proveedor, cajera } = req.body;

  try {
    for (const producto of productos) {
      await supabase.rpc("registrar_compra", {
        nombre: producto.nombre,
        precio_compra: producto.precio_compra,
        precio_venta: producto.precio_venta,
        stock: producto.cantidad,
        nivel_minimo: producto.nivel_minimo || 0,
        unidad_medida: producto.unidad_medida || "N/A",
        categoria: producto.categoria || "N/A",
        metodo_pago,
        proveedor,
        cajera,
      });
    }

    res.status(201).json({ message: "Factura de compra registrada exitosamente." });
  } catch (error) {
    console.error("Error al registrar factura de compra:", error.message);
    res.status(400).json({ error: error.message });
  }
});


// Endpoint para exportar factura a Excel
router.get("/exportar-excel/:id", async (req, res) => {
    const facturaId = req.params.id;

    try {
        // Recuperar datos de la factura
        const { data: factura, error } = await supabase
            .from("facturas")
            .select("*, usuarios:usuarios(nombre_completo)")
            .eq("id", facturaId)
            .single();

        if (error || !factura) throw new Error("Factura no encontrada.");

        // Procesar columna productos
        let productos = [];
        if (typeof factura.productos === "string") {
            productos = JSON.parse(factura.productos);
        } else if (Array.isArray(factura.productos)) {
            productos = factura.productos;
        } else if (typeof factura.productos === "object") {
            productos = [factura.productos]; // Envuelve en un array
        } else {
            throw new Error("Formato de productos no válido.");
        }

        if (!productos || productos.length === 0) {
            throw new Error("La lista de productos está vacía o no es válida.");
        }

        // Determinar tipo de factura
        const esVenta = factura.tipo === "venta";
        const tituloFactura = esVenta ? "Factura de Venta" : "Factura de Compra";

        // Configurar columnas de la tabla
        const columnas = ["Nombre del Producto", "U/M", "Cantidad", esVenta ? "Precio Venta" : "Precio Compra", "Importe"];

        // Procesar productos con lógica común
        const productosProcesados = productos.map((producto) => {
            // Asegurarse de que `unidad_medida` esté siempre definido
            const unidadMedida = producto.unidad_medida || "N/A";
            const precio = esVenta ? producto.precio_venta : producto.precio_compra;
            const cantidad = producto.cantidad || 0;
            const importe = cantidad * (precio || 0);

            return {
                ...producto,
                unidad_medida: unidadMedida, // Incluye la unidad de medida
                precio,
                cantidad,
                importe,
            };
        });

        // Generar el archivo Excel
        const buffer = await generarFacturaExcel(
            tituloFactura,
            columnas,
            factura,
            productosProcesados
        );

        // Configurar encabezados para la descarga
        const nombreArchivo = `${tituloFactura}_${factura.id}.xlsx`;
        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${nombreArchivo}"`
        );
        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        // Enviar el buffer como respuesta
        res.send(buffer);
    } catch (error) {
        console.error("Error al exportar Excel:", error.message);
        res.status(500).json({ error: "Error al exportar Excel." });
    }
});





// Endpoint para exportar factura a PDF
router.get("/exportar-pdf/:id", async (req, res) => {
    const facturaId = req.params.id;

    try {
        const { data: factura, error } = await supabase
            .from("facturas")
            .select("*, usuarios:usuarios(nombre_completo)")
            .eq("id", facturaId)
            .single();

        if (error || !factura) throw new Error("Factura no encontrada.");

        const productos = JSON.parse(factura.productos || "[]");
        const nombreArchivo = `Factura_${facturaId}.pdf`;
        const rutaArchivo = await generarPDF(factura, productos, nombreArchivo);

        enviarPDF(res, rutaArchivo, nombreArchivo);
    } catch (error) {
        console.error("Error al exportar PDF:", error.message);
        res.status(500).json({ error: "Error al exportar PDF." });
    }
});

// Registrar una nueva factura
router.post("/", async (req, res) => {
    const { tipo, productos, total, metodo_pago, cajera, detalles_pago } = req.body;

    try {
        const factura = {
            tipo,
            productos: JSON.stringify(productos),
            total,
            metodo_pago,
            cajera: tipo === "venta" ? cajera : null,
            detalles_pago: metodo_pago === "transferencia" ? JSON.stringify(detalles_pago) : null,
            fecha: new Date().toISOString(),
        };

        const { data, error } = await supabase.from("facturas").insert([factura]);

        if (error) throw error;

        res.status(201).json({
            message: `Factura de ${tipo} registrada exitosamente`,
            factura: data[0],
        });
    } catch (error) {
        console.error("Error al registrar factura:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// Confirmar venta: Generar factura y actualizar inventario
router.post("/confirmar-venta", async (req, res) => {
    const { carrito, metodo_pago, cajera, detalles_pago } = req.body;

    if (!carrito || carrito.length === 0) {
        return res.status(400).json({ error: "El carrito está vacío." });
    }
    if (!metodo_pago || !["efectivo", "transferencia"].includes(metodo_pago)) {
        return res.status(400).json({ error: "Método de pago inválido." });
    }
    if (metodo_pago === "transferencia" && (!detalles_pago || !detalles_pago.numero_tarjeta)) {
        return res.status(400).json({ error: "Detalles de pago incompletos para transferencia." });
    }
    if (!cajera) {
        return res.status(400).json({ error: "Cajera no especificada." });
    }

    try {
        const total = carrito.reduce((sum, item) => sum + item.importe, 0);

        const factura = {
            tipo: "venta",
            productos: JSON.stringify(carrito),
            total,
            metodo_pago,
            cajera,
            detalles_pago: metodo_pago === "transferencia" ? JSON.stringify(detalles_pago) : null,
            fecha: new Date().toISOString(),
        };

        const { data: facturaInsertada, error: facturaError } = await supabase
            .from("facturas")
            .insert([factura])
            .select("*");

        if (facturaError) throw new Error("No se pudo registrar la factura.");

        const resumenVenta = {
            fecha: factura.fecha.split("T")[0],
            ingresos_totales: total,
            efectivo: metodo_pago === "efectivo" ? total : 0,
            transferencia: metodo_pago === "transferencia" ? total : 0,
            productos_vendidos: carrito,
            cajero: cajera,
        };

        const { error: ventasDiariasError } = await supabase.from("ventas_diarias").insert([resumenVenta]);

        if (ventasDiariasError) throw new Error(ventasDiariasError.message);

        for (const item of carrito) {
            const producto_id = parseInt(item.id, 10);
            if (isNaN(producto_id)) {
                throw new Error(`El ID del producto (${item.id}) no es válido.`);
            }

            const { error: inventarioError } = await supabase.rpc("decrementar_stock", {
                producto_id,
                cantidad: item.cantidad,
            });

            if (inventarioError) throw new Error(inventarioError.message);
        }

        res.status(201).json({
            message: "Venta registrada exitosamente.",
            factura: facturaInsertada[0],
        });
    } catch (error) {
        console.error("Error inesperado en el servidor:", error.message);
        res.status(500).json({ error: error.message || "Error inesperado en el servidor." });
    }
});


// Consultar facturas
router.get("/", async (req, res) => {
    const { tipo, fechaInicio, fechaFin } = req.query;

    try {
        let query = supabase.from("facturas").select("*, usuarios:usuarios(nombre_completo)");

        if (tipo) query = query.eq("tipo", tipo);
        if (fechaInicio && fechaFin) {
            query = query.gte("fecha", fechaInicio).lte("fecha", fechaFin);
        }

        const { data: facturas, error } = await query;

        if (error) throw error;

        res.status(200).json(facturas);
    } catch (error) {
        console.error("Error al consultar facturas:", error.message);
        res.status(400).json({ error: error.message });
    }
});

// Eliminar una factura
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase.from("facturas").delete().eq("id", id);

        if (error) throw error;

        res.status(200).json({ message: "Factura eliminada exitosamente", factura: data[0] });
    } catch (error) {
        console.error("Error al eliminar factura:", error.message);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
