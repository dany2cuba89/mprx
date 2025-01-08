import React from "react";
import { Navigate, BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Caja from "./pages/Caja";
import ProveedoresPage from "./pages/ProveedoresPage.js";
import Inventario from "./pages/Inventario";
import Empleados from "./pages/Empleados";
import Facturas from "./pages/Facturas";
import SolicitudesCompra from "./pages/SolicitudesCompra.js";
import Recepciones from "./pages/Recepciones.js";
import Reportes from "./pages/Reportes";
import Usuarios from "./pages/Usuarios";
import Profile from "./pages/Profile"; // Importar Perfil
import AgregarFacturaCompra from "./pages/AgregarFacturaCompra";
import NotFound from "./pages/NotFound"; // Página para rutas no definidas
import Assets from "./pages/Assets"; // Importar la nueva página de Activos Fijos
import ProtectedRoute from "./components/ProtectedRoute"; // Importamos el ProtectedRoute

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute page="dashboard">
              <Dashboard title="EmpreX-Dashboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute page="profile">
              <Profile title="EmpreX-Profile" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/caja"
          element={
            <ProtectedRoute page="caja">
              <Caja title="EmpreX-Caja" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/solicitudesCompra"
          element={
            <ProtectedRoute page="solicitudesCompra">
              <SolicitudesCompra title="EmpreX-Solicitudes de Compra" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recepciones"
          element={
            <ProtectedRoute page="recepciones">
              <Recepciones title="EmpreX-Recepciones" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/proveedores"
          element={
            <ProtectedRoute page="proveedores">
              <ProveedoresPage title="EmpreX-Proveedores" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventario"
          element={
            <ProtectedRoute page="inventario">
              <Inventario title="EmpreX-Inventario" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/empleados"
          element={
            <ProtectedRoute page="empleados">
              <Empleados title="EmpreX-Empleados" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/facturas"
          element={
            <ProtectedRoute page="facturas">
              <Facturas title="EmpreX-Facturas" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reportes"
          element={
            <ProtectedRoute page="reportes">
              <Reportes title="EmpreX-Reportes" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute page="usuarios">
              <Usuarios title="EmpreX-Usuarios" />
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
        {/* Ruta para los activos fijos */}
        <Route
          path="/assets"
          element={
            <ProtectedRoute page="assets">
              <Assets title="EmpreX-Activos Fijos" />
            </ProtectedRoute>
          }
        />
        {/* Ruta para manejar páginas no encontradas */}
        <Route path="/notfound" element={<NotFound />} />
        {/* Cualquier otra ruta redirige a notfound */}
        <Route path="*" element={<Navigate to="/notfound" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
