import React, { useState } from "react";
import logo from '../assets/images/logoblanco.png';
import { AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider, Avatar } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ReceiptIcon from "@mui/icons-material/Receipt";
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import PersonIcon from "@mui/icons-material/Person";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ApartmentIcon from "@mui/icons-material/Apartment";
import EditIcon from "@mui/icons-material/Edit"; 
import { Link, useNavigate } from "react-router-dom"; // Importa useNavigate
import { useAuth } from "../context/AuthContext";

function Header() {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false); // Estado para el menú de usuario
  const navigate = useNavigate(); // Inicializa useNavigate

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false); // Cierra el menú de usuario al cerrar sesión
  };

  const toggleUserMenu = () => {
    setUserMenuOpen((prev) => !prev); // Alterna el menú de usuario
  };

  const handleMenuItemClick = () => {
    setUserMenuOpen(false); // Cierra el Drawer al hacer clic en un enlace
  };

  const handleEditUser = () => {
    setUserMenuOpen(false); // Cierra el Drawer cuando se hace clic en el ícono de lápiz
    navigate("/profile"); // Redirige a la página de perfil
  };

  const menuItems = [
  { path: "/", label: "Inicio", icon: <HomeIcon /> },
  { path: "/caja", label: "Caja", icon: <AttachMoneyIcon /> },
  { path: "/inventario", label: "Inventario", icon: <InventoryIcon /> },
  { path: "/recepciones", label: "Recepciones", icon: <MoveToInboxIcon /> },
  { path: "/proveedores", label: "Proveedores", icon: <LocalShippingIcon /> },
  { path: "/solicitudesCompra", label: "Solicitudes", icon: <RequestQuoteIcon /> },
  { path: "/facturas", label: "Facturas", icon: <ReceiptIcon /> },
  { path: "/assets", label: "Activos Fijos", icon: <ApartmentIcon /> }, // Mueve Assets aquí
  { path: "/reportes", label: "Reportes", icon: <BarChartIcon /> },
  { path: "/empleados", label: "Empleados", icon: <PeopleIcon /> },
  { path: "/usuarios", label: "Usuarios", icon: <PersonIcon /> },
];


  // Mapeo de roles a los enlaces permitidos
  const rolesLinks = {
    dueño: ["/", "/caja", "/inventario", "/empleados", "/facturas", "/reportes", "/usuarios", "/profile", "/assets", "/proveedores", "/solicitudesCompra", "/recepciones"],
    administrador: ["/", "/caja", "/inventario", "/empleados", "/facturas", "/reportes", "/profile", "/assets","/proveedores", "/solicitudesCompra", "/recepciones"],
    económico: ["/", "/facturas", "/reportes", "/profile", "/assets","/proveedores", "/solicitudesCompra", "/recepciones"],
    cajero: ["/", "/caja", "/profile"],
  };

  // Filtramos los elementos del menú según el rol del usuario
  const allowedMenuItems = menuItems.filter(item => rolesLinks[user.rol]?.includes(item.path));

  return (
    <>
      {/* Header principal */}
      <AppBar position="fixed" sx={{ backgroundColor: "#4CAF50", height: "64px", zIndex: 1300 }}>
        <Toolbar>
  {/* Logo */}
  <Box
    component="img"
    src={logo}
    alt="Logo de EmpreX"
    sx={{
      height: '40px', // Altura fija
      width: 'auto', // Ancho automático
      maxWidth: '100%', // Limita el ancho máximo
      marginRight: 2, // Espacio a la derecha
    }}
  />

  {/* Título */}
  <Typography variant="h4" component={Link} to="/" sx={{ flexGrow: 1, color: "white", fontWeight: "bold", fontSize: "32px", textDecoration: 'none' }}>
    EmpreX
  </Typography>

  {/* Avatar */}
  {user && (
    <IconButton color="inherit" onClick={toggleUserMenu} sx={{ marginLeft: 2 }}>
      <Avatar sx={{ bgcolor: "#388E3C" }}>
        {user.username.charAt(0).toUpperCase()}
      </Avatar>
    </IconButton>
  )}
</Toolbar>
      </AppBar>

      {/* Drawer del menú de usuario (flotante) */}
      <Drawer
        anchor="right"
        open={userMenuOpen}
        onClose={toggleUserMenu}
        sx={{
          '& .MuiDrawer-paper': {
            width: 250, // Reducir el ancho del Drawer
            height: 'auto', // Ajusta la altura al contenido
            maxHeight: '70vh', // Ajusta la altura máxima
            top: 74, // Se agrega separación desde el header
            right: 10, // Separación de la esquina derecha de la pantalla
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Menor opacidad que antes
            color: 'white',
            borderRadius: '16px', // Redondea los bordes
            padding: '8px 16px', // Menos padding
            zIndex: 1301,
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 100%)',
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.5)', // Sombra para hacerlo flotante
          }
        }}
      >
        <Box sx={{ paddingBottom: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Correo del usuario arriba del avatar */}
          <Typography variant="body2" sx={{ fontSize: "12px", marginBottom: 1 }}>
            {user.email}
          </Typography>

          {/* Avatar de usuario en el menú de usuario */}
          <Box sx={{ position: 'relative' }}>
            <Avatar sx={{ bgcolor: "#388E3C", width: 50, height: 50, fontSize: "1.5rem" }}>
              {user.username.charAt(0).toUpperCase()}
            </Avatar>

            {/* Ícono de lápiz superpuesto en la esquina inferior derecha del Avatar */}
            <IconButton
              color="inherit"
              onClick={handleEditUser} // Redirige a /profile y cierra el Drawer
              sx={{
                position: 'absolute',
                bottom: -3, // Ajusta la distancia del ícono de lápiz desde la parte inferior
                right: -3,  // Ajusta la distancia desde la parte derecha
                backgroundColor: 'white',
                borderRadius: '50%',
                padding: '2px', // Aumenta el padding para hacerlo más pequeño
                fontSize: '12px', // Ajusta el tamaño del ícono de lápiz
                zIndex: 1,
                '&:hover': { backgroundColor: '#ccc' }
              }}
            >
              <EditIcon sx={{ color: '#388E3C', fontSize: '16px' }} /> {/* Ajusta el tamaño del ícono de lápiz */}
            </IconButton>
          </Box>

          {/* Mostrar saludo con el nombre del usuario */}
          <Typography variant="h6" sx={{ marginTop: 1 }}>
            ¡Hola, {user.username}!
          </Typography>

          {/* Línea separadora visible y de color blanco */}
          <Divider sx={{ marginTop: 1, marginBottom: 1, borderColor: 'white' }} />

          <List sx={{ padding: '0' }}>
            <ListItem button onClick={handleLogout} sx={{ fontSize: '14px', padding: '4px 0' }}>
              <ListItemText primary="Cerrar sesión" sx={{ fontSize: '14px' }} />
              <LogoutIcon sx={{ fontSize: '20px' }} />
            </ListItem>
          </List>

          {/* Línea separadora visible entre "Cerrar sesión" y los enlaces */}
          <Divider sx={{ marginBottom: 1, borderColor: 'white' }} />

          {/* Añadir los enlaces del menú hamburguesa debajo de "Cerrar sesión" con posición ajustada */}
          <List sx={{ marginTop: 0 }}>
            {allowedMenuItems.map((item) => (
              <ListItem button key={item.path} component={Link} to={item.path} onClick={handleMenuItemClick} sx={{ "&:hover": { backgroundColor: "#555" }, padding: '4px 0' }}>
                <ListItemIcon sx={{ color: "white" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} sx={{ color: 'white', fontSize: '14px' }} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Header;
