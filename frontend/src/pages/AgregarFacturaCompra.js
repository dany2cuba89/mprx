import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { registrarFacturaCompra } from "../api/facturas";
import { buscarProductosPorNombre,updateProducto } from "../api/inventario";
import Table from "../components/Table";
import Modal from "../components/Modal";
import "../styles/AgregarFacturaCompra.css";

function AgregarFacturaCompra() {
  const { user } = useAuth();
  const [productosFactura, setProductosFactura] = useState([]);
  const [datosFactura, setDatosFactura] = useState({
    metodo_pago: "efectivo",
    proveedor: "",
  });
  const [productosEncontrados, setProductosEncontrados] = useState([]); // Inicializado como array vacío
  const [datosProducto, setDatosProducto] = useState({
    nombre: "",
    precio_compra: "",
    precio_venta: "",
    cantidad: "",
    nivel_minimo: "",
    unidad_medida: "",
    categoria: "",
  });
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 5;
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Manejar la búsqueda de productos
  const buscarProductos = async () => {
    try {
      const { data = [], total = 0 } = (await buscarProductosPorNombre(busqueda, paginaActual, productosPorPagina)) || {};
      setProductosEncontrados(data);
      setTotalPaginas(Math.ceil(total / productosPorPagina));
    } catch (error) {
      console.error("Error al buscar productos:", error.message);
      setProductosEncontrados([]); // Asegurar que no sea undefined
      setMensaje({ tipo: "error", texto: "Error al buscar productos." });
    }
  };

  // Cambiar página de productos encontrados
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
      buscarProductos();
    }
  };

  // Agregar un producto a la factura
  const agregarProductoAFactura = (productoSeleccionado = null) => {
    const esProductoExistente = productoSeleccionado !== null;

    const camposCompletos =
      datosProducto.nombre &&
      datosProducto.precio_compra &&
      datosProducto.precio_venta &&
      datosProducto.cantidad &&
      datosProducto.nivel_minimo &&
      datosProducto.unidad_medida &&
      datosProducto.categoria;

    if (!camposCompletos) {
      setMensaje({ tipo: "error", texto: "Todos los campos son obligatorios." });
      return;
    }

    if (esProductoExistente) {
      setDatosProducto({ ...productoSeleccionado, cantidad: 1 });
      const productoCoincidente = productosFactura.find(
        (prod) =>
          prod.id === productoSeleccionado.id &&
          prod.nombre === datosProducto.nombre &&
          prod.precio_compra === datosProducto.precio_compra &&
          prod.precio_venta === datosProducto.precio_venta &&
          prod.categoria === datosProducto.categoria
      );

      if (productoCoincidente) {
        setProductosFactura((prev) =>
          prev.map((prod) =>
            prod.id === productoSeleccionado.id
              ? { ...prod, cantidad: prod.cantidad + parseInt(datosProducto.cantidad, 10) }
              : prod
          )
        );
        setMensaje({ tipo: "success", texto: "Cantidad actualizada para producto existente." });
      } else {
        setProductosFactura((prev) => [
          ...prev,
          { ...datosProducto, id: null },
        ]);
        setMensaje({ tipo: "info", texto: "Producto agregado como nuevo." });
      }
    } else {
      const productoExistente = productosFactura.find((prod) => prod.nombre === datosProducto.nombre);
      if (productoExistente) {
        setProductosFactura((prev) =>
          prev.map((prod) =>
            prod.nombre === datosProducto.nombre
              ? { ...prod, cantidad: prod.cantidad + parseInt(datosProducto.cantidad, 10) }
              : prod
          )
        );
        setMensaje({ tipo: "success", texto: "Cantidad actualizada para producto existente." });
      } else {
        setProductosFactura((prev) => [...prev, { ...datosProducto }]);
        setMensaje({ tipo: "success", texto: "Producto nuevo agregado a la factura." });
      }
    }

    setDatosProducto({
      nombre: "",
      precio_compra: "",
      precio_venta: "",
      cantidad: "",
      nivel_minimo: "",
      unidad_medida: "",
      categoria: "",
    });
  };

  // Manejar el registro de la factura
  const registrarFactura = async () => {
    try {
      if (productosFactura.length === 0) {
        setMensaje({ tipo: "error", texto: "Debe agregar al menos un producto a la factura." });
        return;
      }

      for (const producto of productosFactura) {
        const productoExistente = productosEncontrados.find((inv) => inv.id === producto.id);

        if (productoExistente) {
          if (
            producto.nombre === productoExistente.nombre &&
            producto.precio_compra === productoExistente.precio_compra &&
            producto.precio_venta === productoExistente.precio_venta &&
            producto.categoria === productoExistente.categoria
          ) {
            await actualizarInventario(producto.id, {
              stock: productoExistente.stock + parseInt(producto.cantidad, 10),
            });
          } else {
            await crearProductoEnInventario({ ...producto });
          }
        } else {
          await crearProductoEnInventario({ ...producto });
        }
      }

      setProductosFactura([]);
      setMensaje({ tipo: "success", texto: "Factura registrada exitosamente." });
    } catch (error) {
      setMensaje({ tipo: "error", texto: `Error al registrar la factura: ${error.message}` });
    }
  };

  return (
    <div className="factura-container">
      <h2>Agregar Factura de Compra</h2>
      {mensaje && <div className={`notificacion ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="factura-datos">
        <label>
          Proveedor:
          <input
            type="text"
            value={datosFactura.proveedor}
            onChange={(e) => setDatosFactura({ ...datosFactura, proveedor: e.target.value })}
          />
        </label>
        <label>
          Método de Pago:
          <select
            value={datosFactura.metodo_pago}
            onChange={(e) => setDatosFactura({ ...datosFactura, metodo_pago: e.target.value })}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
          </select>
        </label>
      </div>

      <div className="factura-tabla">
        <h3>Productos en la Factura</h3>
        <Table
          headers={["Nombre", "Precio Compra", "Precio Venta", "Cantidad", "Acciones"]}
          data={productosFactura.map((producto, index) => ({
            nombre: producto.nombre,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            cantidad: producto.cantidad,
            acciones: (
              <button
                className="delete-button"
                onClick={() => setProductosFactura((prev) => prev.filter((_, i) => i !== index))}
              >
                Eliminar
              </button>
            ),
          }))}
        />
      </div>

      <div className="factura-botones">
        <button className="add-button" onClick={() => setModalAbierto(true)}>
          Agregar Productos
        </button>
        <button className="add-button" onClick={registrarFactura}>
          Registrar Factura
        </button>
      </div>

      <Modal abierto={modalAbierto} cerrarModal={() => setModalAbierto(false)}>
        <h3>Buscar Productos</h3>
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <button onClick={buscarProductos}>Buscar</button>
        <Table
          headers={["Nombre", "Precio Compra", "Precio Venta", "Acciones"]}
          data={(productosEncontrados || []).map((producto) => ({
            nombre: producto.nombre,
            precio_compra: producto.precio_compra,
            precio_venta: producto.precio_venta,
            acciones: (
              <button
                className="add-button"
                onClick={() => agregarProductoAFactura(producto)}
              >
                Seleccionar
              </button>
            ),
          }))}
        />
        <h3>Capturar Producto Manualmente</h3>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            value={datosProducto.nombre}
            onChange={(e) => setDatosProducto({ ...datosProducto, nombre: e.target.value })}
          />
          <label>Precio Compra:</label>
          <input
            type="number"
            value={datosProducto.precio_compra}
            onChange={(e) => setDatosProducto({ ...datosProducto, precio_compra: e.target.value })}
          />
          <label>Precio Venta:</label>
          <input
            type="number"
            value={datosProducto.precio_venta}
            onChange={(e) => setDatosProducto({ ...datosProducto, precio_venta: e.target.value })}
          />
          <label>Cantidad:</label>
          <input
            type="number"
            value={datosProducto.cantidad}
            onChange={(e) => setDatosProducto({ ...datosProducto, cantidad: e.target.value })}
          />
          <label>Nivel Mínimo:</label>
          <input
            type="number"
            value={datosProducto.nivel_minimo}
            onChange={(e) => setDatosProducto({ ...datosProducto, nivel_minimo: e.target.value })}
          />
          <label>Unidad de Medida:</label>
          <input
            type="text"
            value={datosProducto.unidad_medida}
            onChange={(e) => setDatosProducto({ ...datosProducto, unidad_medida: e.target.value })}
          />
          <label>Categoría:</label>
          <input
            type="text"
            value={datosProducto.categoria}
            onChange={(e) => setDatosProducto({ ...datosProducto, categoria: e.target.value })}
          />
          <button
            className="add-button"
            onClick={() => agregarProductoAFactura()}
          >
            Agregar a la Factura
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default AgregarFacturaCompra;
