import React, { useState, useEffect, useRef } from "react";
import {
  registerProductoSolicitado,
  getProductosSolicitados,
  updateProductoSolicitado,
  deleteProductoSolicitado,
  getSolicitudesCompra,
  registerSolicitudCompra,
  updateSolicitudCompra,
  deleteSolicitudCompra,
} from "../api/solicitudesCompra";
import {
  getFichaDeCosto,
  registerFichaDeCosto,
  updateFichaDeCosto,
} from "../api/fichaDeCosto";
import { supabase } from "../api/supabase";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { ToastContainer, toast } from "react-toastify"; // Para notificaciones visuales
import "react-toastify/dist/ReactToastify.css"; // Estilos de las notificaciones
import "../styles/SolicitudesCompra.css";

function SolicitudesCompra() {
  const [estadoGuardado, setEstadoGuardado] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [selectedProducto, setSelectedProducto] = useState(null); // Estado para producto seleccionado
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]); // Productos solicitados para la solicitud actual
  const [solicitudesPaginadas, setSolicitudesPaginadas] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const solicitudesPorPagina = 5;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("datos"); // Para manejar las pestañas
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoActual, setProductoActual] = useState(null);
  const [solicitudActual, setSolicitudActual] = useState({
    nombre_proveedor: "",
    fecha_solicitud: "",
    condiciones_pago: "",
    condiciones_entrega: "",
    estado_solicitud: "Pendiente",
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [errores, setErrores] = useState({});
  const [fichasCosto, setFichasCosto] = useState([]);
  const [indexFichaActual, setIndexFichaActual] = useState(0);
  const [modalFichaAbierto, setModalFichaAbierto] = useState(false);
  const [modoEdicionFicha, setModoEdicionFicha] = useState(false);
  const [fichaActual, setFichaActual] = useState(null);
  const solicitudActualRef = useRef(null); // Ref para sincronizar solicitud
  const fichasCostoRef = useRef([]); // Ref para sincronizar fichas de costo

  // Abrir el modal de producto (añadir o editar)
  const abrirModalProducto = (index) => {
    if (index !== null) {
      setProductoActual(productos[index]); // Editar producto existente
    } else {
      setProductoActual({
        nombre_producto: "",
        descripcion_producto: "",
        cantidad: 1,
        unidad_medida: "",
        precio_unitario: 0,
      });
    }
    setModalProductoAbierto(true);
  };

  // Cerrar el modal de producto
  const cerrarModalProducto = () => {
    setProductoActual(null);
    setModalProductoAbierto(false);
  };

  // Guardar el producto añadido o editado
  const guardarProducto = () => {
    if (productoActual) {
      const nuevosProductos = [...productos];
      if (productoActual.id !== undefined) {
        // Editar producto existente
        const index = productos.findIndex((p) => p.id === productoActual.id);
        if (index !== -1) {
          nuevosProductos[index] = { ...productoActual };
        }
      } else {
        // Añadir nuevo producto
        nuevosProductos.push({ ...productoActual, id: productos.length });
      }
      setProductos(nuevosProductos);
      cerrarModalProducto();
    }
  };

  useEffect(() => {
    cargarSolicitudes();
    cargarProveedores();
  }, []);

  useEffect(() => {
    paginarSolicitudes();
  }, [solicitudes, paginaActual]);

  const cargarSolicitudes = async () => {
    try {
      const data = await getSolicitudesCompra();
      setSolicitudes(data);
      setTotalPaginas(Math.ceil(data.length / solicitudesPorPagina));
    } catch (err) {
      toast.error("Error al cargar las solicitudes.");
    }
  };

  const cargarProveedores = async () => {
    try {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, nombre_o_razon_social");
      if (error) throw new Error(error.message);
      setProveedores(data);
    } catch (err) {
      toast.error("Error al cargar proveedores.");
    }
  };

  const paginarSolicitudes = () => {
    const inicio = (paginaActual - 1) * solicitudesPorPagina;
    const fin = inicio + solicitudesPorPagina;
    setSolicitudesPaginadas(solicitudes.slice(inicio, fin));
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  // Funciones para navegar entre las páginas
  const siguientePagina = () => {
    if (paginaActual < totalPaginas) {
      setPaginaActual(paginaActual + 1);
    }
  };

  const anteriorPagina = () => {
    if (paginaActual > 1) {
      setPaginaActual(paginaActual - 1);
    }
  };

  // Determinar qué páginas mostrar en el paginador
  const calcularRangoPaginas = () => {
    let paginasMostradas = [];
    const rangoDePaginas = 3; // Queremos mostrar 3 páginas (anterior, actual, siguiente)

    if (totalPaginas <= rangoDePaginas) {
      // Si hay menos de 3 páginas, mostrar todas
      for (let i = 1; i <= totalPaginas; i++) {
        paginasMostradas.push(i);
      }
    } else {
      // Si hay más de 3 páginas, mostrar las páginas adecuadas
      if (paginaActual === 1) {
        paginasMostradas = [1, 2, 3];
      } else if (paginaActual === totalPaginas) {
        paginasMostradas = [totalPaginas - 2, totalPaginas - 1, totalPaginas];
      } else {
        paginasMostradas = [paginaActual - 1, paginaActual, paginaActual + 1];
      }
    }

    return paginasMostradas;
  };

  const handleDeleteConfirmation = async () => {
    if (selectedSolicitud) {
      try {
        await deleteSolicitudCompra(selectedSolicitud.id);
        toast.success("Solicitud eliminada correctamente.");
        cargarSolicitudes();
        setSelectedSolicitud(null);
      } catch (err) {
        console.error("Error al eliminar solicitud:", err.message);
        toast.error("Error al eliminar la solicitud.");
      }
    }
    setIsConfirmModalOpen(false); // Cierra el modal después de la confirmación
  };

  const openDeleteConfirmModal = () => {
    if (!selectedSolicitud) {
      toast.error("Selecciona una solicitud para eliminar.");
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const closeDeleteConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setSolicitudActual({ ...solicitudActual, [name]: value });
    validarCampo(name, value);
  };

  const manejarCambioProducto = (index, campo, valor) => {
    const nuevosProductos = [...productos];
    nuevosProductos[index][campo] = valor;
    // Calcula el precio total automáticamente
    if (campo === "cantidad" || campo === "precio_unitario") {
      nuevosProductos[index].precio_total =
        nuevosProductos[index].cantidad * nuevosProductos[index].precio_unitario || 0;
    }
    setProductos(nuevosProductos);
  };

  const agregarProducto = () => {
    setProductos([
      ...productos,
      {
        nombre_producto: "",
        descripcion_producto: "",
        cantidad: 1,
        unidad_medida: "unidad",
        precio_unitario: 0,
        precio_total: 0,
      },
    ]);
  };

  const eliminarProducto = (index) => {
    setProductos(productos.filter((_, i) => i !== index));
    setSelectedProducto(null); // Limpia selección después de eliminar
  };

  const validarCampo = (name, value) => {
    let error = "";
    if (name === "fecha_solicitud" && !value) {
      error = "La fecha de solicitud es obligatoria.";
    }
    if (name === "nombre_proveedor" && !value) {
      error = "Debes seleccionar un proveedor.";
    }
    setErrores((prev) => ({ ...prev, [name]: error }));
  };

  const agregarSolicitud = async () => {
    const proveedor = proveedores.find(
      (p) => p.nombre_o_razon_social === solicitudActual.nombre_proveedor
    );
    if (!productos.length) {
      toast.error("Debe agregar al menos un producto.");
      return;
    }
    if (!proveedor) {
      toast.error("Proveedor seleccionado no válido.");
      return;
    }
    const nuevaSolicitud = {
      id_proveedor: proveedor.id,
      fecha_solicitud: solicitudActual.fecha_solicitud,
      condiciones_pago: solicitudActual.condiciones_pago,
      condiciones_entrega: solicitudActual.condiciones_entrega,
      estado_solicitud: solicitudActual.estado_solicitud,
    };
    try {
      console.log("Registrando solicitud de compra:", nuevaSolicitud);
      // Registrar la solicitud y verificar la respuesta
      const solicitudCreada = await registerSolicitudCompra(nuevaSolicitud);
      if (!solicitudCreada || !solicitudCreada.id) {
        throw new Error("Error al registrar la solicitud de compra.");
      }
      const solicitudId = solicitudCreada.id;
      console.log("Solicitud creada con ID:", solicitudId);
      // Agregar los productos asociados
      for (const producto of productos) {
        const productoSolicitado = {
          id_solicitud: solicitudId,
          nombre_producto: producto.nombre_producto,
          descripcion_producto: producto.descripcion_producto,
          cantidad: producto.cantidad,
          unidad_medida: producto.unidad_medida,
          precio_unitario: producto.precio_unitario,
        };
        console.log("Registrando producto solicitado:", productoSolicitado);
        await registerProductoSolicitado(productoSolicitado);
      }
      toast.success("Solicitud y productos agregados exitosamente.");
      cerrarModal();
      cargarSolicitudes();
    } catch (err) {
      console.error("Error en agregarSolicitud:", err.message);
      toast.error(err.message);
    }
  };

  // Guardar edición de la solicitud y manejar el flujo completo
  const guardarEdicion = async () => {
    const proveedor = proveedores.find(
      (p) => p.nombre_o_razon_social === solicitudActual.nombre_proveedor
    );

    if (!proveedor) {
      toast.error("Proveedor seleccionado no válido.");
      return;
    }

    const solicitudActualizada = {
      id_proveedor: proveedor.id,
      fecha_solicitud: solicitudActual.fecha_solicitud,
      condiciones_pago: solicitudActual.condiciones_pago,
      condiciones_entrega: solicitudActual.condiciones_entrega,
      estado_solicitud: solicitudActual.estado_solicitud,
    };

    try {
      if (!solicitudActual?.id) {
        throw new Error("ID de la solicitud actual no es válido.");
      }

      console.log("Actualizando solicitud:", solicitudActualizada);
      const updateResult = await updateSolicitudCompra(solicitudActual.id, solicitudActualizada);

      if (!updateResult?.success) {
        throw new Error("Error al actualizar la solicitud de compra.");
      }

      // Actualizar productos en la base de datos
      const productosIniciales = await getProductosSolicitados(solicitudActual.id);
      const idsProductosIniciales = productosIniciales.map((producto) => producto.id);
      const idsProductosEnModal = productos
        .filter((producto) => producto.id)
        .map((producto) => producto.id);

      for (const idProducto of idsProductosIniciales) {
        if (!idsProductosEnModal.includes(idProducto)) {
          await deleteProductoSolicitado(idProducto);
        }
      }

      for (const producto of productos) {
        if (producto.id) {
          await updateProductoSolicitado(producto.id, {
            nombre_producto: producto.nombre_producto,
            descripcion_producto: producto.descripcion_producto,
            cantidad: producto.cantidad,
            unidad_medida: producto.unidad_medida,
            precio_unitario: producto.precio_unitario,
          });
        } else {
          await registerProductoSolicitado({
            id_solicitud: solicitudActual.id,
            nombre_producto: producto.nombre_producto,
            descripcion_producto: producto.descripcion_producto,
            cantidad: producto.cantidad,
            unidad_medida: producto.unidad_medida,
            precio_unitario: producto.precio_unitario,
          });
        }
      }

      cargarSolicitudes(); // Actualizar la tabla en tiempo real

      if (solicitudActual.estado_solicitud === "Aprobada") {
        setEstadoGuardado(true); // Cambiar el estado después de guardar
        await verificarOCrearFichasDeCosto();
        abrirModalFicha();
      } else {
        toast.success("Solicitud y productos actualizados exitosamente.");
        setEstadoGuardado(false); // Asegurar que el estado vuelva a ser falso
        cerrarModal();
      }
    } catch (err) {
      console.error("Error en guardarEdicion:", err.message);
      toast.error(`Error al guardar los cambios: ${err.message}`);
    }
  };

  const abrirModal = async (solicitud = null) => {
    if (solicitud) {
      const proveedor = proveedores.find((p) => p.id === solicitud.id_proveedor);
      const productosSolicitud = await getProductosSolicitados(solicitud.id);

      setSolicitudActual({
        ...solicitud,
        nombre_proveedor: proveedor?.nombre_o_razon_social || "",
      });
      setProductos(productosSolicitud || []);
      setModoEdicion(true);

      // Verifica el estado antes de abrir el modal
      if (solicitud.estado_solicitud === "Aprobada") {
        setEstadoGuardado(true); // Cambiar botones a "Ver Ficha de Costo" y "Cerrar"
      } else {
        setEstadoGuardado(false); // Cambiar botones a "Guardar Cambios" y "Cancelar"
      }

      // Cargar fichas de costo si la solicitud está aprobada
      if (solicitud.estado_solicitud === "Aprobada") {
        const fichas = await Promise.all(
          productosSolicitud.map(async (producto) => {
            let ficha = await getFichaDeCosto(producto.id);
            if (!ficha) {
              ficha = {
                id_producto: producto.id,
                precio_adquisicion: producto.precio_unitario,
                margen_utilidad: 0.2,
                gastos_adicionales: 0,
                gastos_transporte: 0,
                gastos_almacenamiento: 0,
                gastos_administrativos: 0,
                impuestos_aranceles: 0,
                costo_total: producto.precio_unitario,
                precio_venta_propuesto: producto.precio_unitario * 1.2,
                descripcion_producto: producto.nombre_producto,
              };
              ficha.id = (await registerFichaDeCosto(ficha)).id;
            }
            return ficha;
          })
        );
        setFichasCosto(fichas);
        setIndexFichaActual(0);
      }
    } else {
      setSolicitudActual({
        nombre_proveedor: "",
        fecha_solicitud: "",
        condiciones_pago: "",
        condiciones_entrega: "",
        estado_solicitud: "Pendiente",
      });
      setProductos([]);
      setModoEdicion(false);
      setEstadoGuardado(false); // Por defecto, siempre muestra "Guardar Cambios" y "Cancelar"
    }

    setErrores({});
    setModalAbierto(true);
    setActiveTab("datos"); // Resetear a la pestaña de datos generales
  };

  // Cerrar Modal de Ficha de Costo y Actualizar Botones en Modal de Solicitud
  const cerrarModalFicha = () => {
    setModalFichaAbierto(false);
    setFichaActual(null);
    setModalAbierto(true); // Reabre el modal de solicitud

    if (solicitudActual?.estado_solicitud === "Aprobada") {
      setModoEdicion(false); // Cambia los botones a "Ver Ficha de Costo" y "Cerrar"
    }
  };

  // Verificar o crear fichas de costo y calcular los valores iniciales correctamente
  const verificarOCrearFichasDeCosto = async () => {
    const nuevasFichas = [];
    for (const producto of productos) {
      let ficha = await getFichaDeCosto(producto.id);
      if (!ficha) {
        // Crear ficha si no existe
        ficha = {
          id_producto: producto.id,
          precio_adquisicion: producto.precio_unitario,
          margen_utilidad: 0.2,
          gastos_adicionales: 0,
          gastos_transporte: 0,
          gastos_almacenamiento: 0,
          gastos_administrativos: 0,
          impuestos_aranceles: 0,
          costo_total: calcularCostoTotal({
            precio_adquisicion: producto.precio_unitario,
            gastos_adicionales: 0,
            gastos_transporte: 0,
            gastos_almacenamiento: 0,
            gastos_administrativos: 0,
            impuestos_aranceles: 0,
          }),
          precio_venta_propuesto: calcularPrecioVenta({
            costo_total: calcularCostoTotal({
              precio_adquisicion: producto.precio_unitario,
              gastos_adicionales: 0,
              gastos_transporte: 0,
              gastos_almacenamiento: 0,
              gastos_administrativos: 0,
              impuestos_aranceles: 0,
            }),
            margen_utilidad: 0.2,
          }),
          descripcion_producto: producto.nombre_producto,
        };
        ficha.id = (await registerFichaDeCosto(ficha)).id;
      }
      nuevasFichas.push(ficha);
    }
    setFichasCosto(nuevasFichas);
  };

  // Cálculos de costo total y precio de venta
  const calcularCostoTotal = (ficha) =>
    parseFloat(
      ficha.precio_adquisicion +
        ficha.gastos_adicionales +
        ficha.gastos_transporte +
        ficha.gastos_almacenamiento +
        ficha.gastos_administrativos +
        ficha.impuestos_aranceles
    );

  const calcularPrecioVenta = (ficha) =>
    parseFloat(ficha.costo_total * (1 + ficha.margen_utilidad));

  // Abrir el modal de ficha de costo con datos actualizados
  const abrirModalFicha = async () => {
    try {
      const fichasActualizadas = await Promise.all(
        productos.map(async (producto) => {
          const ficha = await getFichaDeCosto(producto.id);
          if (ficha) {
            ficha.costo_total = calcularCostoTotal(ficha);
            ficha.precio_venta_propuesto = calcularPrecioVenta(ficha);
          }
          return ficha;
        })
      );
      setFichasCosto(fichasActualizadas);
      setFichaActual(fichasActualizadas[0]); // Mostrar la primera ficha
      setIndexFichaActual(0);
      setModalFichaAbierto(true);
    } catch (err) {
      console.error("Error al cargar fichas de costo:", err.message);
      toast.error("Error al cargar fichas de costo.");
    }
  };

  // Guardar ficha de costo
  const guardarFichaDeCosto = async () => {
    try {
      // Guardar ficha en la base de datos
      await updateFichaDeCosto(fichaActual.id, fichaActual);

      // Actualizar el estado sincronizado en tiempo real
      const fichasActualizadas = fichasCosto.map((ficha) =>
        ficha.id === fichaActual.id ? fichaActual : ficha
      );
      setFichasCosto(fichasActualizadas);
      fichasCostoRef.current = fichasActualizadas;

      toast.success("Ficha guardada exitosamente.");
    } catch (error) {
      console.error("Error guardando ficha:", error);
      toast.error("Error al guardar la ficha.");
    }
  };

  // Cambiar entre fichas de costo
  const cambiarFicha = (direccion) => {
    const nuevoIndex = indexFichaActual + direccion;
    if (nuevoIndex >= 0 && nuevoIndex < fichasCosto.length) {
      setIndexFichaActual(nuevoIndex);
      setFichaActual(fichasCosto[nuevoIndex]);
    }
  };

  const cerrarModal = () => {
    setSolicitudActual({
      nombre_proveedor: "",
      fecha_solicitud: "",
      condiciones_pago: "",
      condiciones_entrega: "",
      estado_solicitud: "Pendiente",
    });
    setProductos([]);
    setModalAbierto(false);
    setErrores({});
  };

  return (
    <div className="empleados-container">
      <h2>Gestión de Solicitudes de Compra</h2>
      <ToastContainer /> {/* Contenedor para las notificaciones */}
      <div className="tabla-container">
        <Table
          headers={["Id", "Proveedor", "Fecha Solicitud", "Estado"]}
          data={solicitudesPaginadas.map((solicitud) => ({
            id: solicitud.id,
            proveedor: proveedores.find((p) => p.id === solicitud.id_proveedor)?.nombre_o_razon_social,
            "fecha solicitud": new Date(solicitud.fecha_solicitud).toLocaleDateString(),
            estado: solicitud.estado_solicitud,
            onClick: () => setSelectedSolicitud(
              selectedSolicitud?.id === solicitud.id ? null : solicitud // Alterna selección
            ),
            seleccionado: selectedSolicitud?.id === solicitud.id, // Indica si está seleccionado
          }))}
          exactKeys={false}
        />
      </div>
      <div className="pagination">
        <button onClick={anteriorPagina} disabled={paginaActual === 1}>
          Anterior
        </button>
        {calcularRangoPaginas().map((pagina) => (
          <button
            key={pagina}
            onClick={() => cambiarPagina(pagina)}
            className={pagina === paginaActual ? "active-page" : ""}
          >
            {pagina}
          </button>
        ))}
        <button onClick={siguientePagina} disabled={paginaActual === totalPaginas}>
          Siguiente
        </button>
      </div>
      <div className="botones-acciones">
        <button className="add-button" onClick={() => abrirModal()}>
          Agregar
        </button>
        <button
          className="add-button"
          disabled={!selectedSolicitud} // Deshabilitado si no hay selección
          onClick={() => abrirModal(selectedSolicitud)}
        >
          Editar
        </button>
        <button
          className="delete-button"
          disabled={!selectedSolicitud} // Deshabilitado si no hay selección
          onClick={openDeleteConfirmModal}
        >
          Eliminar
        </button>
      </div>
      {/* Modal de Confirmación de Eliminación */}
      {isConfirmModalOpen && (
        <Modal abierto={isConfirmModalOpen} cerrarModal={closeDeleteConfirmModal}>
          <h2>Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar la solicitud de compra con ID{" "}
            <strong>{selectedSolicitud?.id}</strong>?
          </p>
          <div className="modal-buttons">
            <button className="add-button" onClick={handleDeleteConfirmation}>
              Confirmar
            </button>
            <button className="cancel-button" onClick={closeDeleteConfirmModal}>
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      <Modal abierto={modalAbierto} cerrarModal={cerrarModal}>
        {/* Pestañas del modal principal */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === "datos" ? "active" : ""}`}
            onClick={() => setActiveTab("datos")}
          >
            Datos Generales
          </button>
          <button
            className={`tab-button ${activeTab === "productos" ? "active" : ""}`}
            onClick={() => setActiveTab("productos")}
            disabled={!solicitudActual.nombre_proveedor || !solicitudActual.fecha_solicitud} // Bloquea acceso a productos si no hay datos generales
          >
            Productos
          </button>
        </div>

        {/* Contenido de las pestañas */}
        {activeTab === "datos" && (
          <div className="tab-content">
            <h3>{modoEdicion ? "Editar Solicitud" : "Agregar Solicitud"}</h3>
            <h4><label>Proveedor</label></h4>
            <select
              name="nombre_proveedor"
              value={solicitudActual?.nombre_proveedor || ""}
              onChange={manejarCambio}
            >
              <option value="">Seleccionar Proveedor</option>
              {proveedores.map((proveedor) => (
                <option key={proveedor.id} value={proveedor.nombre_o_razon_social}>
                  {proveedor.nombre_o_razon_social}
                </option>
              ))}
            </select>
            {errores.nombre_proveedor && <p className="error-text">{errores.nombre_proveedor}</p>}
            <h4><label>Fecha</label></h4>
            <input
              type="date"
              name="fecha_solicitud"
              value={solicitudActual?.fecha_solicitud || ""}
              onChange={manejarCambio}
            />
            {errores.fecha_solicitud && <p className="error-text">{errores.fecha_solicitud}</p>}
            <h4><label>Condiciones de Pago</label></h4>
            <input
              type="text"
              name="condiciones_pago"
              placeholder="Condiciones de Pago"
              value={solicitudActual?.condiciones_pago || ""}
              onChange={manejarCambio}
            />
            <h4><label>Condiciones de Entrega</label></h4>
            <input
              type="text"
              name="condiciones_entrega"
              placeholder="Condiciones de Entrega"
              value={solicitudActual?.condiciones_entrega || ""}
              onChange={manejarCambio}
            />
            {/* Solo mostrar el campo de estado si estamos en modo edición */}
            {modoEdicion && (
              <div>
                <h4><label>Estado</label></h4>
                <select
                  name="estado_solicitud"
                  value={solicitudActual?.estado_solicitud || ""}
                  onChange={manejarCambio}
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Aprobada">Aprobada</option>
                  <option value="Rechazada">Rechazada</option>
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === "productos" && (
          <div className="tab-content">
            <h4>Productos Solicitados</h4>
            <Table
              headers={["Nombre", "Cantidad", "Precio", "Subtotal"]}
              data={productos.map((producto) => ({
                nombre: producto.nombre_producto,
                cantidad: producto.cantidad,
                precio: producto.precio_unitario.toFixed(2),
                subtotal: (producto.cantidad * producto.precio_unitario).toFixed(2),
                onClick: () =>
                  setSelectedProducto(selectedProducto === producto ? null : producto), // Alternar selección
                seleccionado: selectedProducto === producto, // Resalta si está seleccionado
              }))}
              exactKeys={false}
            />

            <div className="modal-buttons">
              <button className="add-button" onClick={() => abrirModalProducto(null)}>
                Añadir Producto
              </button>
              <button
                className="add-button"
                onClick={() =>
                  abrirModalProducto(productos.findIndex((p) => p === selectedProducto))
                }
                disabled={!selectedProducto} // Deshabilitado si no hay selección
              >
                Editar Producto
              </button>
              <button
                className="delete-button"
                onClick={() => eliminarProducto(productos.indexOf(selectedProducto))}
                disabled={!selectedProducto} // Deshabilitado si no hay selección
              >
                Eliminar Producto
              </button>
            </div>
          </div>
        )}
        {/* Botones dinámicos en el modal de solicitudes */}
        <div className="modal-buttons">
          {estadoGuardado ? (
            <>
              <button className="add-button" onClick={abrirModalFicha}>
                Ver Ficha de Costo
              </button>
              <button className="cancel-button" onClick={cerrarModal}>
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                className="add-button"
                onClick={modoEdicion ? guardarEdicion : agregarSolicitud}
              >
                {modoEdicion ? "Guardar Cambios" : "Agregar Solicitud"}
              </button>
              <button className="cancel-button" onClick={cerrarModal}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </Modal>

      <Modal abierto={modalProductoAbierto} cerrarModal={cerrarModalProducto}>
        <h3>{productoActual?.id ? "Editar Producto" : "Añadir Producto"}</h3>
        <h4><label>Nombre</label></h4>
        <input
          type="text"
          placeholder="Nombre Producto"
          value={productoActual?.nombre_producto || ""}
          onChange={(e) =>
            setProductoActual((prev) => ({ ...prev, nombre_producto: e.target.value }))
          }
        />
        <h4><label>Descripción</label></h4>
        <input
          type="text"
          placeholder="Descripción"
          value={productoActual?.descripcion_producto || ""}
          onChange={(e) =>
            setProductoActual((prev) => ({ ...prev, descripcion_producto: e.target.value }))
          }
        />
        <h4><label>Cantidad</label></h4>
        <input
          type="number"
          placeholder="Cantidad"
          value={productoActual?.cantidad || ""}
          onChange={(e) =>
            setProductoActual((prev) => ({
              ...prev,
              cantidad: parseInt(e.target.value, 10) || 0,
            }))
          }
        />
        <h4><label>Unidad de Medida</label></h4>
        <input
          type="text"
          placeholder="Unidad de Medida"
          value={productoActual?.unidad_medida || ""}
          onChange={(e) =>
            setProductoActual((prev) => ({ ...prev, unidad_medida: e.target.value }))
          }
        />
        <h4><label>Precio Unitario</label></h4>
        <input
          type="number"
          step="0.01"
          placeholder="Precio Unitario"
          value={productoActual?.precio_unitario || ""}
          onChange={(e) =>
            setProductoActual((prev) => ({
              ...prev,
              precio_unitario: parseFloat(e.target.value) || 0,
            }))
          }
        />
        <div className="modal-buttons">
          <button className="add-button" onClick={guardarProducto}>
            Guardar
          </button>
          <button className="cancel-button" onClick={cerrarModalProducto}>
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal abierto={modalFichaAbierto} cerrarModal={() => setModalFichaAbierto(false)}>
        <h3>Validar Ficha de Costo</h3>
        <div className="ficha-costo-container">
          {/* Producto */}
          <div className="campo">
            <label>Producto:</label>
            <span>{fichaActual?.descripcion_producto || "Sin descripción"}</span>
          </div>

          {/* Precio de Adquisición */}
          <div className="campo">
            <label>Precio de Adquisición:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.precio_adquisicion || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  precio_adquisicion: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    precio_adquisicion: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    precio_adquisicion: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Gastos Adicionales */}
          <div className="campo">
            <label>Gastos Adicionales:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.gastos_adicionales || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  gastos_adicionales: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    gastos_adicionales: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    gastos_adicionales: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Gastos de Transporte */}
          <div className="campo">
            <label>Gastos de Transporte:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.gastos_transporte || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  gastos_transporte: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    gastos_transporte: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    gastos_transporte: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Gastos de Almacenamiento */}
          <div className="campo">
            <label>Gastos de Almacenamiento:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.gastos_almacenamiento || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  gastos_almacenamiento: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    gastos_almacenamiento: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    gastos_almacenamiento: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Gastos Administrativos */}
          <div className="campo">
            <label>Gastos Administrativos:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.gastos_administrativos || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  gastos_administrativos: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    gastos_administrativos: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    gastos_administrativos: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Impuestos y Aranceles */}
          <div className="campo">
            <label>Impuestos y Aranceles:</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.impuestos_aranceles || 0}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  impuestos_aranceles: parseFloat(e.target.value) || 0,
                  costo_total: calcularCostoTotal({
                    ...fichaActual,
                    impuestos_aranceles: parseFloat(e.target.value) || 0,
                  }),
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    impuestos_aranceles: parseFloat(e.target.value) || 0,
                  }),
                })
              }
            />
          </div>

          {/* Margen de Utilidad */}
          <div className="campo">
            <label>Margen de Utilidad (%):</label>
            <input
              type="number"
              step="0.01"
              value={fichaActual?.margen_utilidad || 0.2}
              onChange={(e) =>
                setFichaActual({
                  ...fichaActual,
                  margen_utilidad: parseFloat(e.target.value) || 0.2,
                  precio_venta_propuesto: calcularPrecioVenta({
                    ...fichaActual,
                    margen_utilidad: parseFloat(e.target.value) || 0.2,
                  }),
                })
              }
            />
          </div>

          {/* Costo Total */}
          <div className="campo">
            <label>Costo Total:</label>
            <span>{fichaActual?.costo_total?.toFixed(2) || "0.00"}</span>
          </div>

          {/* Precio de Venta */}
          <div className="campo">
            <label>Precio de Venta:</label>
            <span>{fichaActual?.precio_venta_propuesto?.toFixed(2) || "0.00"}</span>
          </div>

          {/* Botones */}
          <div className="modal-buttons">
            <button
              onClick={() => cambiarFicha(-1)}
              disabled={indexFichaActual === 0}
              className="add-button"
            >
              Anterior
            </button>
            <button
              onClick={() => cambiarFicha(1)}
              disabled={indexFichaActual === fichasCosto.length - 1}
              className="add-button"
            >
              Siguiente
            </button>
            <button onClick={guardarFichaDeCosto} className="add-button">
              Guardar Ficha
            </button>
            <button
              onClick={() => {
                cerrarModalFicha(); // Llama a la función que regresa al modal de solicitudes
              }}
              className="cancel-button"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default SolicitudesCompra;
