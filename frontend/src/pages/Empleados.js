import React, { useState, useEffect } from "react";
import {
  getEmpleados,
  addEmpleado,
  updateEmpleado,
  deleteEmpleado,
  verificarNombreEmpleado,
  verificarCorreoEmpleado,
  addPagoEmpleado,
} from "../api/empleados";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { formatFecha } from "../utils/format";
import { toast } from "react-toastify";
import "../styles/Empleados.css";

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [empleadosPaginados, setEmpleadosPaginados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const empleadosPorPagina = 5;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleadoEnEdicion, setEmpleadoEnEdicion] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [empleadoActual, setEmpleadoActual] = useState({
    nombre_completo: "",
    puesto: "",
    salario: "",
    correo: "",
    metodo_pago: "",
    sistema_pago: "mensual",
    numero_tarjeta: null,
    fecha_contratacion: "",
    activo: true,
  });
  const [modalPagoAbierto, setModalPagoAbierto] = useState(false);
  const [pagoActual, setPagoActual] = useState({
    monto: "",
    intervalo_pago: "",
    fecha_inicio_periodo: "",
    fecha_fin_periodo: "",
    notas: "",
  });
  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarEmpleados();
  }, []);

  useEffect(() => {
    paginarEmpleados();
  }, [empleados, paginaActual]);

  const cargarEmpleados = async () => {
    try {
      const data = await getEmpleados();
      setEmpleados(data);
      setTotalPaginas(Math.ceil(data.length / empleadosPorPagina));
    } catch (err) {
      toast.error("Error al cargar empleados.");
    }
  };

  const paginarEmpleados = () => {
    const inicio = (paginaActual - 1) * empleadosPorPagina;
    const fin = inicio + empleadosPorPagina;
    setEmpleadosPaginados(empleados.slice(inicio, fin));
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const openDeleteConfirmModal = () => {
    if (!empleadoEnEdicion) {
      toast.error("Debe seleccionar un empleado para eliminar.");
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const closeDeleteConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirmation = async () => {
    try {
      if (empleadoEnEdicion) {
        await deleteEmpleado(empleadoEnEdicion.id);
        toast.success("Empleado eliminado exitosamente.");
        cargarEmpleados();
        setEmpleadoEnEdicion(null);
      }
    } catch (err) {
      toast.error(`Error al eliminar empleado: ${err.message}`);
    }
    closeDeleteConfirmModal();
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setEmpleadoActual((prev) => ({
      ...prev,
      [name]: name === "activo" ? e.target.checked : value,
    }));

    if (name === "metodo_pago" && value === "efectivo") {
      setEmpleadoActual((prev) => ({
        ...prev,
        numero_tarjeta: null,
      }));
    }
  };

  const realizarPago = async (empleadoId, pago) => {
    try {
      if (
        !empleadoId ||
        !pago.monto ||
        !pago.intervalo_pago ||
        !pago.fecha_inicio_periodo ||
        !pago.fecha_fin_periodo
      ) {
        toast.error("Debe completar todos los campos del pago.");
        return;
      }

      await addPagoEmpleado({
        empleado_id: empleadoId,
        nombre_empleado: empleadoEnEdicion?.nombre_completo || "N/A",
        monto: parseFloat(pago.monto),
        metodo_pago: empleadoEnEdicion?.metodo_pago || "efectivo",
        numero_tarjeta:
          empleadoEnEdicion?.metodo_pago === "transferencia"
            ? empleadoEnEdicion?.numero_tarjeta
            : null,
        intervalo_pago: pago.intervalo_pago,
        fecha_inicio_periodo: pago.fecha_inicio_periodo,
        fecha_fin_periodo: pago.fecha_fin_periodo,
        notas: pago.notas || "",
      });

      toast.success("Pago registrado exitosamente.");
      cerrarModalPago();
    } catch (err) {
      toast.error(`Error al registrar el pago: ${err.message}`);
    }
  };

  const validarFormulario = async () => {
    const nuevosErrores = {};

    if (!empleadoActual.nombre_completo.trim()) {
      nuevosErrores.nombre_completo = "El nombre completo es obligatorio.";
    } else if (
      await verificarNombreEmpleado(empleadoActual.nombre_completo, empleadoEnEdicion?.id)
    ) {
      nuevosErrores.nombre_completo = "Este nombre ya existe en la base de datos.";
    }
    if (!empleadoActual.sistema_pago) {
      nuevosErrores.sistema_pago = "El sistema de pago es obligatorio.";
    }

    if (!empleadoActual.correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empleadoActual.correo)) {
      nuevosErrores.correo = "El formato del correo no es válido.";
    } else if (
      await verificarCorreoEmpleado(empleadoActual.correo, empleadoEnEdicion?.id)
    ) {
      nuevosErrores.correo = "Este correo ya existe en la base de datos.";
    }

    if (empleadoActual.metodo_pago === "transferencia") {
      if (!empleadoActual.numero_tarjeta) {
        nuevosErrores.numero_tarjeta = "El número de tarjeta es obligatorio.";
      } else if (!/^\d{16}$/.test(empleadoActual.numero_tarjeta)) {
        nuevosErrores.numero_tarjeta = "El número de tarjeta debe tener 16 dígitos.";
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const agregarOEditarEmpleado = async () => {
    if (!(await validarFormulario())) return;

    try {
      if (empleadoEnEdicion) {
        await updateEmpleado(empleadoEnEdicion.id, empleadoActual);
        toast.success("Empleado actualizado exitosamente.");
      } else {
        await addEmpleado({
          ...empleadoActual,
          fecha_contratacion:
            empleadoActual.fecha_contratacion || new Date().toISOString().split("T")[0],
        });
        toast.success("Empleado agregado exitosamente.");
      }
      cerrarModal();
      cargarEmpleados();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const iniciarEdicion = (empleado) => {
    setEmpleadoEnEdicion(empleado);
    setEmpleadoActual({
      ...empleado,
      numero_tarjeta: empleado.numero_tarjeta || "",
    });
    setErrores({});
    setModalAbierto(true);
  };

  const abrirModal = () => {
    setEmpleadoEnEdicion(null);
    setEmpleadoActual({
      nombre_completo: "",
      puesto: "",
      salario: "",
      correo: "",
      metodo_pago: "efectivo",
      sistema_pago: "mensual",
      numero_tarjeta: null,
      fecha_contratacion: "",
      activo: true,
    });
    setErrores({});
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEmpleadoEnEdicion(null);
    setErrores({});
  };

  const abrirModalPago = () => {
    if (!empleadoEnEdicion) {
      toast.error("Debe seleccionar un empleado.");
      return;
    }
    setPagoActual({
      monto: "",
      fecha_inicio_periodo: "",
      fecha_fin_periodo: "",
      notas: "",
    });
    setModalPagoAbierto(true);
  };

  const cerrarModalPago = () => setModalPagoAbierto(false);

  return (
    <div className="empleados-container">
      <h2>Gestión de Empleados</h2>

      <div className="tabla-container">
        <Table
          headers={[
            "Nombre",
            "Puesto",
            "Salario",
            "Correo Electrónico",
            "Fecha de Contratación",
            "Activo",
          ]}
          data={empleadosPaginados.map((empleado) => ({
            nombre: empleado.nombre_completo || "N/A",
            puesto: empleado.puesto || "N/A",
            salario: empleado.salario ? parseFloat(empleado.salario).toFixed(2) : "N/A",
            "correo electrónico": empleado.correo || "N/A",
            "fecha de contratación": empleado.fecha_contratacion
              ? formatFecha(empleado.fecha_contratacion)
              : "N/A",
            activo: typeof empleado.activo === "boolean" ? (empleado.activo ? "Sí" : "No") : "N/A",
            onClick: () => setEmpleadoEnEdicion(empleado),
            seleccionado: empleadoEnEdicion?.id === empleado.id,
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

      <div className="botones-acciones">
        <button className="add-button" onClick={abrirModal}>
          Agregar
        </button>
        <button
          className="add-button"
          disabled={!empleadoEnEdicion}
          onClick={() => iniciarEdicion(empleadoEnEdicion)}
        >
          Editar
        </button>
        <button
          className="add-button"
          disabled={!empleadoEnEdicion}
          onClick={abrirModalPago}
        >
          Realizar Pago
        </button>
        <button
          className="delete-button"
          disabled={!empleadoEnEdicion}
          onClick={openDeleteConfirmModal}
        >
          Eliminar
        </button>
      </div>

      {isConfirmModalOpen && (
        <Modal abierto={isConfirmModalOpen} cerrarModal={closeDeleteConfirmModal}>
          <h2>Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar al empleado{" "}
            <strong>{empleadoEnEdicion?.nombre_completo}</strong>?
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
        <h2>{empleadoEnEdicion ? "Editar Empleado" : "Agregar Empleado"}</h2>
        <h4><label>Nombre completo</label></h4>
        <input
          type="text"
          name="nombre_completo"
          placeholder="Nombre completo"
          value={empleadoActual.nombre_completo}
          onChange={manejarCambio}
        />
        {errores.nombre_completo && <p className="error-text">{errores.nombre_completo}</p>}

        <h4><label>Puesto</label></h4>
        <input
          type="text"
          name="puesto"
          placeholder="Puesto"
          value={empleadoActual.puesto}
          onChange={manejarCambio}
        />

        <h4><label>Salario</label></h4>
        <input
          type="number"
          name="salario"
          placeholder="Salario"
          value={empleadoActual.salario}
          onChange={manejarCambio}
        />

        <h4><label>Correo Electrónico</label></h4>
        <input
          type="email"
          name="correo"
          placeholder="Correo electrónico"
          value={empleadoActual.correo}
          onChange={manejarCambio}
        />
        {errores.correo && <p className="error-text">{errores.correo}</p>}

        <h4><label>Método de Pago</label></h4>
        <select
          name="metodo_pago"
          value={empleadoActual.metodo_pago}
          onChange={manejarCambio}
        >
          <option value="">Selecciona un método de pago</option>
          <option value="transferencia">Transferencia</option>
          <option value="efectivo">Efectivo</option>
        </select>

        {empleadoActual.metodo_pago === "transferencia" && (
          <>
            <h4><label>Número de Tarjeta</label></h4>
            <input
              type="text"
              name="numero_tarjeta"
              placeholder="Número de tarjeta"
              value={empleadoActual.numero_tarjeta || ""}
              onChange={manejarCambio}
            />
            {errores.numero_tarjeta && <p className="error-text">{errores.numero_tarjeta}</p>}
          </>
        )}

        <h4><label>Sistema de Pago</label></h4>
        <select
          name="sistema_pago"
          value={empleadoActual.sistema_pago}
          onChange={manejarCambio}
        >
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>

        <h4><label>Fecha de Contratación</label></h4>
        <input
          type="date"
          name="fecha_contratacion"
          value={empleadoActual.fecha_contratacion || ""}
          onChange={manejarCambio}
        />

        <div className="checkbox-container">
          <label className="checkbox-label">
            <span>Activo</span>
            <input
              type="checkbox"
              name="activo"
              checked={empleadoActual.activo}
              onChange={manejarCambio}
            />
          </label>
        </div>

        <div className="modal-buttons">
          <button onClick={agregarOEditarEmpleado} className="add-button">
            {empleadoEnEdicion ? "Guardar Cambios" : "Agregar Empleado"}
          </button>
          <button onClick={cerrarModal} className="cancel-button">
            Cancelar
          </button>
        </div>
      </Modal>

      <Modal abierto={modalPagoAbierto} cerrarModal={cerrarModalPago}>
        <h3>Realizar Pago</h3>
        <input
          type="number"
          name="monto"
          placeholder="Monto a pagar"
          value={pagoActual.monto || ""}
          onChange={(e) => setPagoActual({ ...pagoActual, monto: e.target.value })}
        />

        <select
          name="intervalo_pago"
          value={pagoActual.intervalo_pago || ""}
          onChange={(e) => setPagoActual({ ...pagoActual, intervalo_pago: e.target.value })}
        >
          <option value="">Seleccionar intervalo</option>
          <option value="diario">Diario</option>
          <option value="semanal">Semanal</option>
          <option value="quincenal">Quincenal</option>
          <option value="mensual">Mensual</option>
        </select>

        <label>Período Pagado:</label>
        <input
          type="date"
          name="fecha_inicio_periodo"
          placeholder="Inicio del período"
          value={pagoActual.fecha_inicio_periodo || ""}
          onChange={(e) => setPagoActual({ ...pagoActual, fecha_inicio_periodo: e.target.value })}
        />
        <input
          type="date"
          name="fecha_fin_periodo"
          placeholder="Fin del período"
          value={pagoActual.fecha_fin_periodo || ""}
          onChange={(e) => setPagoActual({ ...pagoActual, fecha_fin_periodo: e.target.value })}
        />

        <select
          name="metodo_pago"
          value={pagoActual.metodo_pago || "efectivo"}
          onChange={(e) => setPagoActual({ ...pagoActual, metodo_pago: e.target.value })}
        >
          <option value="efectivo">Efectivo</option>
          <option value="transferencia">Transferencia</option>
        </select>

        {pagoActual.metodo_pago === "transferencia" && (
          <input
            type="text"
            name="numero_tarjeta"
            placeholder="Número de tarjeta"
            value={pagoActual.numero_tarjeta || ""}
            onChange={(e) => setPagoActual({ ...pagoActual, numero_tarjeta: e.target.value })}
          />
        )}

        <textarea
          name="notas"
          placeholder="Notas (opcional)"
          value={pagoActual.notas || ""}
          onChange={(e) => setPagoActual({ ...pagoActual, notas: e.target.value })}
        />

        <div className="modal-buttons">
          <button
            className="add-button"
            onClick={() => realizarPago(empleadoEnEdicion?.id, pagoActual)}
          >
            Confirmar Pago
          </button>
          <button className="cancel-button" onClick={cerrarModalPago}>
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default Empleados;
