const express = require("express");
const supabase = require("../database");

const router = express.Router();

// Registrar un usuario
router.post("/register", async (req, res) => {
    const { username, password, rol, correo, nombre_completo } = req.body;

    try {
        const fechaCreacion = new Date(); // Fecha actual sin zona horaria
        const { data, error } = await supabase
            .from("usuarios")
            .insert([{ username, password, rol, correo, nombre_completo, fecha_creacion: fechaCreacion }])
            .select(); // Asegura que los datos insertados sean devueltos

        if (error) throw error;

        // Verifica que data no esté vacío antes de intentar acceder a data[0]
        if (!data || data.length === 0) {
            return res.status(500).json({ error: "No se pudo registrar el usuario" });
        }

        res.status(201).json({ message: "Usuario registrado", usuario: data[0] });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// Listar usuarios
router.get("/", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("usuarios")
            .select("id, username, rol, correo, nombre_completo, fecha_creacion");

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Actualizar usuario
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { username, password, rol, correo, nombre_completo } = req.body;

  console.log("Datos recibidos para actualizar:", req.body);
  console.log("ID recibido para actualizar:", id);

  try {
    // Construir el objeto de actualización
    const fieldsToUpdate = {
      username,
      rol,
      correo,
      nombre_completo,
    };

    // Incluir el password si está presente
    if (password !== undefined) {
      console.log("Password incluido para actualizar:", password);
      fieldsToUpdate.password = password.trim() !== "" ? password : undefined;
    }

    console.log("Campos enviados a Supabase:", fieldsToUpdate);

    // Actualizar en la base de datos
    const { data, error } = await supabase
      .from("usuarios")
      .update(fieldsToUpdate)
      .eq("id", id)
      .select("*");

    if (error) {
      console.error("Error al actualizar:", error);
      return res.status(400).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.warn("No se actualizó ningún registro.");
      return res.status(404).json({ message: "Usuario no encontrado o no actualizado." });
    }

    console.log("Resultado después de la actualización:", data);

    res.status(200).json({ message: "Usuario actualizado", usuario: data[0] });
  } catch (error) {
    console.error("Error en el servidor:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});



























// Eliminar usuario
router.delete("/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const { error } = await supabase.from("usuarios").delete().eq("id", id);

        if (error) throw error;

        res.status(200).json({ message: "Usuario eliminado" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
