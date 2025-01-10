import { supabase } from "./supabase";

// Obtener lista de usuarios
export const getUsuarios = async () => {
    const { data, error } = await supabase.from("usuarios").select("*");

    if (error) throw new Error(error.message);

    return data;
};

// Registrar un nuevo usuario
export const registerUser = async (usuario) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Error al registrar el usuario");
    }

    const result = await response.json();
    if (!result.usuario) {
        throw new Error("El usuario no fue registrado correctamente.");
    }

    return result.usuario;
};


// Actualizar usuario
// Actualizar usuario
export const updateUsuario = async (id, usuario) => {
  console.log("Datos enviados al servidor:", usuario); // Depuración

  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(usuario), // Asegúrate de incluir todos los datos
  });

  if (!response.ok) {
    const { error } = await response.json();
    throw new Error(error || "Error al actualizar el usuario");
  }

  const result = await response.json();
  console.log("Respuesta del servidor:", result); // Verifica la respuesta

  return result.usuario;
};









// Verificar si un nombre de usuario ya existe
export const checkUsernameExists = async (username) => {
  const { data, error } = await supabase
    .from("usuarios")
    .select("username")
    .eq("username", username)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
  console.error("Supabase Error:", error.message); // Útil para depuración
  throw new Error("Error inesperado al verificar el nombre de usuario.");
}


  return !!data; // Devuelve true si el usuario existe
};

// Eliminar un usuario
export const deleteUsuario = async (id) => {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        const { error } = await response.json();
        throw new Error(error || "Error al eliminar el usuario");
    }

    return await response.json();
};
