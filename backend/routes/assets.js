const express = require('express');
const router = express.Router();
const supabase = require('../database/index').supabase;

// Crear un nuevo activo fijo
router.post('/assets', async (req, res) => {
  const { nombre, categoria, fecha_adquisicion, valor_inicial, estado, descripcion } = req.body;

  try {
    const { data, error } = await supabase
      .from('activos_fijos')
      .insert([{ 
        nombre, 
        categoria, 
        fecha_adquisicion, 
        valor_inicial, 
        estado, 
        descripcion 
      }]);

    if (error) throw error;
    res.status(201).json({ message: 'Activo fijo registrado con éxito.', activo: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar el activo fijo.', error: error.message });
  }
});

// Obtener todos los activos fijos
router.get('/assets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('activos_fijos')
      .select('*');

    if (error) throw error;
    res.status(200).json({ activos: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los activos fijos.', error: error.message });
  }
});

// Actualizar un activo fijo por ID
router.put('/assets/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const { data, error } = await supabase
      .from('activos_fijos')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Activo fijo actualizado con éxito.', activo: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el activo fijo.', error: error.message });
  }
});

// Eliminar un activo fijo por ID
router.delete('/assets/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('activos_fijos')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.status(200).json({ message: 'Activo fijo eliminado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el activo fijo.', error: error.message });
  }
});

module.exports = router;
