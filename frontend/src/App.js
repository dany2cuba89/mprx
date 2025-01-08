import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer"; // Asegúrate de importar el Footer
import Dashboard from "./pages/Dashboard";
import Caja from "./pages/Caja";
import Inventario from "./pages/Inventario";
import ProveedoresPage from "./pages/ProveedoresPage.js";
import SolicitudesCompra from "./pages/SolicitudesCompra.js";
import Recepciones from "./pages/Recepciones";
import Empleados from "./pages/Empleados";
import Facturas from "./pages/Facturas";
import AgregarFacturaCompra from "./pages/AgregarFacturaCompra";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Profile from "./pages/Profile"; // Importar Perfil
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Assets from "./pages/Assets"; // Importar la nueva página de Activos Fijos
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute"; // Importar ProtectedRoute
import "./styles/index.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className={`app ${user ? "logged-in" : "logged-out"}`}>
                      <ToastContainer position="top-right" autoClose={3000} />

      {user ? (
        <>
          <Header />
          <div className="main-content">
            <div className="content">
              <Routes>
                {/* Rutas protegidas para cada página */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute page="dashboard">
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/caja"
                  element={
                    <ProtectedRoute page="caja">
                      <Caja />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/proveedores"
                  element={
                    <ProtectedRoute page="proveedores">
                      <ProveedoresPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recepciones"
                  element={
                    <ProtectedRoute page="recepciones">
                      <Recepciones />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/solicitudesCompra"
                  element={
                    <ProtectedRoute page="solicitudesCompra">
                      <SolicitudesCompra />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/inventario"
                  element={
                    <ProtectedRoute page="inventario">
                      <Inventario />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/facturas"
                  element={
                    <ProtectedRoute page="facturas">
                      <Facturas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/factura-compra"
                  element={
                    <ProtectedRoute page="factura-compra">
                      <AgregarFacturaCompra />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reportes"
                  element={
                    <ProtectedRoute page="reportes">
                      <Reportes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/empleados"
                  element={
                    <ProtectedRoute page="empleados">
                      <Empleados />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/usuarios"
                  element={
                    <ProtectedRoute page="usuarios">
                      <Usuarios />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute page="profile">
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                {/* Nueva ruta para los activos fijos */}
                <Route
                  path="/assets"
                  element={
                    <ProtectedRoute page="assets">
                      <Assets />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              
              </Routes>

            </div>
          </div>
          <Footer /> {/* Asegúrate de incluir el Footer aquí */}
        </>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;
