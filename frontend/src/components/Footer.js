import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { FaFileAlt, FaHeadset } from "react-icons/fa"; // Íconos para Documentación y Soporte

function Footer() {
  return (
    <Box id="footer" sx={{ backgroundColor: "#1a1a1a", color: "white", py: 2 }}>
      <Box sx={{ maxWidth: "1200px", margin: "0 auto", px: 4, textAlign: "center" }}>
        {/* Enlaces con íconos */}
        <Box sx={{ display: "flex", justifyContent: "center", gap: 4, mb: 2, flexWrap: 'wrap' }}>
          {/* Enlace a Documentación */}
          <Link
            href="https://emprex.vercel.app/documentacion.html"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#9ca3af",
              "&:hover": { color: "white" },
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1, // Espacio entre el ícono y el texto
            }}
          >
            <FaFileAlt size={18} /> {/* Ícono de Documentación */}
            Documentación
          </Link>

          {/* Enlace a Soporte */}
          <Link
            href="https://emprex.vercel.app/soporte.html"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              color: "#9ca3af",
              "&:hover": { color: "white" },
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 1, // Espacio entre el ícono y el texto
            }}
          >
            <FaHeadset size={18} /> {/* Ícono de Soporte */}
            Soporte
          </Link>
        </Box>

        {/* Derechos reservados */}
        <Typography variant="body2" sx={{ color: "#9ca3af" }}>
          © 2024 EmpreX. Todos los derechos reservados.
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
