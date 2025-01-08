import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Cargar el tema inicial desde el almacenamiento local o usar "light" por defecto
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    // Guardar el tema seleccionado en el almacenamiento local
    localStorage.setItem("theme", theme);
    document.body.className = theme; // Cambiar la clase del body para aplicar estilos globales
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
