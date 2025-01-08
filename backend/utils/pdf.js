const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Generar un archivo PDF para una factura.
 * @param {Object} factura - Datos de la factura.
 * @param {Array} productos - Productos incluidos en la factura.
 * @param {string} nombreArchivo - Nombre del archivo PDF.
 * @returns {Promise<string>} - Ruta del archivo PDF generado.
 */
function generarPDF(factura, productos, nombreArchivo) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 30 });
            const rutaArchivo = path.join(__dirname, "../", nombreArchivo);

            const writeStream = fs.createWriteStream(rutaArchivo);
            doc.pipe(writeStream);

            // Encabezado
            doc.fontSize(18).text(`Factura de ${factura.tipo.charAt(0).toUpperCase() + factura.tipo.slice(1)}`, { align: "center" });
            doc.moveDown();
            doc.fontSize(12).text(`Factura ID: ${factura.id}`);
            doc.text(`Fecha: ${new Date(factura.fecha).toLocaleString()}`);
            doc.text(`Método de Pago: ${factura.metodo_pago.charAt(0).toUpperCase() + factura.metodo_pago.slice(1)}`);
            doc.text(`Dependiente: ${factura.usuarios?.nombre_completo || "N/A"}`);

            if (factura.metodo_pago === "transferencia") {
                const detalles = JSON.parse(factura.detalles_pago || "{}");
                doc.moveDown();
                doc.text("Detalles del Pago:");
                doc.text(`- Número de Tarjeta: ${detalles.numero_tarjeta || "N/A"}`);
                doc.text(`- Cliente: ${detalles.nombre_cliente || "N/A"}`);
                doc.text(`- CI Cliente: ${detalles.ci_cliente || "N/A"}`);
            }

            doc.moveDown();

            // Tabla de productos
            const tableTop = doc.y;
            const itemSpacing = 20;
            const cellWidth = [200, 80, 100, 100]; // Ancho de cada columna

            // Dibujar encabezados de la tabla
            const headerHeight = 20;
            const headers = ["Nombre del Producto", "Cantidad", "Precio Unitario", "Importe"];

            headers.forEach((header, i) => {
                const x = 30 + cellWidth.slice(0, i).reduce((sum, w) => sum + w, 0);
                doc.rect(x, tableTop, cellWidth[i], headerHeight).stroke();
                doc.text(header, x + 5, tableTop + 5, { width: cellWidth[i] - 10, align: "center" });
            });

            // Dibujar filas de productos
            productos.forEach((producto, index) => {
                const y = tableTop + headerHeight + itemSpacing * index;
                const rowHeight = 20;

                [
                    producto.nombre,
                    producto.cantidad.toString(),
                    `$${producto.precio.toFixed(2)}`,
                    `$${producto.importe.toFixed(2)}`,
                ].forEach((value, i) => {
                    const x = 30 + cellWidth.slice(0, i).reduce((sum, w) => sum + w, 0);
                    doc.rect(x, y, cellWidth[i], rowHeight).stroke();
                    doc.text(value, x + 5, y + 5, { width: cellWidth[i] - 10, align: "center" });
                });
            });

            // Dibujar fila del total
            const totalY = tableTop + headerHeight + itemSpacing * productos.length;
            const totalRowHeight = 20;

            ["", "", "Total", `$${factura.total.toFixed(2)}`].forEach((value, i) => {
                const x = 30 + cellWidth.slice(0, i).reduce((sum, w) => sum + w, 0);
                doc.rect(x, totalY, cellWidth[i], totalRowHeight).stroke();
                doc.font(i === 3 ? "Helvetica-Bold" : "Helvetica").text(value, x + 5, totalY + 5, {
                    width: cellWidth[i] - 10,
                    align: "center",
                });
            });

            // Finalizar PDF
            doc.end();
            writeStream.on("finish", () => resolve(rutaArchivo));
            writeStream.on("error", (err) => reject(err));
        } catch (error) {
            console.error("Error al generar PDF:", error.message);
            reject("No se pudo generar el PDF.");
        }
    });
}

/**
 * Enviar un archivo PDF al cliente.
 * @param {Response} res - Objeto de respuesta de Express.
 * @param {string} rutaArchivo - Ruta del archivo PDF generado.
 * @param {string} nombreDescarga - Nombre del archivo que se descargará.
 */
function enviarPDF(res, rutaArchivo, nombreDescarga) {
    res.download(rutaArchivo, nombreDescarga, (err) => {
        if (err) {
            console.error("Error al enviar el archivo PDF:", err.message);
            res.status(500).json({ error: "Error al enviar el archivo PDF." });
        } else {
            fs.unlinkSync(rutaArchivo); // Eliminar el archivo después de enviarlo
        }
    });
}

module.exports = { generarPDF, enviarPDF };
