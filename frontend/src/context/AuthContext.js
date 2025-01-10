import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularProgress, Box } from "@mui/material";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error al cargar el usuario del almacenamiento local:", error);
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
  setLoading(true);

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, username, rol, nombre_completo, password, correo")
    .eq("correo", email)
    .single();

  if (error || !data) {
    setLoading(false);
    throw new Error("Credenciales incorrectas");
  }

  if (data.password !== password) {
    setLoading(false);
    throw new Error("Contraseña incorrecta");
  }

  const userData = {
    id: data.id,
    username: data.username,
    nombre_completo: data.nombre_completo,
    rol: data.rol,
    correo: data.correo,
  };

  setUser(userData);
  localStorage.setItem("user", JSON.stringify(userData));
  setLoading(false);
};

  const logout = () => {
  setLoading(true);
  localStorage.removeItem("user");
  setUser(null);
  toast.info("Sesión cerrada");
  navigate("/login");
  setLoading(false);
};

  const updateUserProfile = async (profileData) => {
    if (!user?.id) throw new Error("Usuario no autenticado");

    const { error } = await supabase
      .from("usuarios")
      .update(profileData)
      .eq("id", user.id);

    if (error) throw error;

    const updatedUser = { ...user, ...profileData };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUserProfile }}>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
