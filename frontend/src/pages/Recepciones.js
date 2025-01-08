import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext"; // Importar el contexto de autenticación
import Table from "../components/Table";
import Modal from "../components/Modal";
import { getRecepciones, createRecepcion } from "../api/recepciones";
import { addProducto } from "../api/inventario"; // Importamos addProducto desde inventario
import {
  getProductosSolicitados,
  getSolicitudesComprarecep,
  updateProductoSolicitado,
} from "../api/solicitudesCompra";
import { getFichaDeCosto } from "../api/fichaDeCosto";
import { getEmpleados } from "../api/empleados";
import "../styles/Reportes.css";
function Recepciones() {
  const { user } = useAuth(); // Obtener el usuario autenticado
  const [productosConfirmados, setProductosConfirmados] = useState(false); // Estado para validar productos
  const [recepciones, setRecepciones] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [recepcionesPaginadas, setRecepcionesPaginadas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const recepcionesPorPagina = 5;
  const [recepcionSeleccionada, setRecepcionSeleccionada] = useState(null);
  const [productosRecepcion, setProductosRecepcion] = useState([]); // Estado añadido
  const [productoActualIndex, setProductoActualIndex] = useState(0);
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [nivelMinimo, setNivelMinimo] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalAgregarAbierto, setModalAgregarAbierto] = useState(false);
  const [modalDetallesAbierto, setModalDetallesAbierto] = useState(false);
  const [modalEditarProductoAbierto, setModalEditarProductoAbierto] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [productosSolicitados, setProductosSolicitados] = useState([]);
  const [productoEditable, setProductoEditable] = useState(null);
  const [nuevaRecepcion, setNuevaRecepcion] = useState({
    id_proveedor: "",
    id_empleado: "",
    id_solicitud_compra: "",
    fecha_recepcion: "",
    productos: [],
    observaciones: "",
  });
  useEffect(() => {
    cargarRecepciones();
    cargarSolicitudes();
    cargarEmpleados();
  }, []);
  useEffect(() => {
    paginarRecepciones();
  }, [recepciones, paginaActual]);
  const [inputSolicitud, setInputSolicitud] = useState("");
const manejarCambioSolicitud = (valor) => {
  setInputSolicitud(valor); // Solo actualiza el valor del input
};
const confirmarSolicitud = () => {
  const idSolicitud = parseInt(inputSolicitud, 10);
  if (!isNaN(idSolicitud)) {
    seleccionarSolicitud(idSolicitud);
  } else {
    alert("Por favor ingresa un número de solicitud válido.");
  }
};
const manejarKeyDown = (e) => {
  if (e.key === "Enter") {
    confirmarSolicitud();
  }
};
  const cargarRecepciones = async () => {
    try {
      const data = await getRecepciones();
      setRecepciones(data);
      setTotalPaginas(Math.ceil(data.length / recepcionesPorPagina));
    } catch (error) {
      console.error("Error al cargar recepciones:", error);
    }
  };
  const paginarRecepciones = () => {
    const inicio = (paginaActual - 1) * recepcionesPorPagina;
    const fin = inicio + recepcionesPorPagina;
    setRecepcionesPaginadas(recepciones.slice(inicio, fin));
  };
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };
  const mostrarPaginas = () => {
    const paginasAdyacentes = 1;
    const inicio = Math.max(1, paginaActual - paginasAdyacentes);
    const fin = Math.min(totalPaginas, paginaActual + paginasAdyacentes);
    const paginas = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  };
  const abrirModalDetalles = async () => {
    if (!recepcionSeleccionada) {
      console.error("No hay una recepción seleccionada.");
      alert("Por favor selecciona una recepción válida.");
      return;
    }
    const idSolicitud = recepcionSeleccionada.id_solicitud_compra;
    if (!idSolicitud) {
      console.error("La recepción seleccionada no tiene un id_solicitud_compra válido.");
      alert("Esta recepción no tiene una solicitud de compra asociada.");
      return;
    }
    try {
      const productos = await getProductosSolicitados(idSolicitud);
      setProductosRecepcion(productos); // Actualiza el estado con los productos
      setModalDetallesAbierto(true); // Abre el modal
    } catch (error) {
      console.error("Error al cargar los detalles de la recepción:", error);
      alert("Hubo un problema al cargar los detalles de la recepción.");
    }
  };
  const cerrarModalDetalles = () => {
    setModalDetallesAbierto(false);
    setRecepcionSeleccionada(null);
    setProductosRecepcion([]);
  };
const abrirModalConfirmacion = () => {
  if (!nuevaRecepcion.productos || nuevaRecepcion.productos.length === 0) {
    alert("No hay productos en la recepción para confirmar.");
    return;
  }
  console.log("Abriendo modal de confirmación...");
  console.log("Productos seleccionados para confirmar:", nuevaRecepcion.productos);
  setProductosRecepcion([...nuevaRecepcion.productos]);
  setProductoActualIndex(0);
  setProductoActual(nuevaRecepcion.productos[0]);
  setCategoria(""); // Reiniciar categoría
  setNivelMinimo(""); // Reiniciar nivel mínimo
  setModalConfirmacionAbierto(true);
  setProductosConfirmados(false); // Reinicia el estado de confirmación
};
  const manejarConfirmacion = async () => {
    const producto = productoActual;
    try {
      const fichaDeCosto = await getFichaDeCosto(producto.id_producto);
      if (!fichaDeCosto) {
        console.warn(`No se encontró ficha de costo para el producto: ${producto.id_producto}`);
        alert(`No se pudo obtener la ficha de costo para el producto ${producto.nombre_producto}.`);
        return;
      }
      const nuevoProducto = {
        id_producto: producto.id_producto,
        nombre: producto.nombre_producto,
        precio_compra: producto.precio_unitario,
        precio_venta: fichaDeCosto.precio_venta_propuesto || 0,
        stock: producto.cantidad_recibida || 0,
        nivel_minimo: nivelMinimo || 0,
        unidad_medida: producto.unidad_medida,
        categoria: categoria || "Sin Categoría",
        metodo_pago: "efectivo",
        proveedor: nuevaRecepcion.id_proveedor,
        cajera: user.id, // Usar el ID del usuario autenticado
      };
      console.log("Payload enviado a addProducto:", nuevoProducto);
      await addProducto(nuevoProducto); // Llamada a la función de inventario
      if (productoActualIndex < productosRecepcion.length - 1) {
        const nuevoIndex = productoActualIndex + 1;
        setProductoActualIndex(nuevoIndex);
        setProductoActual(productosRecepcion[nuevoIndex]);
        setCategoria(""); // Reiniciar categoría
        setNivelMinimo(""); // Reiniciar nivel mínimo
      } else {
        setProductosConfirmados(true);
        setModalConfirmacionAbierto(false);
        await crearRecepcionFinal();
      }
    } catch (error) {
      console.error("Error al confirmar producto:", error);
      alert("Ocurrió un error al guardar el producto. Por favor, inténtalo de nuevo.");
    }
  };
const crearRecepcionFinal = async () => {
  try {
    const recepcionExistente = recepciones.find(
      (recepcion) =>
        recepcion.id_solicitud_compra === nuevaRecepcion.id_solicitud_compra
    );
    if (recepcionExistente) {
      alert(
        `Ya existe una recepción para la solicitud de compra #${nuevaRecepcion.id_solicitud_compra}.`
      );
      return;
    }
    const response = await createRecepcion(nuevaRecepcion);
    console.log("Recepción creada:", response.message);

    // Recargar recepciones y cerrar modales
    cargarRecepciones();
    cerrarModalAgregar();
  } catch (error) {
    console.error("Error al guardar la recepción:", error);
    alert("Hubo un error al guardar la recepción. Intenta nuevamente.");
  }
};
const seleccionarRecepcion = (recepcion) => {
    setRecepcionSeleccionada((prev) =>
      prev?.id === recepcion.id ? null : recepcion
    );
  };
  const cargarSolicitudes = async () => {
  try {
    const data = await getSolicitudesComprarecep();
    // Filtra solicitudes con estado "Aprobada"
    const solicitudesAprobadas = data.filter((solicitud) => solicitud.estado_solicitud === "Aprobada");
    setSolicitudes(solicitudesAprobadas);
  } catch (error) {
    console.error("Error al cargar solicitudes:", error);
  }
};
  const cargarEmpleados = async () => {
    try {
      const data = await getEmpleados();
      setEmpleados(data);
    } catch (error) {
      console.error("Error al cargar empleados:", error);
    }
  };
 const seleccionarSolicitud = async (idSolicitud) => {
  const solicitud = solicitudes.find((s) => s.id === idSolicitud);
  if (!solicitud) {
    console.error(`La solicitud con ID ${idSolicitud} no fue encontrada.`);
    alert("Por favor selecciona una solicitud válida.");
    return;
  }
  if (!solicitud.id_proveedor) {
    console.error("La solicitud seleccionada no tiene un proveedor válido.");
    alert("La solicitud seleccionada no tiene un proveedor válido.");
    return;
  }
  setNuevaRecepcion((prevState) => ({
    ...prevState,
    id_solicitud_compra: idSolicitud,
    id_proveedor: solicitud.id_proveedor,
  }));
  try {
    const productos = await getProductosSolicitados(idSolicitud);
    const productosTransformados = productos.map((producto) => ({
      id_producto: producto.id || "N/A", // Asegura un ID válido
      nombre_producto: producto.nombre_producto || "N/A", // Asegura un nombre
      cantidad_recibida: producto.cantidad || 0, // Asegura cantidad válida
      unidad_medida: producto.unidad_medida || "N/A", // Asegura unidad
      precio_unitario: producto.precio_unitario || 0, // Asegura precio
      estado_producto: producto.estado_producto || "Bueno",
      observaciones: producto.observaciones || "",
    }));
    if (!productosTransformados.length) {
      alert("La solicitud no tiene productos válidos asociados.");
      return;
    }
    setProductosSolicitados(productosTransformados);
    setNuevaRecepcion((prevState) => ({
      ...prevState,
      productos: productosTransformados,
    }));
  } catch (error) {
    console.error("Error al cargar productos solicitados:", error);
    alert("Hubo un problema al cargar los productos asociados a la solicitud.");
  }
};
const abrirModalAgregar = () => {
  setNuevaRecepcion({
    id_proveedor: "",
    id_empleado: "",
    id_solicitud_compra: "",
    fecha_recepcion: "",
    productos: [],
    observaciones: "",
  });
  setInputSolicitud(""); // Reinicia el input de solicitud
  setProductosSolicitados([]); // Limpia los productos previos
  setModalAgregarAbierto(true); // Abre el modal
};
 const abrirModalEditarProducto = (producto) => {
  setProductoEditable({
	  id: producto.id_producto,
    nombre_producto: producto.nombre_producto || "N/A", // Usar el nombre correcto
    cantidad: producto.cantidad_recibida || 0,
    unidad_medida: producto.unidad_medida || "",
    precio_unitario: producto.precio_unitario || 0,
  });
  setModalEditarProductoAbierto(true);
};
  const cerrarModalEditarProducto = () => {
    setModalEditarProductoAbierto(false);
    setProductoEditable(null);
  };
  const cerrarModalAgregar = () => {
    setModalAgregarAbierto(false);
    setNuevaRecepcion({
      id_proveedor: "",
      id_empleado: "",
      id_solicitud_compra: "",
      fecha_recepcion: "",
      productos: [],
      observaciones: "",
    });
  };
  const manejarCambio = (campo, valor) => {
    setNuevaRecepcion((prevState) => ({
      ...prevState,
      [campo]: valor,
    }));
  };
  const guardarProductoEditado = async () => {
  try {
    // Actualización en la base de datos (si es necesario)
    await updateProductoSolicitado(productoEditable.id, productoEditable);
    // Actualizar el estado local
    const productosActualizados = productosSolicitados.map((producto) =>
      producto.id_producto === productoEditable.id // Asegura que los IDs coincidan
        ? {
            ...producto,
            cantidad_recibida: productoEditable.cantidad,
            precio_unitario: productoEditable.precio_unitario,
          }
        : producto
    );
    setProductosSolicitados(productosActualizados);
    setNuevaRecepcion((prevState) => ({
      ...prevState,
      productos: productosActualizados,
    }));
    cerrarModalEditarProducto();
  } catch (error) {
    console.error("Error al actualizar producto solicitado:", error);
    alert("Hubo un error al actualizar el producto. Por favor, inténtalo nuevamente.");
  }
};
  const manejarCambioProductoEditable = (campo, valor) => {
    setProductoEditable((prev) => ({ ...prev, [campo]: valor }));
  };
  const guardarRecepcion = async () => {
  if (!nuevaRecepcion.productos || nuevaRecepcion.productos.length === 0) {
    alert("No hay productos en la recepción para confirmar.");
    return;
  }
  if (!nuevaRecepcion.id_proveedor) {
    alert("Selecciona un proveedor válido.");
    return;
  }
  if (!nuevaRecepcion.id_empleado) {
    alert("Selecciona un empleado.");
    return;
  }
  if (!nuevaRecepcion.fecha_recepcion) {
    alert("Selecciona una fecha de recepción.");
    return;
  }
  if (!nuevaRecepcion.id_solicitud_compra) {
    alert("Selecciona una solicitud de compra.");
    return;
  }
  try {
    // Verificar si ya existe una recepción para la solicitud
    const recepcionExistente = recepciones.find(
      (recepcion) => recepcion.id_solicitud_compra === nuevaRecepcion.id_solicitud_compra
    );
    if (recepcionExistente) {
      alert(`Ya existe una recepción para la solicitud de compra #${nuevaRecepcion.id_solicitud_compra}.`);
      return;
    }
    // Si no existe una recepción para la solicitud, continuar al modal de confirmación
    abrirModalConfirmacion();
  } catch (error) {
    console.error("Error al comprobar existencia de la recepción:", error);
    alert("Ocurrió un error al comprobar la recepción. Intenta nuevamente.");
  }
};
  return (
    <div className="empleados-container">
      <h2>Gestión de Recepciones</h2>
      <div className="tabla-container">
      <Table
        headers={["ID", "Proveedor", "Empleado", "Fecha"]}
        data={recepcionesPaginadas.map((recepcion) => ({
          id: recepcion.id,
          proveedor: recepcion.proveedores?.nombre_o_razon_social || "N/A",
          empleado: recepcion.empleados?.nombre_completo || "N/A",
          fecha: recepcion.fecha_recepcion,
          seleccionado: recepcionSeleccionada?.id === recepcion.id,
          onClick: () => seleccionarRecepcion(recepcion),
        }))}
        rowClassName={(recepcion) =>
          recepcionSeleccionada?.id === recepcion.id ? "selected-row" : ""
        }
      />
      </div>
      <div className="pagination">
        <button
          disabled={paginaActual === 1}
          onClick={() => cambiarPagina(paginaActual - 1)}
        >
          Anterior
        </button>
        {mostrarPaginas().map((pagina) => (
          <button
            key={pagina}
            className={paginaActual === pagina ? "active-page" : ""}
            onClick={() => cambiarPagina(pagina)}
          >
            {pagina}
          </button>
        ))}
        <button
          disabled={paginaActual === totalPaginas}
          onClick={() => cambiarPagina(paginaActual + 1)}
        >
          Siguiente
        </button>
      </div>
      <div className="botones-acciones">
        <button className="add-button" onClick={abrirModalAgregar}>
          Agregar
        </button>
        <button
          className="add-button"
          disabled={!recepcionSeleccionada}
          onClick={abrirModalDetalles}
        >
          Detalles
        </button>
      </div>
	   {modalDetallesAbierto && (
        <Modal abierto={modalDetallesAbierto} cerrarModal={cerrarModalDetalles}>
          <h3>Detalles de la Recepción #{recepcionSeleccionada.id}</h3>
          <div>
            <p><strong>Proveedor:</strong> {recepcionSeleccionada.proveedores?.nombre_o_razon_social || "N/A"}</p>
            <p><strong>Empleado:</strong> {recepcionSeleccionada.empleados?.nombre_completo || "N/A"}</p>
            <p><strong>Fecha:</strong> {recepcionSeleccionada.fecha_recepcion}</p>
            <p><strong>Observaciones:</strong> {recepcionSeleccionada.observaciones || "Ninguna"}</p>
          </div>
          <div className="tabla-container">
  {console.log("Productos Recepción detallados:", JSON.stringify(productosRecepcion, null, 2))}
  <Table
    headers={["Producto", "Cantidad", "Unidad", "Precio"]}
    data={productosRecepcion.map((producto) => ({
      Producto: producto.nombre_producto || "Producto desconocido",
      Cantidad: producto.cantidad !== undefined ? producto.cantidad : "N/A", // Cambiado a producto.cantidad
      Unidad: producto.unidad_medida || "N/A",
      Precio: producto.precio_unitario !== undefined ? `$${producto.precio_unitario.toFixed(2)}` : "N/A",
    }))}
    exactKeys={true} // Habilita el modo exacto de claves
  />
</div>
        </Modal>
      )}
      {modalAgregarAbierto && (
        <Modal abierto={modalAgregarAbierto} cerrarModal={cerrarModalAgregar}>
          
          <h2>Agregar Recepción</h2>
          <div className="form-group">
          <label>Seleccionar Solicitud de Compra</label>
  <input
    type="text"
    placeholder="Buscar solicitud"
    list="solicitudes"
    value={inputSolicitud}
    onChange={(e) => manejarCambioSolicitud(e.target.value)} // Actualizar el estado
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        e.preventDefault(); // Evitar comportamiento predeterminado
        confirmarSolicitud(); // Llamar a la función de confirmación
      }
    }}
    onBlur={() => {
      if (inputSolicitud) {
        confirmarSolicitud(); // Confirmar al perder el foco si hay valor
      }
    }}
  />
  <datalist id="solicitudes">
    {solicitudes.map((solicitud) => (
      <option key={solicitud.id} value={solicitud.id}>
        {`Solicitud #${solicitud.id}`}
      </option>
    ))}
  </datalist>


  <label>Proveedor</label>
  <input
    type="text"
    value={
      solicitudes.find((s) => s.id === nuevaRecepcion.id_solicitud_compra)?.proveedores?.nombre_o_razon_social || ""
    }
    disabled
  />
            <label>Empleado</label>
            <select
              value={nuevaRecepcion.id_empleado}
              onChange={(e) => manejarCambio("id_empleado", e.target.value)}
            >
              <option value="">Seleccionar empleado</option>
              {empleados.map((empleado) => (
                <option key={empleado.id} value={empleado.id}>
                  {empleado.nombre_completo}
                </option>
              ))}
            </select>

            <label>Fecha de Recepción</label>
            <input
              type="date"
              value={nuevaRecepcion.fecha_recepcion}
              onChange={(e) => manejarCambio("fecha_recepcion", e.target.value)}
            />
  <label>Observaciones</label>
  <textarea
    className="textarea-observaciones"
    value={nuevaRecepcion.observaciones}
    onChange={(e) => manejarCambio("observaciones", e.target.value)}
    placeholder="Ingrese observaciones adicionales"
  ></textarea>
</div>
          <div className="tabla-container">
            <label>Productos</label>
            
            <Table
  headers={["Producto", "Cantidad", "Unidad", "Precio"]}
  data={productosSolicitados.map((producto) => ({
    producto: producto.nombre_producto, // Mostrar el nombre del producto
    cantidad: producto.cantidad_recibida || "N/A", // Mostrar cantidad recibida
    unidad: producto.unidad_medida || "N/A", // Mostrar unidad de medida
    precio: producto.precio_unitario || "N/A", // Mostrar precio unitario
    acciones: (
      <button className="add-button" onClick={() => abrirModalEditarProducto(producto)}>
        Editar
      </button>
    ),
  }))}
/>
          </div>


                <button className="add-button" onClick={guardarRecepcion}>Guardar Recepción</button>
        </Modal>
        )} 
    {modalConfirmacionAbierto && (
  <Modal
    abierto={modalConfirmacionAbierto}
    cerrarModal={() => setModalConfirmacionAbierto(false)}
  >
    <h3>Confirmar Producto</h3>
    <div>
      <p><strong>Producto:</strong> {productoActual?.nombre_producto}</p>
      <p><strong>Cantidad:</strong> {productoActual?.cantidad_recibida}</p>
      <p><strong>Unidad:</strong> {productoActual?.unidad_medida}</p>
      <div>
        <label>Categoría:</label>
        <input
          type="text"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />
      </div>
      <div>
        <label>Nivel Mínimo:</label>
        <input
          type="number"
          value={nivelMinimo}
          onChange={(e) => setNivelMinimo(Number(e.target.value))}
        />
      </div>
    </div>
    <button className="add-button" onClick={manejarConfirmacion}>
      {productoActualIndex < productosRecepcion.length - 1
        ? "Siguiente"
        : "Finalizar"}
    </button>
  </Modal>
)}
 {/* Cierre del bloque condicional */}
      {modalEditarProductoAbierto && (
  <Modal abierto={modalEditarProductoAbierto} cerrarModal={cerrarModalEditarProducto}>
    <h2>Editar Producto</h2>
    <div className="form-group">
      <label>Producto</label>
      <input type="text" value={productoEditable?.nombre_producto} disabled />
      <label>Cantidad</label>
      <input
        type="number"
        value={productoEditable?.cantidad}
        onChange={(e) => manejarCambioProductoEditable("cantidad", Number(e.target.value))}
      />
      <label>Unidad</label>
      <input type="text" value={productoEditable?.unidad_medida} disabled />
      <label>Precio</label>
      <input
        type="number"
        value={productoEditable?.precio_unitario}
        onChange={(e) => manejarCambioProductoEditable("precio_unitario", parseFloat(e.target.value))} disabled
      />
    </div>
    <button className="add-button" onClick={guardarProductoEditado}>Guardar</button>
  </Modal>
)}
    </div>
  );
}
export default Recepciones;
