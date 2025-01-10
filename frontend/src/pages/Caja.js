import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { buscarProductosPorNombre } from "../api/inventario";
import { Html5QrcodeScanner } from "html5-qrcode";
import { addToCart } from "../api/caja";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { ToastContainer, toast } from "react-toastify"; // Para notificaciones visuales
import "react-toastify/dist/ReactToastify.css";
import "../styles/Caja.css";

function Caja() {
  const { user } = useAuth(); // Usuario autenticado
  const [todosProductos, setTodosProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const carritoRef = useRef([]); // Referencia al carrito en tiempo real
  const scannerRef = useRef(null); // Referencia para la instancia del escáner
  const [mostrarOpciones, setMostrarOpciones] = useState(false); // Nuevo estado para botones
  const [procesando, setProcesando] = useState(false); // Indica si se está procesando un QR
  const [pestañaModal, setPestañaModal] = useState("buscar"); // Puede ser "buscar" o "qr"
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [detallesPago, setDetallesPago] = useState({
    numero_tarjeta: "",
    nombre_cliente: "",
    ci_cliente: "",
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productosEncontrados, setProductosEncontrados] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [productoActual, setProductoActual] = useState(null);
  const [notificacion, setNotificacion] = useState(null);
  const [paginaActualCarrito, setPaginaActualCarrito] = useState(1);
  const [paginaActualProductos, setPaginaActualProductos] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false); // Bloqueo del botón
  const filasPorPagina = 5; // Número de filas por página

  // Cargar productos cuando el modal se abre
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const productos = await buscarProductosPorNombre(""); // Enviar una búsqueda vacía para obtener todos.
        setTodosProductos(productos);
        setProductosEncontrados(productos); // Inicializar los productos encontrados.
      } catch (err) {
        toast.error(err.message || "Error al cargar productos.");
      }
    };

    if (modalAbierto) {
      cargarProductos();
    }
  }, [modalAbierto]);

  // Actualizar referencia del carrito
  useEffect(() => {
    carritoRef.current = carrito;
  }, [carrito]);

  // Iniciar o detener el escáner QR según la pestaña activa
  useEffect(() => {
    if (pestañaModal === "qr" && modalAbierto) {
      iniciarEscaneoQR(); // Inicia el escáner cuando estás en la pestaña QR
    } else {
      detenerEscaneoQR(); // Detiene el escáner
    }
  }, [modalAbierto, pestañaModal]);

  // Detener el escáner QR
  const detenerEscaneoQR = () => {
    if (scannerRef.current) {
      scannerRef.current
        .clear() // Detiene y limpia el escáner
        .then(() => {
          console.log("Escáner detenido y limpio.");
        })
        .catch((error) => {
          console.error("Error al detener el escáner:", error);
        });
      scannerRef.current = null; // Limpia la referencia
    }
  };

  // Calcular datos paginados para carrito
  const obtenerDatosPaginadosCarrito = () => {
    const inicio = (paginaActualCarrito - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    return carrito.slice(inicio, fin);
  };

  // Calcular datos paginados para productos encontrados
  const obtenerDatosPaginadosProductos = () => {
    const inicio = (paginaActualProductos - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    return productosEncontrados.slice(inicio, fin);
  };

  // Cambiar página
  const cambiarPagina = (nuevaPagina, tipo) => {
    if (tipo === "carrito") {
      setPaginaActualCarrito(nuevaPagina);
    } else if (tipo === "productos") {
      setPaginaActualProductos(nuevaPagina);
    }
  };
  
  const calcularAnchoDinamico = (valor) => {
  // Determina un ancho base mínimo y calcula el ancho en función del número de dígitos
  const digitos = String(valor).length;
  return `${Math.max(1, digitos * 1)}px`; // 8px por carácter con un ancho mínimo de 20px
};

  // Manejar la entrada manual en el campo de cantidad
  const manejarEntradaCantidad = (indexPaginado, valor, stockDisponible) => {
    const indexReal = (paginaActualCarrito - 1) * filasPorPagina + indexPaginado;
    const cantidad = Math.max(0, Math.min(Number(valor), stockDisponible));
    setCarrito((prevCarrito) => {
      const carritoActualizado = [...prevCarrito];
      if (cantidad === 0) {
        // Eliminar el producto si la cantidad es 0
        carritoActualizado.splice(indexReal, 1);
        toast.info("Producto eliminado del carrito.");
      } else {
        // Actualizar la cantidad y el importe
        carritoActualizado[indexReal] = {
          ...carritoActualizado[indexReal],
          cantidad: cantidad,
          importe: cantidad * carritoActualizado[indexReal].precio_venta,
        };
      }
      return carritoActualizado;
    });
  };

  // Manejar cambios desde el select
  const actualizarCantidadDirectamente = (indexPaginado, nuevaCantidad) => {
    const indexReal = (paginaActualCarrito - 1) * filasPorPagina + indexPaginado;
    setCarrito((prevCarrito) => {
      const carritoActualizado = [...prevCarrito];
      if (nuevaCantidad === 0) {
        // Eliminar el producto si se selecciona 0
        carritoActualizado.splice(indexReal, 1);
        toast.info("Producto eliminado del carrito.");
      } else {
        // Actualizar la cantidad y el importe
        carritoActualizado[indexReal] = {
          ...carritoActualizado[indexReal],
          cantidad: nuevaCantidad,
          importe: nuevaCantidad * carritoActualizado[indexReal].precio_venta,
        };
      }
      return carritoActualizado;
    });
  };

  // Función para reiniciar el escáner
  const reiniciarEscaneo = () => {
    setMostrarOpciones(false); // Ocultar opciones
    setProcesando(false); // Permitir nuevas lecturas
    iniciarEscaneoQR(); // Reiniciar el escáner
  };

  // Iniciar el escáner QR
  const iniciarEscaneoQR = () => {
    const qrReaderElement = document.getElementById("qr-reader");
    if (!qrReaderElement) {
      console.error("El contenedor 'qr-reader' no está disponible en el DOM.");
      return;
    }
    // Detener y limpiar cualquier instancia previa del escáner
    detenerEscaneoQR();
    // Inicializar una nueva instancia del escáner
    scannerRef.current = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: 250,
    });
    scannerRef.current.render(
      async (decodedText) => {
        if (procesando) return; // Evita múltiples lecturas simultáneas
        setProcesando(true); // Bloqueo inmediato
        console.log(`Inicio del procesamiento para: ${decodedText}`);
        try {
          // Pausar el escáner inmediatamente
          scannerRef.current.pause();
          // Validar si el producto ya está en el carrito
          const existeEnCarrito = carritoRef.current.some(
            (item) => String(item.id) === String(decodedText)
          );
          if (existeEnCarrito) {
            toast.info("El producto ya está en el carrito.");
            return;
          }
          // Obtener los datos del producto desde la API
          const producto = await addToCart(decodedText, 1);
          if (!producto.stock || producto.stock <= 0) {
            toast.error(`El producto "${producto.nombre}" no tiene stock disponible.`);
            return;
          }
          // Añadir producto al carrito
          const nuevoProducto = {
            id: producto.id,
            nombre: producto.nombre,
            precio_venta: producto.precio_venta,
            cantidad: 1,
            unidad_medida: producto.unidad_medida,
            importe: producto.precio_venta,
            stock: producto.stock,
          };
          setCarrito((prevCarrito) => {
            const carritoActualizado = [...prevCarrito, nuevoProducto];
            console.log("Producto añadido:", nuevoProducto);
            console.log("Carrito actualizado:", carritoActualizado);
            return carritoActualizado;
          });
          toast.success(`Producto "${producto.nombre}" añadido al carrito.`);
        } catch (err) {
          console.error("Error al procesar el producto escaneado:", err);
          toast.error(err.message || "Error al procesar el producto.");
        } finally {
          // Reanudar el escáner tras una breve pausa
          setTimeout(() => {
            try {
              scannerRef.current.resume();
            } catch (error) {
              console.error("Error al reanudar el escáner:", error);
            }
          }, 500); // Pequeña pausa para evitar lecturas consecutivas
          setProcesando(false); // Permitir nuevos procesos
        }
      },
      (error) => {
        console.warn("Error al escanear:", error);
      }
    );
  };

  // Buscar productos manualmente
  const buscarProductos = () => {
    if (!busqueda.trim()) {
      setProductosEncontrados(todosProductos); // Si no hay búsqueda, mostrar todos.
      return;
    }
    const productosFiltrados = todosProductos.filter((producto) =>
      producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );
    setProductosEncontrados(productosFiltrados);
  };

  // Agregar producto al carrito
  const agregarProductoAlCarrito = () => {
    if (productoActual) {
      if (!productoActual.stock || productoActual.stock <= 0) {
        toast.error(`No se puede agregar el producto "${productoActual.nombre}" al carrito. Stock no disponible.`);
        return;
      }
      setCarrito((prevCarrito) => {
        console.log("Carrito antes de actualizar:", prevCarrito);
        const index = prevCarrito.findIndex((item) => item.nombre === productoActual.nombre);
        if (index !== -1) {
          const carritoActualizado = [...prevCarrito];
          const cantidadNueva = Number(cantidad);
          carritoActualizado[index] = {
            ...carritoActualizado[index],
            cantidad: carritoActualizado[index].cantidad + cantidadNueva,
            importe:
              carritoActualizado[index].precio_venta *
              (carritoActualizado[index].cantidad + cantidadNueva),
          };
          console.log("Carrito actualizado:", carritoActualizado);
          return carritoActualizado;
        } else {
          const nuevoCarrito = [
            ...prevCarrito,
            {
              ...productoActual,
              cantidad: Number(cantidad),
              importe: productoActual.precio_venta * Number(cantidad),
            },
          ];
          console.log("Nuevo producto añadido al carrito:", nuevoCarrito);
          return nuevoCarrito;
        }
      });
      setProductoActual(null);
      setCantidad(1);
      toast.success("Producto agregado al carrito.");
    }
  };

  // Actualizar cantidad en el carrito
  const actualizarCantidadCarrito = (indexPaginado, accion) => {
    const indexReal = (paginaActualCarrito - 1) * filasPorPagina + indexPaginado;
    setCarrito((prevCarrito) => {
      const carritoActualizado = [...prevCarrito];
      if (accion === "incrementar") {
        carritoActualizado[indexReal] = {
          ...carritoActualizado[indexReal],
          cantidad: carritoActualizado[indexReal].cantidad + 1,
          importe:
            (carritoActualizado[indexReal].cantidad + 1) * carritoActualizado[indexReal].precio_venta,
        };
      } else if (accion === "decrementar") {
        if (carritoActualizado[indexReal].cantidad > 1) {
          carritoActualizado[indexReal] = {
            ...carritoActualizado[indexReal],
            cantidad: carritoActualizado[indexReal].cantidad - 1,
            importe:
              (carritoActualizado[indexReal].cantidad - 1) * carritoActualizado[indexReal].precio_venta,
          };
        } else {
          carritoActualizado.splice(indexReal, 1);
        }
      }
      return carritoActualizado;
    });
  };

  // Confirmar venta
  const confirmarVentaHandler = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    const carritoConIdsValidos = carrito.map((item) => ({
      ...item,
      id: parseInt(item.id, 10),
    }));

    const venta = {
      carrito: carritoConIdsValidos,
      metodo_pago: metodoPago,
      detalles_pago: metodoPago === "transferencia" ? detallesPago : null,
      cajera: user?.id,
    };

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/facturas/confirmar-venta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(venta),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const responseData = await response.json();
      toast.success(responseData.message);

      // Refrescar productos al confirmar la venta.
      const productosActualizados = await buscarProductosPorNombre("");
      setTodosProductos(productosActualizados);
      setProductosEncontrados(productosActualizados);

      // Limpiar el carrito después de confirmar la venta.
      setCarrito([]);
    } catch (err) {
      console.error("Error al confirmar la venta:", err);
      toast.error(err.message || "Error al confirmar la venta.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cerrar modal
  const cerrarModal = () => {
    setModalAbierto(false);
    setProductoActual(null);
    detenerEscaneoQR(); // Detener el escáner al cerrar el modal
  };

  return (
    <div className="empleados-container">
      <h2>Caja Registradora</h2>
      <ToastContainer /> {/* Notificaciones visuales */}
      {notificacion && (
        <div className={`notificacion ${notificacion.tipo}`}>
          {notificacion.mensaje}
        </div>
      )}
      <div className="tabla-container">
        <Table
  key={`carrito-${carrito.length}-${Math.random()}`}
  headers={["Nombre", "U/M", "Precio", "Cantidad", "Importe"]}
  data={obtenerDatosPaginadosCarrito().map((item, index) => ({
    Nombre: <div style={{ textAlign: "center" }}>{item.nombre || "N/A"}</div>,
    "U/M": <div style={{ textAlign: "center" }}>{item.unidad_medida || "N/A"}</div>,
    Precio: (
      <div style={{ textAlign: "center" }}>
        {item.precio_venta ? `${parseFloat(item.precio_venta).toFixed(2)} CUP` : "N/A"}
      </div>
    ),
    Cantidad: (
      <div style={{ textAlign: "center" }}>
        <select
          className="cantidad-select"
          style={{ width: calcularAnchoDinamico(item.cantidad) }} // Estilo dinámico para el ancho
          value={item.cantidad}
          onChange={(e) => {
            const nuevaCantidad = Number(e.target.value);
            actualizarCantidadDirectamente(index, nuevaCantidad);
            // Actualizar el ancho dinámico
            e.target.style.width = calcularAnchoDinamico(nuevaCantidad);
          }}
        >
          {Array.from({ length: item.stock + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
    ),
    Importe: (
      <div style={{ textAlign: "center" }}>
        {item.importe ? `${parseFloat(item.importe).toFixed(2)}` : "N/A"}
      </div>
    ),
  }))}
  exactKeys={true}
/>
      </div>
      {/* Paginador */}
      <div className="pagination">
        <button
          disabled={paginaActualCarrito === 1}
          onClick={() => cambiarPagina(paginaActualCarrito - 1, "carrito")}
        >
          Anterior
        </button>
        {Array.from(
          { length: Math.min(3, Math.ceil(carrito.length / filasPorPagina)) },
          (_, i) => {
            const paginaInicio = Math.max(1, paginaActualCarrito - 1);
            const numeroPagina = paginaInicio + i;

            if (numeroPagina > Math.ceil(carrito.length / filasPorPagina)) return null;

            return (
              <button
                key={numeroPagina}
                className={paginaActualCarrito === numeroPagina ? "active-page" : ""}
                onClick={() => cambiarPagina(numeroPagina, "carrito")}
              >
                {numeroPagina}
              </button>
            );
          }
        )}
        <button
          disabled={paginaActualCarrito === Math.ceil(carrito.length / filasPorPagina)}
          onClick={() => cambiarPagina(paginaActualCarrito + 1, "carrito")}
        >
          Siguiente
        </button>
      </div>
      <div className="total">
        <strong>
          Total: {carrito.reduce((total, item) => total + item.importe, 0).toFixed(2)} CUP
        </strong>
      </div>
      <div className="form-group">
        <label>Método de Pago:</label>
        <select
          value={metodoPago}
          onChange={(e) => setMetodoPago(e.target.value)}
          className="metodo-pago-selector"
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>
        {metodoPago === "transferencia" && (
          <>
            <label>Número de Tarjeta:</label>
            <input
              type="text"
              value={detallesPago.numero_tarjeta}
              onChange={(e) =>
                setDetallesPago({ ...detallesPago, numero_tarjeta: e.target.value })
              }
            />
            <label>Nombre del Cliente:</label>
            <input
              type="text"
              value={detallesPago.nombre_cliente}
              onChange={(e) =>
                setDetallesPago({ ...detallesPago, nombre_cliente: e.target.value })
              }
            />
            <label>CI del Cliente:</label>
            <input
              type="text"
              value={detallesPago.ci_cliente}
              onChange={(e) => setDetallesPago({ ...detallesPago, ci_cliente: e.target.value })}
            />
          </>
        )}
      </div>
      <div className="botones-caja">
        <button className="add-button" onClick={confirmarVentaHandler} disabled={isProcessing}>
          {isProcessing ? "Procesando..." : "Confirmar Venta"}
        </button>
        <button className="add-button" onClick={() => setModalAbierto(true)}>
          Agregar Producto
        </button>
      </div>
      <Modal abierto={modalAbierto} cerrarModal={cerrarModal}>
        <div className="modal-tabs">
          <button
            className={`tab-button ${pestañaModal === "buscar" ? "active" : ""}`}
            onClick={() => setPestañaModal("buscar")}
          >
            Manual
          </button>
          <button
            className={`tab-button ${pestañaModal === "qr" ? "active" : ""}`}
            onClick={() => setPestañaModal("qr")}
          >
            QR
          </button>
        </div>
        <div className="modal-body">
          {pestañaModal === "buscar" && (
            <>
              <div className="botones-acciones">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Ingrese el nombre del producto"
                />
                <button onClick={buscarProductos} className="add-button">
                  Buscar
                </button>
              </div>
              {productosEncontrados.length > 0 && (
                <>
                  <div className="tabla-container">
                    <Table
                      key={`productos-${productosEncontrados.length}-${Math.random()}`} // Clave única para forzar renderizado
                      headers={["Nombre", "U/M", "Stock", "Precio"]}
                      data={obtenerDatosPaginadosProductos().map((producto) => ({
                        Nombre: (
                          <div style={{ textAlign: "center" }}>
                            {producto.nombre || "N/A"}
                          </div>
                        ),
                        "U/M": (
                          <div style={{ textAlign: "center" }}>
                            {producto.unidad_medida || "N/A"}
                          </div>
                        ),
                        Stock: (
                          <div style={{ textAlign: "center" }}>
                            {producto.stock !== undefined ? producto.stock : "N/A"}
                          </div>
                        ),
                        "Precio": (
                          <div style={{ textAlign: "center" }}>
                            {producto.precio_venta !== undefined
                              ? `${producto.precio_venta.toFixed(2)}`
                              : "N/A"}
                          </div>
                        ),
                        seleccionado: productoActual === producto,
                        onClick: () => setProductoActual(producto),
                      }))}
                      exactKeys={true}
                    />
                  </div>
                  {/* Paginador de productos encontrados */}
                  <div className="pagination">
                    <button
                      disabled={paginaActualProductos === 1}
                      onClick={() => cambiarPagina(paginaActualProductos - 1, "productos")}
                    >
                      Anterior
                    </button>
                    {Array.from(
                      { length: Math.min(3, Math.ceil(productosEncontrados.length / filasPorPagina)) },
                      (_, i) => {
                        const paginaInicio = Math.max(1, paginaActualProductos - 1);
                        const numeroPagina = paginaInicio + i;
                        if (numeroPagina > Math.ceil(productosEncontrados.length / filasPorPagina)) return null;
                        return (
                          <button
                            key={numeroPagina}
                            className={paginaActualProductos === numeroPagina ? "active-page" : ""}
                            onClick={() => cambiarPagina(numeroPagina, "productos")}
                          >
                            {numeroPagina}
                          </button>
                        );
                      }
                    )}
                    <button
                      disabled={paginaActualProductos === Math.ceil(productosEncontrados.length / filasPorPagina)}
                      onClick={() => cambiarPagina(paginaActualProductos + 1, "productos")}
                    >
                      Siguiente
                    </button>
                  </div>
                </>
              )}
            </>
          )}
          {pestañaModal === "qr" && (
            <div className="qr-scan-container">
              <div className="qr-header">
                <h3></h3>
                <p className="qr-instructions">
                  Coloca el código QR frente a la cámara para escanear el producto.
                </p>
              </div>
              {/* Área de Escaneo */}
              <div id="qr-reader" className="qr-reader"></div>
              {/* Estado del escaneo */}
              {procesando && <p className="qr-status">Procesando el escaneo...</p>}
              {notificacion && <p className={`qr-notificacion ${notificacion.tipo}`}>{notificacion.mensaje}</p>}
              {/* Detalles del producto escaneado */}
              {productoActual && (
                <div className="qr-product-info">
                  <h4>Producto Escaneado</h4>
                  <p><strong>Nombre:</strong> {productoActual.nombre}</p>
                  <p><strong>Precio:</strong> {productoActual.precio_venta.toFixed(2)}</p>
                  <p><strong>Stock:</strong> {productoActual.stock}</p>
                </div>
              )}
              {/* Botones de acción */}
              <div className="qr-actions">
                {!procesando && (
                  <>          
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {pestañaModal === "buscar" && (
          <>
            <label>Cantidad:</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              min="1"
            />
            <div className="modal-buttons">
              <button
                className="add-button"
                onClick={agregarProductoAlCarrito}
                disabled={!productoActual || productosEncontrados.length === 0}
              >
                Añadir al Carrito
              </button>
              <button className="cancel-button" onClick={cerrarModal}>
                Cerrar
              </button>
            </div>
          </>
        )}
        {pestañaModal === "qr" && (
          <div className="modal-buttons">
            <button className="cancel-button" onClick={cerrarModal}>
              Cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Caja;
