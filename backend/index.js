process.env.TZ = "UTC"
require("dotenv").config(); // Carga las variables de entorno
const express = require("express");
const cors = require("cors");
const supabase = require("./database"); // Cliente Supabase configurado

// Middlewares y configuraciones principales
const authenticate = require("./middlewares/authenticate"); // Middleware de autenticación
const app = express();
const PORT = process.env.PORT || 5000;

// Verifica las variables de entorno requeridas
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error("Faltan variables de entorno SUPABASE_URL o SUPABASE_KEY.");
  process.exit(1);
}

// Configuración avanzada de CORS
const corsOptions = {
  origin: [
    "http://localhost:3000", // Frontend local
    "https://emprex-01.vercel.app", // Permite solicitudes desde el dominio de Vercel
    "https://emprex.onrender.com", // Permite solicitudes desde el dominio de Vercel
    "https://emprex-02.vercel.app",  
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true, // Permitir cookies y encabezados de autenticación
};
app.use(cors(corsOptions));

// Middlewares globales
app.use(express.json()); // Parsear JSON en las solicitudes

// Rutas principales (IMPORTAR ANTES DE USAR)
const authRoutes = require("./routes/auth");
const alertasRoutes = require("./routes/alertas");
const inventarioRoutes = require("./routes/inventario");
const recepcionesRoutes = require("./routes/recepciones");
const cajaRoutes = require("./routes/caja");
const facturasRoutes = require("./routes/facturas");
const productosRoutes = require("./routes/productos");
const empleadosRoutes = require("./routes/empleados");
const reportesRoutes = require("./routes/reportes");
const activosFijosRoutes = require("./routes/assets"); // Nueva ruta de activos fijos

// Prueba de conexión con Supabase
supabase
  .from("productos")
  .select("id")
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error("Error al conectar con Supabase:", error.message);
      process.exit(1);
    }
    console.log("Conexión con Supabase exitosa.");
  });

// Rutas registradas con prefijo de API
app.use("/auth", authRoutes);
app.use("/alertas", alertasRoutes);
app.use("/inventario", inventarioRoutes);
app.use("/recepciones", recepcionesRoutes);
app.use("/caja", cajaRoutes);
app.use("/facturas", facturasRoutes);
app.use("/productos", productosRoutes);
app.use("/empleados", empleadosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/assets", activosFijosRoutes); // Registrar las rutas de activos fijos

// Ruta base para probar conexión
app.get("/", (req, res) => {
  res.send("Servidor EmpreX en funcionamiento 🚀");
});

// Middleware de manejo de errores globales
app.use((err, req, res, next) => {
  console.error("Error global:", err.message);
  res.status(err.status || 500).json({
    error: "Error interno del servidor",
    message: err.message,
  });
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

module.exports = app;
