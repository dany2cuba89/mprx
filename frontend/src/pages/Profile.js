import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabase";
import { toast } from "react-toastify";
import "../styles/Profile.css";

function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [nombre, setNombre] = useState(user?.nombre_completo || "");
  const [correo, setCorreo] = useState(user?.correo || "");
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errores, setErrores] = useState({});

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
      toast.error("Error al cargar el perfil.");
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

  // Validar nombre completo (al menos un nombre y dos apellidos)
  const validarNombreCompleto = (nombre) => {
    const partesNombre = nombre.trim().split(" ");
    return partesNombre.length >= 3;
  };

  // Validar correo electrónico
  const validarCorreo = (correo) => {
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return correoRegex.test(correo);
  };

  // Limpiar errores cuando el campo cambia
  const limpiarErrores = (campo) => {
    setErrores((prevErrores) => {
      const nuevosErrores = { ...prevErrores };
      delete nuevosErrores[campo];
      return nuevosErrores;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    const nuevosErrores = {};

    if (!validarNombreCompleto(nombre)) {
      nuevosErrores.nombre = "El nombre completo debe incluir al menos un nombre y dos apellidos.";
    }

    if (!validarCorreo(correo)) {
      nuevosErrores.correo = "El correo electrónico no es válido.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Por favor, corrige los errores antes de continuar.");
      return;
    }

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
      toast.info("No se realizaron cambios.");
      return;
    }

    setIsProcessing(true); // Bloqueo del botón

    try {
      await updateUserProfile(profileData);
      toast.success("Perfil actualizado exitosamente."); // Mostrar notificación de éxito

      // Recargar el perfil actualizado desde Supabase
      await fetchUserProfile();
    } catch (err) {
      toast.error("Error al actualizar el perfil.");
    } finally {
      setIsProcessing(false); // Desbloquea el botón
    }
  };

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

      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="nombre">Nombre Completo:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value);
              limpiarErrores("nombre"); // Limpiar error al cambiar el campo
            }}
          />
          {errores.nombre && <p className="error-text">{errores.nombre}</p>}
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
            onChange={(e) => {
              setCorreo(e.target.value);
              limpiarErrores("correo"); // Limpiar error al cambiar el campo
            }}
          />
          {errores.correo && <p className="error-text">{errores.correo}</p>}
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
