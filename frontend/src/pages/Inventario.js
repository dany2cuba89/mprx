import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useAuth } from "../context/AuthContext"; // Importar el contexto de autenticación
import {
  getProductos,
  addProducto,
  updateProducto,
  deleteProducto,
  exportarInventario,
} from "../api/inventario";
import Table from "../components/Table";
import Modal from "../components/Modal";
import "../styles/Inventario.css";

function Inventario() {
  const { user } = useAuth(); // Obtener el usuario desde el contexto
  const [productos, setProductos] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(5);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [productoActual, setProductoActual] = useState({
    nombre: "",
    precio_compra: "",
    precio_venta: "",
    stock: "",
    nivel_minimo: "",
    unidad_medida: "",
    categoria: "",
    metodo_pago: "efectivo", // Nuevo campo
    proveedor: "",          // Nuevo campo
  });

  const [filtroNombre, setFiltroNombre] = useState("");
  const [notificacion, setNotificacion] = useState(null);

  useEffect(() => {
    cargarProductos();
  }, [paginaActual, filtroNombre]);

  const cargarProductos = async () => {
    try {
      const { data, total } = await getProductos({
        nombre: filtroNombre,
        page: paginaActual,
        pageSize: productosPorPagina,
      });
      setProductos(data);
      setTotalPaginas(Math.ceil(total / productosPorPagina));
    } catch (err) {
      mostrarNotificacion("error", "Error al cargar productos.");
    }
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const manejarCambioProducto = (e) => {
    const { name, value } = e.target;
    setProductoActual((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const agregarProducto = () => {
    setProductoSeleccionado(null);
    setProductoActual({
      nombre: "",
      precio_compra: "",
      precio_venta: "",
      stock: "",
      nivel_minimo: "",
      unidad_medida: "",
      categoria: "",
      metodo_pago: "efectivo", // Por defecto
      proveedor: "",          // Por defecto
    });
    setModalAbierto(true);
  };

  const editarProducto = () => {
    if (!productoSeleccionado) {
      mostrarNotificacion("error", "Por favor, seleccione un producto para editar.");
      return;
    }
    setProductoActual(productoSeleccionado);
    setModalAbierto(true);
  };

  const eliminarProducto = async () => {
    if (!productoSeleccionado) {
      mostrarNotificacion("error", "Por favor, seleccione un producto para eliminar.");
      return;
    }

    try {
      await deleteProducto(productoSeleccionado.id);
      mostrarNotificacion("success", "Producto eliminado exitosamente.");
      setProductoSeleccionado(null);
      cargarProductos();
    } catch (err) {
      mostrarNotificacion("error", err.message || "Error al eliminar el producto.");
    }
  };

  const exportarExcel = async () => {
    try {
      await exportarInventario({ nombre: filtroNombre });
      mostrarNotificacion("success", "Inventario exportado correctamente.");
    } catch (err) {
      console.error("Error al exportar el inventario:", err.message);
      mostrarNotificacion("error", "Error al exportar el inventario.");
    }
  };
  
  // Importa la librería QRCode si no lo has hecho
// import QRCode from "qrcode";

const descargarCodigoQR = async () => {
  if (!productoSeleccionado) {
    mostrarNotificacion("error", "Seleccione un producto para generar su código QR.");
    return;
  }

  try {
    // Usar el ID como dato para el QR
    const qrData = productoSeleccionado.id?.toString(); 
    if (!qrData) {
      mostrarNotificacion("error", "El producto seleccionado no tiene un ID válido.");
      return;
    }

    // Generar QR dinámico con el ID
    const qrUrl = await QRCode.toDataURL(qrData, { 
      errorCorrectionLevel: "H", // Nivel alto de corrección para mejor calidad
      type: "image/png", // Asegurar que sea PNG
    });

    // Crear el enlace de descarga
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `QR_${productoSeleccionado.nombre || "producto"}.png`; // Nombre del archivo
    document.body.appendChild(link); // Agregar al DOM temporalmente
    link.click();
    document.body.removeChild(link); // Remover después del clic

    mostrarNotificacion("success", "Código QR descargado exitosamente.");
  } catch (err) {
    console.error("Error al generar el código QR:", err);
    mostrarNotificacion("error", "Error al generar el código QR. Revise la consola para más detalles.");
  }
};


  

  const guardarProducto = async () => {
    try {
      if (!productoActual.proveedor || !productoActual.metodo_pago) {
        mostrarNotificacion("error", "Debe ingresar el proveedor y el método de pago.");
        return;
      }

      const productoConCajera = { ...productoActual, cajera: user?.id }; // Agregar el ID del usuario actual

      if (productoSeleccionado) {
        await updateProducto(productoSeleccionado.id, productoConCajera);
        mostrarNotificacion("success", "Producto actualizado exitosamente.");
      } else {
        await addProducto(productoConCajera); // Pasar producto con cajera al backend
        mostrarNotificacion("success", "Producto agregado exitosamente.");
      }

      cerrarModal();
      cargarProductos();
    } catch (err) {
      mostrarNotificacion("error", err.message || "Error al guardar el producto.");
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoActual({
      nombre: "",
      precio_compra: "",
      precio_venta: "",
      stock: "",
      nivel_minimo: "",
      unidad_medida: "",
      categoria: "",
      metodo_pago: "efectivo",
      proveedor: "",
    });
  };

  const mostrarNotificacion = (tipo, mensaje) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => setNotificacion(null), 3000);
  };

  return (
    <div className="empleados-container">
      <h2>Gestión de Inventario</h2>

      {notificacion && (
        <div className={`notificacion ${notificacion.tipo}`}>
          {notificacion.mensaje}
        </div>
      )}

      <div className="filtro-container">
  <input
    type="text"
    placeholder="Buscar por nombre"
    value={filtroNombre}
    onChange={(e) => setFiltroNombre(e.target.value)}
    className="filtro-input"
  />
  <button onClick={() => setPaginaActual(1)} className="buscar-button">
    Buscar
  </button>
</div>


      <div className="tabla-container">
        <Table
  headers={[
    "Nombre",
    "U/M",
    "Precio Compra",
    "Precio Venta",
    "Stock",
    "Nivel Mínimo",
    "Categoría",
  ]}
  data={productos.map((producto) => {
    console.log("Producto procesado para la tabla:", producto); // Log para inspeccionar cada producto

    return {
      nombre: producto.nombre || "N/A",
      "u/m": producto.unidad_medida || "N/A",
      "precio compra": producto.precio_compra != null ? `$${parseFloat(producto.precio_compra).toFixed(2)}` : "N/A",
      "precio venta": producto.precio_venta != null ? `$${parseFloat(producto.precio_venta).toFixed(2)}` : "N/A",
      stock: producto.stock === 0 ? 0 : producto.stock || "N/A", // Log detallado para stock
      "nivel mínimo": producto.nivel_minimo != null ? producto.nivel_minimo : "N/A",
      categoría: producto.categoria || "N/A",
      onClick: () => setProductoSeleccionado(producto), // Selección de fila
      seleccionado: productoSeleccionado?.id === producto.id, // Estilo visual de fila seleccionada
    };
  })}
/>

      </div>

      <div className="pagination">
  <button
    disabled={paginaActual === 1}
    onClick={() => cambiarPagina(paginaActual - 1)}
  >
    Anterior
  </button>
  {Array.from(
    { length: Math.min(3, totalPaginas) },
    (_, i) => {
      const paginaInicio = Math.max(1, paginaActual - 1);
      const numeroPagina = paginaInicio + i;

      if (numeroPagina > totalPaginas) return null;

      return (
        <button
          key={numeroPagina}
          className={paginaActual === numeroPagina ? "active-page" : ""}
          onClick={() => cambiarPagina(numeroPagina)}
        >
          {numeroPagina}
        </button>
      );
    }
  )}
  <button
    disabled={paginaActual === totalPaginas}
    onClick={() => cambiarPagina(paginaActual + 1)}
  >
    Siguiente
  </button>
</div>
      <div className="botones-acciones">
        {/*<button className="add-button" onClick={agregarProducto}>
          //*Agregar Producto*
        </button>  */}      
        
        {/*<button
          className="delete-button"
          onClick={eliminarProducto}
          disabled={!productoSeleccionado}
        >
          Eliminar Producto
        </button>*/}
        <button className="add-button" onClick={exportarExcel}>
          Exportar a Excel
        </button>
        <button
          className="add-button"
          onClick={descargarCodigoQR}
          disabled={!productoSeleccionado}
        >
          Descargar Código QR
        </button>
      </div>

      <Modal abierto={modalAbierto} cerrarModal={cerrarModal}>
        <h3>{productoSeleccionado ? "Editar Producto" : "Agregar Producto"}</h3>
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={productoActual.nombre}
          onChange={manejarCambioProducto}
        />
        <input
          type="number"
          name="precio_compra"
          placeholder="Precio Compra"
          value={productoActual.precio_compra}
          onChange={manejarCambioProducto}
        />
        <input
          type="number"
          name="precio_venta"
          placeholder="Precio Venta"
          value={productoActual.precio_venta}
          onChange={manejarCambioProducto}
        />
        <input
          type="number"
          name="stock"
          placeholder="Stock"
          value={productoActual.stock}
          onChange={manejarCambioProducto}
        />
        <input
          type="number"
          name="nivel_minimo"
          placeholder="Nivel Mínimo"
          value={productoActual.nivel_minimo}
          onChange={manejarCambioProducto}
        />
        <input
          type="text"
          name="unidad_medida"
          placeholder="Unidad de Medida"
          value={productoActual.unidad_medida}
          onChange={manejarCambioProducto}
        />
        <input
          type="text"
          name="categoria"
          placeholder="Categoría"
          value={productoActual.categoria}
          onChange={manejarCambioProducto}
        />
        <input
          type="text"
          name="proveedor"
          placeholder="Proveedor"
          value={productoActual.proveedor}
          onChange={manejarCambioProducto}
        />
        <select
          name="metodo_pago"
          value={productoActual.metodo_pago}
          onChange={manejarCambioProducto}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        <div className="modal-buttons">
          <button onClick={guardarProducto} className="add-button">
            {productoSeleccionado ? "Guardar Cambios" : "Agregar Producto"}
          </button>
          <button onClick={cerrarModal} className="cancel-button">
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Inventario;
