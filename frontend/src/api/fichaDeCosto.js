import { supabase } from "../api/supabase";

// Obtener ficha de costo por producto
export const getFichaDeCosto = async (idProducto) => {
  const { data, error } = await supabase.from("ficha_de_costo").select("*").eq("id_producto", idProducto);
  if (error) throw new Error(error.message);
  return data[0];
};

// Registrar nueva ficha de costo
export const registerFichaDeCosto = async (ficha) => {
  const { data, error } = await supabase.from("ficha_de_costo").insert(ficha).select();
  if (error) throw new Error(error.message);
  return data[0];
};

// Actualizar ficha de costo existente
export const updateFichaDeCosto = async (id, ficha) => {
  const { error } = await supabase.from("ficha_de_costo").update(ficha).eq("id", id);
  if (error) throw new Error(error.message);
};
