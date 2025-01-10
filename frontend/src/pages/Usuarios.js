import React, { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import {
  getUsuarios,
  registerUser,
  updateUsuario,
  deleteUsuario,
  checkUsernameExists,
} from "../api/auth";
import Table from "../components/Table";
import Modal from "../components/Modal";
import { toast } from "react-toastify";
import "../styles/Usuarios.css";

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosPaginados, setUsuariosPaginados] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const usuariosPorPagina = 5;
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState({
    correo: "",
    nombre_completo: "",
    username: "",
    rol: "cajero",
    password: "",
  });
  const [modoEdicion, setModoEdicion] = useState(false);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    paginarUsuarios();
  }, [usuarios, paginaActual]);

  const cargarUsuarios = async () => {
    try {
      const data = await getUsuarios();
      setUsuarios(data);
      setTotalPaginas(Math.ceil(data.length / usuariosPorPagina));
    } catch (err) {
      toast.error("Error al cargar los usuarios.");
    }
  };

  const paginarUsuarios = () => {
    const inicio = (paginaActual - 1) * usuariosPorPagina;
    const fin = inicio + usuariosPorPagina;
    setUsuariosPaginados(usuarios.slice(inicio, fin));
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const openDeleteConfirmModal = () => {
    if (!usuarioSeleccionado) {
      toast.error("Debe seleccionar un usuario para eliminar.");
    } else {
      setIsConfirmModalOpen(true);
    }
  };

  const closeDeleteConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  const handleDeleteConfirmation = async () => {
    try {
      if (usuarioSeleccionado) {
        await deleteUsuario(usuarioSeleccionado.id);
        toast.success("Usuario eliminado exitosamente.");
        cargarUsuarios();
        setUsuarioSeleccionado(null);
      }
    } catch (err) {
      toast.error(`Error al eliminar usuario: ${err.message}`);
    }
    closeDeleteConfirmModal();
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setUsuarioActual({ ...usuarioActual, [name]: value });
    validarCampo(name, value);
  };

  const validarCampo = async (name, value) => {
    let error = "";

    if (name === "correo") {
      const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!correoRegex.test(value)) {
        error = "Correo inválido.";
      }
    }

    if (name === "nombre_completo") {
      const partesNombre = value.trim().split(" ");
      if (partesNombre.length < 3) {
        error = "El nombre debe incluir al menos un nombre y dos apellidos.";
      }
    }

    if (name === "username") {
      if (value.trim() === "") {
        error = "El nombre de usuario no puede estar vacío.";
      } else {
        const existe = await checkUsernameExists(value);
        if (existe) {
          error = "El nombre de usuario ya está en uso.";
        }
      }
    }

    setErrores((prev) => ({ ...prev, [name]: error }));
  };

  const agregarUsuario = async () => {
    const camposInvalidos =
      Object.values(errores).some((error) => error) ||
      !usuarioActual.correo ||
      !usuarioActual.nombre_completo ||
      !usuarioActual.username ||
      !usuarioActual.password;

    if (camposInvalidos) {
      toast.error("Por favor, corrige los errores antes de continuar.");
      return;
    }

    try {
      await registerUser(usuarioActual);
      toast.success(`Usuario ${usuarioActual.nombre_completo} agregado exitosamente.`);
      cerrarModal();
      cargarUsuarios();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const guardarEdicion = async () => {
    const camposInvalidos =
      Object.values(errores).some((error) => error) ||
      !usuarioActual.correo ||
      !usuarioActual.nombre_completo ||
      !usuarioActual.username;

    if (camposInvalidos) {
      toast.error("Por favor, corrige los errores antes de continuar.");
      return;
    }

    try {
      const profileData = {};
      if (usuarioActual.correo !== usuarioSeleccionado.correo) {
        profileData.correo = usuarioActual.correo;
      }
      if (usuarioActual.nombre_completo !== usuarioSeleccionado.nombre_completo) {
        profileData.nombre_completo = usuarioActual.nombre_completo;
      }
      if (usuarioActual.username !== usuarioSeleccionado.username) {
        profileData.username = usuarioActual.username;
      }
      if (usuarioActual.password && usuarioActual.password.trim() !== "") {
        profileData.password = usuarioActual.password;
      }

      if (Object.keys(profileData).length === 0) {
        toast.info("No se realizaron cambios.");
        return;
      }

      await supabase
        .from("usuarios")
        .update(profileData)
        .eq("id", usuarioActual.id);

      toast.success("Usuario actualizado exitosamente.");
      cerrarModal();
      cargarUsuarios();
    } catch (err) {
      toast.error("No se pudo actualizar el usuario.");
    }
  };

  const abrirModal = (modo, usuario = null) => {
    if (modo === "editar") {
      if (!usuario) {
        toast.error("Seleccione un usuario para editar.");
        return;
      }

      setUsuarioActual({
        ...usuario,
        password: "",
      });
      setModoEdicion(true);
    } else {
      setUsuarioActual({
        correo: "",
        nombre_completo: "",
        username: "",
        rol: "cajero",
        password: "",
      });
      setModoEdicion(false);
    }

    setModalAbierto(true);
  };

  const guardarUsuario = async () => {
    const camposInvalidos =
      Object.values(errores).some((error) => error) ||
      !usuarioActual.correo ||
      !usuarioActual.nombre_completo ||
      !usuarioActual.username ||
      (!modoEdicion && !usuarioActual.password);

    if (camposInvalidos) {
      toast.error("Por favor, corrige los errores antes de continuar.");
      return;
    }

    try {
      if (modoEdicion) {
        const profileData = {};
        if (usuarioActual.correo !== usuarioSeleccionado.correo) {
          profileData.correo = usuarioActual.correo;
        }
        if (usuarioActual.nombre_completo !== usuarioSeleccionado.nombre_completo) {
          profileData.nombre_completo = usuarioActual.nombre_completo;
        }
        if (usuarioActual.username !== usuarioSeleccionado.username) {
          profileData.username = usuarioActual.username;
        }
        if (usuarioActual.password && usuarioActual.password.trim() !== "") {
          profileData.password = usuarioActual.password;
        }

        if (Object.keys(profileData).length === 0) {
          toast.info("No se realizaron cambios.");
          return;
        }

        await supabase
          .from("usuarios")
          .update(profileData)
          .eq("id", usuarioActual.id);

        toast.success("Usuario actualizado exitosamente.");
      } else {
        const { error } = await supabase
          .from("usuarios")
          .insert({
            correo: usuarioActual.correo,
            nombre_completo: usuarioActual.nombre_completo,
            username: usuarioActual.username,
            rol: usuarioActual.rol,
            password: usuarioActual.password,
          });

        if (error) {
          throw error;
        }

        toast.success("Usuario agregado exitosamente.");
      }

      cerrarModal();
      cargarUsuarios();
    } catch (err) {
      toast.error("No se pudo guardar el usuario.");
    }
  };

  const cerrarModal = () => {
    setUsuarioActual(null);
    setModalAbierto(false);
    setErrores({});
  };

  return (
    <div className="empleados-container">
      <h2>Gestión de Usuarios</h2>

      <div className="tabla-container">
        <Table
          headers={["Nombre", "Correo", "Rol", "Fecha Creación"]}
          data={usuariosPaginados.map((usuario) => ({
            nombre: usuario.nombre_completo,
            correo: usuario.correo,
            rol: usuario.rol,
            "fecha creación": new Date(usuario.fecha_creacion).toLocaleString(),
            onClick: () => setUsuarioSeleccionado(usuario),
            seleccionado: usuarioSeleccionado?.id === usuario.id,
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
        <button className="add-button" onClick={() => abrirModal("agregar")}>
          Agregar
        </button>
        <button
          className="add-button"
          disabled={!usuarioSeleccionado}
          onClick={() => abrirModal("editar", usuarioSeleccionado)}
        >
          Editar
        </button>
        <button
          className="delete-button"
          disabled={!usuarioSeleccionado}
          onClick={openDeleteConfirmModal}
        >
          Eliminar
        </button>
      </div>

      <Modal abierto={modalAbierto} cerrarModal={cerrarModal}>
        <h2>{modoEdicion ? "Editar Usuario" : "Agregar Usuario"}</h2>
        <h4><label>Correo Electrónico</label></h4>
        <input
          type="email"
          name="correo"
          placeholder="Correo Electrónico"
          value={usuarioActual?.correo || ""}
          onChange={manejarCambio}
        />
        {errores.correo && <p className="error-text">{errores.correo}</p>}

        <h4><label>Nombre Completo</label></h4>
        <input
          type="text"
          name="nombre_completo"
          placeholder="Nombre Completo"
          value={usuarioActual?.nombre_completo || ""}
          onChange={manejarCambio}
        />
        {errores.nombre_completo && <p className="error-text">{errores.nombre_completo}</p>}

        <h4><label>Nombre de Usuario</label></h4>
        <input
          type="text"
          name="username"
          placeholder="Nombre de Usuario"
          value={usuarioActual?.username || ""}
          onChange={manejarCambio}
        />
        {errores.username && <p className="error-text">{errores.username}</p>}

        <h4><label>Tipo</label></h4>
        <select name="rol" value={usuarioActual?.rol || ""} onChange={manejarCambio}>
          <option value="dueño">Dueño</option>
          <option value="administrador">Administrador</option>
          <option value="económico">Económico</option>
          <option value="cajero">Cajero</option>
        </select>

        <h4><label>Contraseña</label></h4>
        <input
          type="password"
          name="password"
          placeholder={modoEdicion ? "Nueva Contraseña (opcional)" : "Contraseña"}
          value={usuarioActual?.password || ""}
          onChange={manejarCambio}
        />

        <div className="modal-buttons">
          <button className="add-button" onClick={guardarUsuario}>
            {modoEdicion ? "Guardar Cambios" : "Agregar Usuario"}
          </button>
          <button className="cancel-button" onClick={cerrarModal}>
            Cancelar
          </button>
        </div>
      </Modal>

      {isConfirmModalOpen && (
        <Modal abierto={isConfirmModalOpen} cerrarModal={closeDeleteConfirmModal}>
          <h2>Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar al usuario{" "}
            <strong>{usuarioSeleccionado?.nombre_completo}</strong>?
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
    </div>
  );
}

export default Usuarios;
