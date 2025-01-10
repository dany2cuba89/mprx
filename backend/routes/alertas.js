const express = require("express");
const supabase = require("../database");

const router = express.Router();

// Generar alertas de bajo stock
router.post("/generar", async (req, res) => {
    try {
        // Obtener productos con bajo stock desde Supabase
        const { data: alertas, error } = await supabase.rpc("obtener_alertas_bajo_stock");

        if (error) throw new Error(`Error al ejecutar la función: ${error.message}`);

        if (!alertas || alertas.length === 0) {
            return res.status(200).json({ message: "No hay productos con bajo stock.", alertas: [] });
        }

        const nuevasAlertas = [];

        // Verificar e insertar alertas nuevas
        for (const alerta of alertas) {
            const { nombre, stock, nivel_minimo } = alerta;

            const { data: alertaExistente, error: errorExistente } = await supabase
                .from("alertas_stock")
                .select("*")
                .eq("nombre_producto", nombre)
                .eq("estado", "pendiente")
                .single();

            if (errorExistente) throw new Error(`Error al verificar alertas: ${errorExistente.message}`);

            if (!alertaExistente) {
                const { data: nuevaAlerta, error: errorInsertar } = await supabase
                    .from("alertas_stock")
                    .insert({
                        nombre_producto: nombre,
                        nivel_stock: stock,
                        nivel_minimo: nivel_minimo,
                        estado: "pendiente",
                    })
                    .select("*")
                    .single();

                if (errorInsertar) throw new Error(`Error al registrar alerta: ${errorInsertar.message}`);
                nuevasAlertas.push(nuevaAlerta);
            }
        }

        res.status(200).json({ message: "Alertas procesadas correctamente.", nuevasAlertas });
    } catch (error) {
        console.error("Error al generar alertas de bajo stock:", error.message);
        res.status(500).json({ error: "Error al generar alertas de bajo stock." });
    }
});

// Obtener todas las alertas activas
router.get("/", async (req, res) => {
    try {
        const { data: alertas, error } = await supabase
            .from("alertas_stock")
            .select("*")
            .eq("estado", "pendiente");

        if (error) throw new Error(error.message);

        res.status(200).json({ alertas });
    } catch (error) {
        console.error("Error al obtener alertas de bajo stock:", error.message);
        res.status(500).json({ error: "Error al obtener alertas de bajo stock." });
    }
});

module.exports = router;
