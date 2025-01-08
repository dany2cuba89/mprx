import React, { useState, useEffect } from "react";
import {
  exportarBalanceGeneral,getBalanceGeneral,getResumenVentas,getResumenCompras,exportarResumenVentas,
  exportarResumenCompras,
  getReportesVentas,
  exportarProductosMasVendidos,
  getAlertasStockBajo,
  exportarAlertasStockBajo,
  getPagosEmpleados,
  exportarPagosEmpleados,
} from "../api/reportes";
import Table from "../components/Table";
import Chart from "../components/Chart"; // Asume que tienes un componente de gráficos
import "../styles/Reportes.css";
function Reportes() {
    const [tabActiva, setTabActiva] = useState("Balance General");
  const [tabActivaIndex, setTabActivaIndex] = useState(0); // Índice de pestaña activa
const pestañas = [
  "Balance General",
  "Compras",
  "Ventas",
  "Pagos Empleados",
  "Productos Más Vendidos",
  "Alertas Stock Bajo",
];
  const [mensaje, setMensaje] = useState(null);  
  const [fechaInicio, setFechaInicio] = useState("2024-01-01");
  const [fechaFin, setFechaFin] = useState("2024-12-31");
  const [mostrarFechasPersonalizadas, setMostrarFechasPersonalizadas] = useState(false);
  const [intervaloSeleccionado, setIntervaloSeleccionado] = useState("año");
  const [reportesVentas, setReportesVentas] = useState([]);
  const [balanceData, setBalanceData] = useState({
  resumenFinanciero: {
    totalIngresos: 0,
    totalEgresos: 0,
    utilidadNeta: 0,
    utilidadNetaDespuesPagos: 0,
  },
  detalles: [],
}); // Datos consolidados
  const [alertasStockBajo, setAlertasStockBajo] = useState([]);
  const [ventasData, setVentasData] = useState({ productosVendidos: [], totales: {} });
  const [pagosEmpleados, setPagosEmpleados] = useState([]);
  const [comprasData, setComprasData] = useState({ productos: [], totales: {} });
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const filasPorPagina = 5;
  useEffect(() => {
  if (tabActiva === "Balance General") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
  if (tabActiva === "Productos Más Vendidos") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
  if (tabActiva === "Pagos Empleados") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
  if (tabActiva === "Alertas Stock Bajo") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
  if (tabActiva === "Ventas") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
  if (tabActiva === "Compras") {
    manejarIntervalo(intervaloSeleccionado); // Asegura que se cargue el intervalo actual
    cargarDatos();
  }
}, [tabActiva, intervaloSeleccionado, fechaInicio, fechaFin]);
  useEffect(() => {
    calcularTotalPaginas();
  }, [reportesVentas, alertasStockBajo, ventasData, comprasData]);
  const cambiarPestaña = (pestaña) => {
    setTabActiva(pestaña);
    if (pestaña === "Productos Más Vendidos") manejarIntervalo("año");
  };
  const moverPestaña = (direccion) => {
  setTabActivaIndex((prevIndex) => {
    const nuevaIndex = (prevIndex + direccion + pestañas.length) % pestañas.length;
    return nuevaIndex;
  });
};
const pestañasVisibles = [
  pestañas[(tabActivaIndex - 1 + pestañas.length) % pestañas.length], // Anterior
  pestañas[tabActivaIndex], // Actual
  pestañas[(tabActivaIndex + 1) % pestañas.length], // Siguiente
];

  const manejarExportarPagos = async () => {
  try {
    setMensaje(null); // Reinicia el mensaje
    await exportarPagosEmpleados(fechaInicio, fechaFin);
    setMensaje({ tipo: "success", mensaje: "Archivo descargado correctamente." });
  } catch (error) {
    console.error("Error al descargar el archivo:", error.message);
    setMensaje({ tipo: "error", mensaje: "Error al descargar el archivo." });
  }
};
  const ajustarHoraCuba = (fecha) => {
  const date = new Date(fecha);
  date.setUTCHours(date.getUTCHours() + 5); // Ajusta la hora para UTC
  return date.toISOString().split("T")[0]; // Devuelve solo la parte de fecha
};
  const manejarIntervalo = (nuevoIntervalo) => {
  if (tabActiva === "Alertas Stock Bajo") return;

  setIntervaloSeleccionado(nuevoIntervalo);
  setMostrarFechasPersonalizadas(nuevoIntervalo === "personalizado");
  if (nuevoIntervalo === "personalizado") return;

  const hoy = new Date();
  const fechaActual = ajustarHoraCuba(hoy);
  let nuevaFechaInicio = "2024-01-01";

  switch (nuevoIntervalo) {
    case "hoy":
      nuevaFechaInicio = ajustarHoraCuba(hoy);
      break;
    case "semana":
      nuevaFechaInicio = ajustarHoraCuba(new Date(hoy.setDate(hoy.getDate() - 7)));
      break;
    case "mes":
      nuevaFechaInicio = ajustarHoraCuba(new Date(hoy.setMonth(hoy.getMonth() - 1)));
      break;
    case "año":
      nuevaFechaInicio = ajustarHoraCuba(new Date(hoy.setFullYear(hoy.getFullYear() - 1)));
      break;
    default:
      break;
  }

  setFechaInicio(nuevaFechaInicio);
  setFechaFin(fechaActual);
};

useEffect(() => {
  setTabActiva(pestañas[tabActivaIndex]);
}, [tabActivaIndex]);


// Asegurarse de ajustar fechas antes de enviarlas a la API  
const cargarDatos = async () => {
  try {
	if (tabActiva === "Balance General") {
  try {   

      console.log("[Frontend] Pestaña activa: Balance General. Fechas (UTC):", { fechaInicio, fechaFin });
      const data = await getBalanceGeneral(fechaInicio, fechaFin);
    // Validar la estructura de los datos recibidos
    if (!data || !data.compras || !data.ventas || !data.pagos) {
      console.warn("[Balance General] Datos incompletos o inválidos recibidos del backend:", data);
      setBalanceData({
        resumenFinanciero: {
          totalIngresos: 0,
          totalEgresos: 0,
          utilidadNeta: 0,
          utilidadNetaDespuesPagos: 0,
        },
        detalles: [],
      });
      return;
    }
    console.log("[Frontend] Datos crudos recibidos para Balance General:", data);
    // Calcular los totales
    const totalCompras = data.compras.reduce((acc, item) => acc + (item.gastos_totales || 0), 0);
    const totalVentas = data.ventas.reduce((acc, item) => acc + (item.total_ingreso || 0), 0);
    const totalPagos = data.pagos.reduce((acc, item) => acc + (item.monto || 0), 0);
    // Construir los datos consolidados
    const totalEgresos = totalCompras;
    const totalIngresos = totalVentas;
    const utilidadNeta = totalIngresos - totalEgresos;
    const utilidadNetaDespuesPagos = utilidadNeta - totalPagos;
    console.log("[Balance General] Datos procesados:", {
      totalIngresos,
      totalEgresos,
      utilidadNeta,
      utilidadNetaDespuesPagos,
    });
    // Actualizar el estado con los datos procesados
    setBalanceData({
      resumenFinanciero: {
        totalIngresos,
        totalEgresos,
        utilidadNeta,
        utilidadNetaDespuesPagos, // Aquí se incluye correctamente
      },
      detalles: [
        ...data.compras.map((item) => ({
          tipo: "Compra",
          descripcion: item.nombre_producto,
          monto: item.gastos_totales,
        })),
        ...data.ventas.map((item) => ({
          tipo: "Venta",
          descripcion: item.nombre_producto,
          monto: item.total_ingreso,
        })),
        ...data.pagos.map((item) => ({
          tipo: "Pago",
          descripcion: item.nombre_empleado,
          monto: item.monto,
        })),
      ],
    });
  } catch (error) {
    console.error("[Balance General] Error al cargar datos:", error);
    setBalanceData({
      resumenFinanciero: {
        totalIngresos: 0,
        totalEgresos: 0,
        utilidadNeta: 0,
        utilidadNetaDespuesPagos: 0, // Incluido en el estado inicial también
      },
      detalles: [],
    });
  }
} 
    if (tabActiva === "Compras") {
  try {
    console.log("[Frontend] Pestaña activa: Compras. Fechas:", { fechaInicio, fechaFin });
    const data = await getResumenCompras(fechaInicio, fechaFin);
    // Validar estructura de los datos obtenidos
    if (!data || !data.productos || !Array.isArray(data.productos) || !data.totales) {
      console.warn("[Frontend] Datos inválidos recibidos para compras:", data);
      setComprasData({ productos: [], totales: {} });
      return;
    }
    console.log("[Frontend] Datos crudos procesados recibidos para compras:", data);
    // Procesar productos comprados
    const productos = data.productos.map((item) => {
      const nombreProducto = item.Producto || item.nombre_producto || "N/A";
      const cantidadTotal = item["Cantidad Comprada"] || item.cantidad_total || 0;
      const precioUnitario = item["Precio Unitario"]
        ? parseFloat(item["Precio Unitario"].replace("$", "")).toFixed(2)
        : parseFloat(item.precio_unitario || 0).toFixed(2);
      const importeTotal = item["Importe Total"]
        ? parseFloat(item["Importe Total"].replace("$", "")).toFixed(2)
        : parseFloat(item.importe_total || 0).toFixed(2);
      return {
        Producto: nombreProducto,
        "Cantidad Comprada": cantidadTotal,
        "Precio Unitario": `$${precioUnitario}`,
        "Importe Total": `$${importeTotal}`,
      };
    });
    console.log("[Frontend] Productos mapeados para la tabla compras:", productos);
    // Procesar totales de compras
    const totalesBackend = data.totales || {};
    console.log("[Frontend] Totales crudos del backend:", totalesBackend);
    const totales = {
      "Total de Unidades Compradas": totalesBackend["Total de Unidades Compradas"]
        ? parseInt(totalesBackend["Total de Unidades Compradas"], 10)
        : 0,
      "Gastos Totales": totalesBackend["Gastos Totales"]
        ? totalesBackend["Gastos Totales"]
        : "$0.00",
      "Total en Efectivo": totalesBackend["Total en Efectivo"]
        ? totalesBackend["Total en Efectivo"]
        : "$0.00",
      "Total en Transferencias": totalesBackend["Total en Transferencias"]
        ? totalesBackend["Total en Transferencias"]
        : "$0.00",
    };
    console.log("[Frontend] Totales mapeados para la tabla compras:", totales);
    // Actualizar el estado con los datos procesados
    setComprasData({ productos, totales });
    setPaginaActual(1); // Reiniciar a la primera página al cargar datos
  } catch (error) {
    console.error("[Frontend] Error al cargar datos de compras:", error);
    // Reiniciar datos en caso de error
    setComprasData({ productos: [], totales: {} });
  }
}
    // Pestaña Ventas
    if (tabActiva === "Ventas") {
      const data = await getResumenVentas(fechaInicio, fechaFin);
      if (!data || !data.productos || !Array.isArray(data.productos)) {
        setVentasData({ productosVendidos: [], totales: {} });
        return;
      }
      const productosVendidos = data.productos.map((item) => {
        const nombreProducto = item.nombre_producto || "N/A";
        const precioUnitario = !isNaN(parseFloat(item.precio_unitario?.replace("$", "")))
          ? parseFloat(item.precio_unitario.replace("$", ""))
          : 0;
        const totalIngreso = !isNaN(parseFloat(item.total_ingreso?.replace("$", "")))
          ? parseFloat(item.total_ingreso.replace("$", ""))
          : 0;
        const cantidadTotal = !isNaN(parseInt(item.cantidad_total, 10))
          ? parseInt(item.cantidad_total, 10)
          : 0;
        return {
          Producto: nombreProducto,
          "Precio Unitario": `$${precioUnitario.toFixed(2)}`,
          "Cantidad Total": cantidadTotal,
          "Importe Total": `$${totalIngreso.toFixed(2)}`,
        };
      });
      const totales = {
        "Total de Unidades Vendidas": parseInt(data.totales.productos_totales || 0, 10),
        "Total en Efectivo": data.totales.total_efectivo || "$0.00",
        "Total en Transferencias": data.totales.total_transferencia || "$0.00",
        "Ingresos Totales": data.totales.ingresos_totales || "$0.00",
      };
      setVentasData({ productosVendidos, totales });
    }
    // Pestaña Pagos a Empleados
    if (tabActiva === "Pagos Empleados") {
      const data = await getPagosEmpleados(fechaInicio, fechaFin);
      if (!data || data.length === 0) {
        setPagosEmpleados([]);
        return;
      }
      const pagosMapeados = data.map((pago) => ({
        Empleado: pago.nombre_empleado || "N/A",
        "Monto Pagado": `$${parseFloat(pago.monto || 0).toFixed(2)}`,
        "Fecha de Pago": new Date(pago.fecha_pago).toLocaleString(),
        "Método de Pago": pago.metodo_pago || "N/A",
        Notas: pago.notas || "Sin notas",
      }));
      setPagosEmpleados(pagosMapeados);
    }
    // Pestaña Productos Más Vendidos
    if (tabActiva === "Productos Más Vendidos") {
      const data = await getReportesVentas(fechaInicio, fechaFin);
      setReportesVentas(
        data.map((item) => ({
          Producto: item.nombre || "N/A",
          "Cantidad Vendida": item.cantidad_vendida || 0,
          "Ingreso Total": `$${parseFloat(item.ingreso_total || 0).toFixed(2)}`,
        }))
      );
    }
    // Pestaña Alertas de Stock Bajo
    if (tabActiva === "Alertas Stock Bajo") {
      const data = await getAlertasStockBajo();
      setAlertasStockBajo(
        data.map((item) => ({
          Producto: item.nombre || "N/A",
          "Stock Actual": item.stock_actual || 0,
          "Nivel Mínimo": item.nivel_minimo || 0,
          Diferencia: (item.stock_actual || 0) - (item.nivel_minimo || 0),
        }))
      );
    }
  } catch (error) {
    console.error("Error al cargar datos:", error.message);
    mostrarNotificacion("error", `Error al cargar datos: ${error.message}`);
  }
};
  const calcularTotalPaginas = () => {
    const datos =
  tabActiva === "Productos Más Vendidos"
    ? reportesVentas
    : tabActiva === "Alertas Stock Bajo"
    ? alertasStockBajo
    : tabActiva === "Ventas"
    ? ventasData.productosVendidos
    : tabActiva === "Compras"
    ? comprasData.productos
    : [];
    setTotalPaginas(Math.ceil(datos.length / filasPorPagina));
  };
  const obtenerDatosPaginados = () => {
  const datos =
    tabActiva === "Productos Más Vendidos"
      ? reportesVentas
      : tabActiva === "Alertas Stock Bajo"
      ? alertasStockBajo
      : tabActiva === "Ventas"
      ? ventasData.productosVendidos
      : tabActiva === "Pagos Empleados"
      ? pagosEmpleados
      : tabActiva === "Compras"
      ? comprasData.productos
      : [];
  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  return datos.slice(inicio, fin);
};
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };
  const exportarReporteExcel = async () => {
    try {
      if (tabActiva === "Productos Más Vendidos") {
        await exportarProductosMasVendidos(fechaInicio, fechaFin);
      } else if (tabActiva === "Compras") {
      await exportarResumenCompras(fechaInicio, fechaFin);
    }else if (tabActiva === "Alertas Stock Bajo") {
        await exportarAlertasStockBajo();
      } else if (tabActiva === "Ventas") {
        await exportarResumenVentas(fechaInicio, fechaFin);
      } else if (tabActiva === "Balance General") {
        await exportarBalanceGeneral(fechaInicio, fechaFin);
      }
      mostrarNotificacion("success", "Reporte exportado correctamente.");
    } catch (err) {
      mostrarNotificacion("error", `Error al exportar el reporte: ${err.message}`);
    }
  };
  const mostrarNotificacion = (tipo, mensaje) => {
    setMensaje({ tipo, mensaje });
    setTimeout(() => setMensaje(null), 3000);
  };
  return (
    <div className="reportes-container">
      <h2>Gestión de Reportes</h2>
      {mensaje && <div className={`notificacion ${mensaje.tipo}`}>{mensaje.mensaje}</div>}
      <div className="tabs-carousel">
  <button onClick={() => moverPestaña(-1)} className="carousel-button">
    ◀
  </button>
  {pestañasVisibles.map((pestaña, index) => (
    <button
      key={index}
      className={`tab-button ${pestaña === pestañas[tabActivaIndex] ? "active" : ""}`}
      onClick={() => setTabActivaIndex(pestañas.indexOf(pestaña))}
    >
      {pestaña}
    </button>
  ))}
  <button onClick={() => moverPestaña(1)} className="carousel-button">
    ▶
  </button>
</div>

      {(tabActiva === "Productos Más Vendidos" || tabActiva === "Ventas") && (
        <div className="form-group">
          <label>Intervalo:</label>
          <select
            value={intervaloSeleccionado}
            onChange={(e) => manejarIntervalo(e.target.value)}
            className="tipo-select"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Última Semana</option>
            <option value="mes">Último Mes</option>
            <option value="año">Último Año</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
      )}
      {mostrarFechasPersonalizadas && (tabActiva === "Productos Más Vendidos" || tabActiva === "Ventas") && (
        <div className="form-group">
          <label>Fecha Inicio:</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <label>Fecha Fin:</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
      )}
       {/* Balance General */}
{tabActiva === "Balance General" && (
  <>
    <div className="form-group">
      <label>Intervalo:</label>
      <select
        value={intervaloSeleccionado}
        onChange={(e) => manejarIntervalo(e.target.value)}
        className="tipo-select"
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Última Semana</option>
        <option value="mes">Último Mes</option>
        <option value="año">Último Año</option>
        <option value="personalizado">Personalizado</option>
      </select>
    </div>
    {mostrarFechasPersonalizadas && (
      <div className="form-group">
        <label>Fecha Inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <label>Fecha Fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </div>
    )}
    <h3>Balance Financiero General</h3>
    <div className="chart-container">
      <Chart
        type="bar"
        data={{
          labels: ["Ingresos", "Egresos"],
          datasets: [
            {
              label: "Monto ($)",
              data: [
                balanceData?.resumenFinanciero?.totalIngresos || 0,
                balanceData?.resumenFinanciero?.totalEgresos || 0,
              ],
              backgroundColor: ["#4CAF50", "#FF5733"],
            },
          ],
        }}
      />
    </div>
    <h3>Cierre Económico</h3>
    <div className="tabla-container">
      {/* Tabla de Balance Financiero General */}
<table className="tabla-container">
  <thead>
    <tr>
      <th>Total Ingresos</th>
      <th>Total Egresos</th>
      <th>Utilidad/Pérdida Neta</th>
      <th>Utilidad/Pérdida Neta (después de pagos)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>${balanceData.resumenFinanciero.totalIngresos.toFixed(2)}</td>
      <td>${balanceData.resumenFinanciero.totalEgresos.toFixed(2)}</td>
      <td
        style={{
          color: balanceData.resumenFinanciero.utilidadNeta >= 0 ? "green" : "red",
        }}
      >
        ${balanceData.resumenFinanciero.utilidadNeta.toFixed(2)}
      </td>
      <td
        style={{
          color: balanceData.resumenFinanciero.utilidadNetaDespuesPagos >= 0 ? "green" : "red",
        }}
      >
        ${balanceData.resumenFinanciero.utilidadNetaDespuesPagos.toFixed(2)}
      </td>
    </tr>
  </tbody>
</table>
    </div>
    <button
      onClick={() => exportarBalanceGeneral(fechaInicio, fechaFin)}
      className="add-button"
    >
      Exportar a Excel
    </button>
  </>
)}
{/* Compras */}
{tabActiva === "Compras" && (
  <div className="tabla-container">
    <div className="form-group">
      <label>Intervalo:</label>
      <select
        value={intervaloSeleccionado}
        onChange={(e) => manejarIntervalo(e.target.value)}
        className="tipo-select"
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Última Semana</option>
        <option value="mes">Último Mes</option>
        <option value="año">Último Año</option>
        <option value="personalizado">Personalizado</option>
      </select>
    </div>
    {mostrarFechasPersonalizadas && (
      <div className="form-group">
        <label>Fecha Inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <label>Fecha Fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </div>
    )}
    
{/* Tabla de Productos Comprados */}
<div className="tabla-container">
<h3>Compras</h3>
<Table
  headers={["Producto", "Cantidad Comprada", "Precio Unitario", "Importe Total"]}
  data={obtenerDatosPaginados()} // Aplicar paginación aquí
  exactKeys={true} // Asegura que headers coincidan exactamente con claves
/></div>
{/* Paginación */}
<div className="pagination">
  <button
    disabled={paginaActual === 1}
    onClick={() => cambiarPagina(paginaActual - 1)}
  >
    Anterior
  </button>
  {[...Array(totalPaginas).keys()].map((index) => (
    <button
      key={index}
      className={paginaActual === index + 1 ? "active-page" : ""}
      onClick={() => cambiarPagina(index + 1)}
    >
      {index + 1}
    </button>
  ))}
  <button
    disabled={paginaActual === totalPaginas}
    onClick={() => cambiarPagina(paginaActual + 1)}
  >
    Siguiente
  </button>
</div>
{/* Tabla de Totales */}
<div className="tabla-container">
  <h3>Cierre Económico</h3>
  <table className="totales-table">
    <thead>
      <tr>
        <th>Total de Unidades Compradas</th>
        <th>Total en Efectivo</th>
        <th>Total en Transferencias</th>
        <th>Gastos Totales</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{comprasData.totales["Total de Unidades Compradas"] || 0}</td>
        <td>{comprasData.totales["Total en Efectivo"] || "$0.00"}</td>
        <td>{comprasData.totales["Total en Transferencias"] || "$0.00"}</td>
        <td>{comprasData.totales["Gastos Totales"] || "$0.00"}</td>
      </tr>
    </tbody>
  </table>
</div>
{/* Botón de Exportación */}
<button onClick={exportarReporteExcel} className="add-button">
  Exportar a Excel
</button>
  </div>
)}
{/* Pagos a Empleados */}
{tabActiva === "Pagos Empleados" && (
  <div className="tabla-container">
    {/* Selector de Intervalo */}
    <div className="form-group">
      <label>Intervalo:</label>
      <select
        value={intervaloSeleccionado}
        onChange={(e) => manejarIntervalo(e.target.value)}
        className="tipo-select"
      >
        <option value="hoy">Hoy</option>
        <option value="semana">Última Semana</option>
        <option value="mes">Último Mes</option>
        <option value="año">Último Año</option>
        <option value="personalizado">Personalizado</option>
      </select>
    </div>
    {/* Fechas Personalizadas */}
    {mostrarFechasPersonalizadas && (
      <div className="form-group">
        <label>Fecha Inicio:</label>
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
        />
        <label>Fecha Fin:</label>
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
        />
      </div>
    )}
    
    {/* Tabla de Pagos */}
    <div className="tabla-container">
    <h3>Pagos a Empleados</h3>
    <Table
      headers={["Empleado", "Monto Pagado", "Fecha de Pago", "Método de Pago", "Notas"]}
      data={obtenerDatosPaginados()}
      exactKeys={true}
    />
    </div>
    {/* Paginación */}
    <div className="pagination">
      <button
        disabled={paginaActual === 1}
        onClick={() => cambiarPagina(paginaActual - 1)}
      >
        Anterior
      </button>
      {[...Array(totalPaginas).keys()].map((index) => (
        <button
          key={index}
          className={paginaActual === index + 1 ? "active-page" : ""}
          onClick={() => cambiarPagina(index + 1)}
        >
          {index + 1}
        </button>
      ))}
      <button
        disabled={paginaActual === totalPaginas}
        onClick={() => cambiarPagina(paginaActual + 1)}
      >
        Siguiente
      </button>
    </div>
    {/* Botón de Exportación */}
<button
  onClick={() => exportarPagosEmpleados(fechaInicio, fechaFin)}
  className="add-button"
>
  Exportar a Excel
</button>
  </div>
)}
      {tabActiva === "Productos Más Vendidos" && (
        <div className="tabla-container">
        <h3>Productos Más Vendidos</h3>
        <div className="tabla-container">
          <Table
            headers={["Producto", "Cantidad Vendida", "Ingreso Total"]}
            data={obtenerDatosPaginados()}
            exactKeys={true}
          /></div>
          <div className="pagination">
            <button
              disabled={paginaActual === 1}
              onClick={() => cambiarPagina(paginaActual - 1)}
            >
              Anterior
            </button>
            {[...Array(totalPaginas).keys()].map((index) => (
              <button
                key={index}
                className={paginaActual === index + 1 ? "active-page" : ""}
                onClick={() => cambiarPagina(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              disabled={paginaActual === totalPaginas}
              onClick={() => cambiarPagina(paginaActual + 1)}
            >
              Siguiente
            </button>
          </div>
          <button onClick={exportarReporteExcel} className="add-button">
            Exportar a Excel
          </button>
        </div>
      )}
      {tabActiva === "Alertas Stock Bajo" && (
        <div className="tabla-container">
        <h3>Alertas Stock Bajo</h3>
          <div className="tabla-container">
          <Table
            headers={["Producto", "Stock Actual", "Nivel Mínimo", "Diferencia"]}
            data={obtenerDatosPaginados()}
            exactKeys={true}
          /></div>
          <div className="pagination">
            <button
              disabled={paginaActual === 1}
              onClick={() => cambiarPagina(paginaActual - 1)}
            >
              Anterior
            </button>
            {[...Array(totalPaginas).keys()].map((index) => (
              <button
                key={index}
                className={paginaActual === index + 1 ? "active-page" : ""}
                onClick={() => cambiarPagina(index + 1)}
              >
                {index + 1}
              </button>
            ))}
            <button
              disabled={paginaActual === totalPaginas}
              onClick={() => cambiarPagina(paginaActual + 1)}
            >
              Siguiente
            </button>
          </div>
          <button onClick={exportarReporteExcel} className="add-button">
            Exportar a Excel
          </button>
        </div>
      )}
      {tabActiva === "Ventas" && (
  <div className="tabla-container">
    <div className="tabla-container">
    <h3>Ventas</h3>
      <Table
        headers={["Producto", "Precio Unitario", "Cantidad Total", "Importe Total"]}
        data={obtenerDatosPaginados()}
        exactKeys={true}
      />
    </div>
    
    <div className="pagination">
      <button
        disabled={paginaActual === 1}
        onClick={() => cambiarPagina(paginaActual - 1)}
      >
        Anterior
      </button>
      {[...Array(totalPaginas).keys()].map((index) => (
        <button
          key={index}
          className={paginaActual === index + 1 ? "active-page" : ""}
          onClick={() => cambiarPagina(index + 1)}
        >
          {index + 1}
        </button>
      ))}
      <button
        disabled={paginaActual === totalPaginas}
        onClick={() => cambiarPagina(paginaActual + 1)}
      >
        Siguiente
      </button>
    </div>
    
    <div className="tabla-container">
      <h3>Cierre Económico</h3>
      <table className="totales-table">
        <thead>
          <tr>
            <th>Total de Unidades Vendidas</th>
            <th>Total en Efectivo</th>
            <th>Total en Transferencias</th>
            <th>Ingresos Totales</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{ventasData.totales["Total de Unidades Vendidas"]}</td>
            <td>{ventasData.totales["Total en Efectivo"]}</td>
            <td>{ventasData.totales["Total en Transferencias"]}</td>
            <td>{ventasData.totales["Ingresos Totales"]}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <button onClick={exportarReporteExcel} className="add-button">
      Exportar a Excel
    </button>
  </div>
)}

    </div>  
);
}
export default Reportes;
