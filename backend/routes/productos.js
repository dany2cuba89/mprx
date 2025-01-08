const express = require("express");
const supabase = require("../database");
const QRCode = require("qrcode");
const ExcelJS = require("exceljs");
const fs = require("fs");

const router = express.Router();

// Crear un producto
router.post("/", async (req, res) => {
    const { nombre, precio, stock, nivel_minimo, unidad_medida, categoria } = req.body;

    try {
        const { data, error } = await supabase
            .from("productos")
            .insert([{ nombre, precio, stock, nivel_minimo, unidad_medida, categoria }]);

        if (error) throw error;

        res.status(201).json({
            message: "Producto creado exitosamente",
            producto: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Consultar productos (con filtros opcionales)
router.get("/", async (req, res) => {
    const { nombre, categoria } = req.query;

    try {
        let query = supabase.from("productos").select("*");

        if (nombre) query = query.ilike("nombre", `%${nombre}%`);
        if (categoria) query = query.eq("categoria", categoria);

        const { data: productos, error } = await query;

        if (error) throw error;

        res.status(200).json(productos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Consultar un producto por ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data: producto, error } = await supabase
            .from("productos")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !producto) throw new Error("Producto no encontrado");

        res.status(200).json(producto);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar un producto
router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { nombre, precio, stock, nivel_minimo, unidad_medida, categoria } = req.body;

    try {
        const { data, error } = await supabase
            .from("productos")
            .update({ nombre, precio, stock, nivel_minimo, unidad_medida, categoria })
            .eq("id", id);

        if (error) throw error;

        res.status(200).json({
            message: "Producto actualizado exitosamente",
            producto: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Eliminar un producto
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data, error } = await supabase.from("productos").delete().eq("id", id);

        if (error) throw error;

        res.status(200).json({
            message: "Producto eliminado exitosamente",
            producto: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Generar código QR de un producto
router.get("/generar-qr/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { data: producto, error } = await supabase
            .from("productos")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !producto) throw new Error("Producto no encontrado");

        const qrData = await QRCode.toDataURL(`${producto.nombre} - ${producto.categoria}`);
        res.status(200).json({ qr: qrData });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar el stock de un producto
router.patch("/:id/stock", async (req, res) => {
    const { id } = req.params;
    const { cantidad } = req.body;

    try {
        const { data: producto, error } = await supabase
            .from("productos")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !producto) throw new Error("Producto no encontrado");

        const nuevoStock = producto.stock + cantidad;

        const { data, error: updateError } = await supabase
            .from("productos")
            .update({ stock: nuevoStock })
            .eq("id", id);

        if (updateError) throw updateError;

        res.status(200).json({
            message: "Stock actualizado exitosamente",
            producto: data[0],
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Exportar productos a Excel
router.get("/exportar-excel", async (req, res) => {
    try {
        const { data: productos, error } = await supabase.from("productos").select("*");

        if (error) throw error;

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Productos");

        worksheet.columns = [
            { header: "ID", key: "id", width: 20 },
            { header: "Nombre", key: "nombre", width: 30 },
            { header: "Precio", key: "precio", width: 10 },
            { header: "Stock", key: "stock", width: 10 },
            { header: "Nivel Mínimo", key: "nivel_minimo", width: 15 },
            { header: "Unidad de Medida", key: "unidad_medida", width: 15 },
            { header: "Categoría", key: "categoria", width: 20 },
        ];

        productos.forEach((producto) => worksheet.addRow(producto));

        const filePath = "./productos.xlsx";
        await workbook.xlsx.writeFile(filePath);

        res.download(filePath, "productos.xlsx", () => {
            fs.unlinkSync(filePath);
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
