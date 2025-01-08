// Definición de roles y permisos
const permissions = {
  dueño: ["dashboard", "caja", "inventario", "empleados", "facturas", "reportes", "usuarios","profile","assets","proveedores","solicitudesCompra","recepciones"],
  administrador: ["dashboard", "caja", "inventario", "empleados", "facturas", "reportes","profile","assets","proveedores","solicitudesCompra","recepciones"],
  económico: ["dashboard", "facturas", "reportes","profile","assets","proveedores","solicitudesCompra","recepciones"],
  cajero: ["dashboard", "caja","profile"],
};

// Verificar si un rol tiene acceso a una página
export const canAccessPage = (role, page) => {
  if (!permissions[role]) {
    console.warn(`El rol "${role}" no está definido en los permisos.`);
    return false;
  }
  return permissions[role].includes(page);
};
