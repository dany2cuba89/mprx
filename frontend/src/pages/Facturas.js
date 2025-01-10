import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Para redirigir a la ventana emergente
import { getFacturasPorTipo } from "../api/facturas";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { ToastContainer, toast } from "react-toastify"; // Para notificaciones visuales
import "react-toastify/dist/ReactToastify.css"; // Estilos de las notificaciones
import "../styles/Facturas.css";

function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [tipo, setTipo] = useState("venta");
  const [intervalo, setIntervalo] = useState("hoy"); // Nuevo estado para el intervalo
  const [fechaInicio, setFechaInicio] = useState(null); // Para "Personalizado"
  const [fechaFin, setFechaFin] = useState(null); // Para "Personalizado"
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [facturasPaginadas, setFacturasPaginadas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const facturasPorPagina = 5;

  const navigate = useNavigate(); // Para abrir la ventana emergente

  useEffect(() => {
    cargarFacturas();
  }, [tipo, intervalo, fechaInicio, fechaFin]);

  useEffect(() => {
    paginarFacturas();
  }, [facturas, paginaActual]);

  const mostrarPaginas = () => {
    const paginasAdyacentes = 1; // Número de páginas adyacentes a mostrar alrededor de la página actual
    const inicio = Math.max(1, paginaActual - paginasAdyacentes); // Asegurarse de que no sea menor que 1
    const fin = Math.min(totalPaginas, paginaActual + paginasAdyacentes); // Asegurarse de que no sea mayor que el total

    const paginas = [];
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  };

  const cargarFacturas = async () => {
    try {
      let inicio = null;
      let fin = null;

      if (intervalo === "personalizado") {
        if (fechaInicio && fechaFin) {
          inicio = fechaInicio.toISOString().split("T")[0]; // Solo "YYYY-MM-DD"
          fin = fechaFin.toISOString().split("T")[0]; // Solo "YYYY-MM-DD"
        } else {
          toast.error("Seleccione un rango válido de fechas.");
          return;
        }
      } else {
        const hoy = new Date();
        switch (intervalo) {
          case "hoy":
            inicio = hoy.toISOString().split("T")[0]; // Fecha de hoy
            fin = hoy.toISOString().split("T")[0]; // Fecha de hoy
            break;

          case "ultima_semana":
            const hace7dias = new Date();
            hace7dias.setDate(hoy.getDate() - 7);
            inicio = hace7dias.toISOString().split("T")[0];
            fin = hoy.toISOString().split("T")[0];
            break;

          case "ultimo_mes":
            const primerDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const ultimoDiaMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
            inicio = primerDiaMesAnterior.toISOString().split("T")[0];
            fin = ultimoDiaMesAnterior.toISOString().split("T")[0];
            break;

          case "ultimo_ano":
            const primerDiaAnoAnterior = new Date(hoy.getFullYear() - 1, 0, 1);
            const ultimoDiaAnoAnterior = new Date(hoy.getFullYear() - 1, 11, 31);
            inicio = primerDiaAnoAnterior.toISOString().split("T")[0];
            fin = ultimoDiaAnoAnterior.toISOString().split("T")[0];
            break;

          default:
            toast.error("Intervalo no reconocido.");
            return;
        }
      }

      console.log("Consultando facturas entre (Fecha):", inicio, fin);

      const data = await getFacturasPorTipo(tipo, { fechaInicio: inicio, fechaFin: fin });

      setFacturas(data);
      setTotalPaginas(Math.ceil(data.length / facturasPorPagina));
    } catch (err) {
      console.error("Error en cargarFacturas:", err);
      toast.error("Error al cargar las facturas.");
    }
  };

  const paginarFacturas = () => {
    const inicio = (paginaActual - 1) * facturasPorPagina;
    const fin = inicio + facturasPorPagina;
    setFacturasPaginadas(facturas.slice(inicio, fin));
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const seleccionarFactura = (factura) => {
    setFacturaSeleccionada(factura);
  };

  const abrirModal = () => {
    if (facturaSeleccionada) {
      setModalAbierto(true);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFacturaSeleccionada(null);
  };

  const abrirVentanaAgregarFactura = () => {
    navigate("/factura-compra"); // Redirigir a la nueva vista
  };

  const exportarExcel = async () => {
    if (!facturaSeleccionada) {
      toast.error("Debe seleccionar una factura para exportar.");
      return;
    }

    try {
      const url = `${process.env.REACT_APP_BACKEND_URL}/facturas/exportar-excel/${facturaSeleccionada.id}`;

      // Crear un enlace temporal para descargar el archivo
      const link = document.createElement("a");
      link.href = url;
      link.download = `factura_${facturaSeleccionada.id}.xlsx`; // Nombre del archivo
      document.body.appendChild(link); // Agregar al DOM
      link.click(); // Simular clic
      document.body.removeChild(link); // Eliminar del DOM

      toast.success("Excel descargado correctamente.");
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
      toast.error("Error al exportar a Excel.");
    }
  };

  const formatearMoneda = (valor) => {
    return `$${parseFloat(valor).toFixed(2)}`;
  };

  return (
    <div className="empleados-container">
      <h2>Gestión de Facturas</h2>
      <ToastContainer /> {/* Contenedor para las notificaciones */}
      <div className="tabla-container">
        <div className="form-group">
          <label>Tipo de Factura:</label>
          <select
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value); // Cambiar el tipo de factura
              setPaginaActual(1); // Reiniciar el paginador a la primera página
            }}
            className="form-group"
          >
            <option value="venta">Facturas de Venta</option>
            <option value="compra">Facturas de Compra</option>
          </select>
          <label>Intervalo:</label>
          <select
            value={intervalo}
            onChange={(e) => {
              setIntervalo(e.target.value);
              setPaginaActual(1);
              if (e.target.value !== "personalizado") {
                setFechaInicio(null);
                setFechaFin(null);
              }
            }}
            className="form-group"
          >
            <option value="hoy">Hoy</option>
            <option value="ultima_semana">Última Semana</option>
            <option value="ultimo_mes">Último Mes</option>
            <option value="ultimo_ano">Último Año</option>
            <option value="personalizado">Personalizado</option>
          </select>

          {intervalo === "personalizado" && (
            <>
              <label>Fecha Inicio:</label>
              <input
                type="date"
                value={fechaInicio?.toISOString().split("T")[0] || ""}
                onChange={(e) => setFechaInicio(new Date(e.target.value))}
              />
              <label>Fecha Fin:</label>
              <input
                type="date"
                value={fechaFin?.toISOString().split("T")[0] || ""}
                onChange={(e) => setFechaFin(new Date(e.target.value))}
              />
            </>
          )}
        </div>

        <Table
          headers={[
            "Fecha",
            "Hora",
            "Tipo",
            "Total",
            "Cajera",
          ]}
          data={facturasPaginadas.map((factura) => ({
            fecha: new Date(factura.fecha).toLocaleDateString(),
            hora: new Date(factura.fecha).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            tipo: factura.tipo.charAt(0).toUpperCase() + factura.tipo.slice(1),
            total: formatearMoneda(factura.total),
            cajera: factura.usuarios?.nombre_completo || "N/A",
            onClick: () => seleccionarFactura(factura),
            seleccionado: facturaSeleccionada?.id === factura.id,
          }))}
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
        <button
          className="add-button"
          disabled={!facturaSeleccionada}
          onClick={abrirModal}
        >
          Detalles
        </button>
        <button
          className="add-button"
          disabled={!facturaSeleccionada}
          onClick={exportarExcel}
        >
          Exportar a Excel
        </button>
      </div>

      {modalAbierto && facturaSeleccionada && (
        <Modal abierto={modalAbierto} cerrarModal={cerrarModal}>
          <h3>Factura #{facturaSeleccionada.id}</h3>

          <div className="factura-detalles">
            <div className="campo">
              <label>Fecha:</label>
              <span>{new Date(facturaSeleccionada.fecha).toLocaleDateString()}</span>
            </div>
            <div className="campo">
              <label>Total:</label>
              <span>{formatearMoneda(facturaSeleccionada.total)}</span>
            </div>
            <div className="campo">
              <label>Método de Pago:</label>
              <span>{facturaSeleccionada.metodo_pago || "N/A"}</span>
            </div>
            <div className="campo">
              <label>Cajera:</label>
              <span>{facturaSeleccionada.usuarios?.nombre_completo || "N/A"}</span>
            </div>
          </div>

          <div className="factura-productos">
            <h4>Productos</h4>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>U/M</th> {/* Nueva columna */}
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Importe</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let productos = [];

                  try {
                    // Parsear el JSON de productos si es necesario
                    productos =
                      typeof facturaSeleccionada.productos === "string"
                        ? JSON.parse(facturaSeleccionada.productos)
                        : facturaSeleccionada.productos;

                    // Asegurarse de que sea un array
                    if (!Array.isArray(productos)) {
                      productos = [productos];
                    }
                  } catch (error) {
                    console.error("Error al procesar los productos:", error);
                    productos = [];
                  }

                  // Mapear los productos para mostrarlos en la tabla
                  return productos.map((producto, index) => {
                    const precio =
                      tipo === "compra" ? producto.precio_compra || 0 : producto.precio_venta || 0;

                    const importe =
                      !isNaN(precio) && !isNaN(producto.cantidad)
                        ? precio * producto.cantidad
                        : 0;

                    return (
                      <tr key={index}>
                        <td>{producto.nombre || "N/A"}</td>
                        <td>{producto.unidad_medida || "N/A"}</td> {/* Mostrar U/M */}
                        <td>{producto.cantidad || 0}</td>
                        <td>{`$${parseFloat(precio).toFixed(2)}`}</td>
                        <td>{`$${parseFloat(importe).toFixed(2)}`}</td>
                      </tr>
                    );
                  });
                })()}
                <tr>
                  <td colSpan="4" style={{ textAlign: "right", fontWeight: "bold" }}>
                    Total:
                  </td>
                  <td style={{ fontWeight: "bold" }}>
                    {formatearMoneda(facturaSeleccionada.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Facturas;
