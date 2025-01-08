import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase"; 
import "../styles/Profile.css"; // Importar el CSS donde están los estilos de las notificaciones

function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre_completo || "");
  const [correo, setCorreo] = useState(user?.correo || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState(""); // Estado para la contraseña
  const [mensaje, setMensaje] = useState(null); // Estado para las notificaciones
  const [loading, setLoading] = useState(true); 
  const [isProcessing, setIsProcessing] = useState(false); 

  // Función para obtener el perfil del usuario desde Supabase
  const fetchUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("nombre_completo, correo, username")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      // Actualiza los valores de los campos con los datos actuales desde Supabase
      setNombre(data?.nombre_completo || "");
      setCorreo(data?.correo || "");
      setUsername(data?.username || "");
      setPassword(""); // Limpiamos el estado de la contraseña
    } catch (error) {
      console.error("Error al obtener el perfil:", error.message);
      setMensaje({ type: "error", text: "Error al cargar el perfil." }); // Mostrar error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const profileData = {};

    if (nombre !== user?.nombre_completo) {
      profileData.nombre_completo = nombre;
    }

    if (correo !== user?.correo) {
      profileData.correo = correo;
    }

    if (username !== user?.username) {
      profileData.username = username;
    }

    if (password && password !== "") {
      profileData.password = password;
    }

    if (Object.keys(profileData).length === 0) {
      setMensaje({ type: "info", text: "No se realizaron cambios." });
      return;
    }

    setIsProcessing(true); // Bloqueo del botón

    try {
      await updateUserProfile(profileData);
      setMensaje({ type: "success", text: "Perfil actualizado exitosamente." });

      // Limpiar campos después de la actualización
      setPassword(""); // Limpiar contraseña
      setNombre(""); // Limpiar nombre
      setCorreo(""); // Limpiar correo
      setUsername(""); // Limpiar username

      // Recargar el perfil actualizado desde Supabase
      await fetchUserProfile();

    } catch (err) {
      setMensaje({ type: "error", text: "Error al actualizar el perfil." });
    } finally {
      setIsProcessing(false); // Desbloquea el botón
    }
  };

  useEffect(() => {
    if (mensaje) {
      console.log('Mensaje de notificación:', mensaje); // Debugging
    }
  }, [mensaje]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar">
          <span>{user?.username?.charAt(0).toUpperCase()}</span>
        </div>
        <h2>Bienvenido, {user?.nombre_completo || user?.username}</h2>
      </div>

      {/* Mostrar notificación de alerta con el estilo común */}
      {
  mensaje && (
    <div
      className={`notification ${mensaje.type === "success" ? "notification-success" : "notification-error"}`}
    >
      {mensaje.text}
    </div>
  )
}



      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Usuario:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo Electrónico:</label>
          <input
            type="email"
            id="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Contraseña:</label>
          <input
            type="password"
            id="password"
            placeholder="Nueva Contraseña (Opcional)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="update-button" disabled={isProcessing}>
          {isProcessing ? "Procesando..." : "Actualizar Perfil"}
        </button>
      </form>
    </div>
  );
}

export default Profile;
