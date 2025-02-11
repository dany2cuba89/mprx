import React, { useState, useEffect } from "react";
import { supabase } from "../api/supabase"; // Importa el cliente de Supabase
import Table from "../components/Table"; // Componente de tabla
import Modal from "../components/Modal"; // Componente de modal
import { ToastContainer, toast } from "react-toastify"; // Para notificaciones visuales
import "../styles/Profile.css"; // Estilos similares a Inventario.js

const Assets = () => {
  const [assets, setAssets] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const elementosPorPagina = 5;
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    categoria: "",
    fecha_adquisicion: "",
    valor: "",
    vida_util: "",
    ubicacion: "",
    estado: "Activo", // Estado por defecto
  });
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false); // Modal para mostrar detalles
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Controla el modal de confirmación
  const [isEditMode, setIsEditMode] = useState(false); // Determina si estamos en modo edición
  const [selectedAssetId, setSelectedAssetId] = useState(null); // Para manejar el activo seleccionado
  const [selectedAssetDetails, setSelectedAssetDetails] = useState(null); // Datos del activo seleccionado para mostrar en el modal de detalles

  // Obtener los activos fijos desde el backend (Usando Supabase)
  useEffect(() => {
    fetchAssets();
  }, [paginaActual]);

  const fetchAssets = async () => {
    try {
      const { data, error, count } = await supabase
        .from("activos_fijos")
        .select("*", { count: "exact" })
        .range((paginaActual - 1) * elementosPorPagina, paginaActual * elementosPorPagina - 1);

      if (error) {
        throw error; // Lanza el error para que sea capturado por el catch
      }

      setAssets(data);
      setTotalPaginas(Math.ceil(count / elementosPorPagina));
    } catch (error) {
      console.error("Error al cargar los activos:", error);
      toast.error("Error al cargar los activos.");
    }
  };

  const calcularRangoPaginas = () => {
    const rango = [];
    for (let i = 1; i <= totalPaginas; i++) {
      rango.push(i);
    }
    return rango;
  };

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };

  const openDeleteConfirmModal = () => {
    if (!selectedAssetId) {
      toast.error("Debe seleccionar un activo para eliminar.");
    } else {
      setIsConfirmModalOpen(true); // Abre el modal de confirmación
    }
  };

  const closeDeleteConfirmModal = () => {
    setIsConfirmModalOpen(false); // Cierra el modal de confirmación
  };

  const handleDeleteConfirmation = async () => {
    try {
      const { error } = await supabase.from("activos_fijos").delete().eq("id", selectedAssetId);

      if (error) {
        throw error; // Lanza el error para que sea capturado por el catch
      }

      toast.success("Activo fijo eliminado exitosamente.");
      fetchAssets(); // Actualiza la lista de activos
      setSelectedAssetId(null); // Limpia la selección
    } catch (err) {
      console.error("Error al eliminar activo:", err.message);
      toast.error("Ocurrió un error al eliminar el activo.");
    }

    closeDeleteConfirmModal(); // Cierra el modal después de la confirmación
  };

  // Función para manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Función para registrar un activo
  const addActivo = async (activo) => {
    const {
      nombre,
      descripcion,
      categoria,
      fecha_adquisicion,
      valor,
      vida_util,
      ubicacion,
      estado,
    } = activo;

    // Calcular la depreciación anual
    const depreciacion_anual = (valor - 0) / vida_util; // Suponiendo valor_residual = 0

    // Calcular la fecha de baja si el activo tiene vida útil
    const fecha_baja = new Date(fecha_adquisicion);
    fecha_baja.setFullYear(fecha_baja.getFullYear() + parseInt(vida_util, 10));

    // Calcular la depreciación acumulada basada en la fecha de adquisición y la fecha actual
    const fecha_registro = new Date(); // Fecha del registro (hoy)
    const añosTranscurridos = Math.floor((fecha_registro - new Date(fecha_adquisicion)) / (1000 * 60 * 60 * 24 * 365)); // Año transcurrido desde la adquisición
    const depreciacion_acumulada = Math.min(añosTranscurridos * depreciacion_anual, valor); // No puede superar el valor original

    // Calcular el valor residual (Valor original - depreciación acumulada)
    const valor_residual = valor - depreciacion_acumulada;

    const nuevoActivo = {
      nombre,
      descripcion,
      categoria,
      fecha_adquisicion,
      valor: parseFloat(valor),
      valor_residual: valor_residual, // Valor residual calculado
      vida_util: parseInt(vida_util, 10),
      depreciacion_anual,
      depreciacion_acumulada: depreciacion_acumulada, // Depreciación acumulada calculada
      estado,
      ubicacion,
      fecha_baja: vida_util > 0 ? fecha_baja.toISOString().split("T")[0] : null,
    };

    // Inserta el activo y devuelve el resultado
    const { data, error } = await supabase
      .from("activos_fijos")
      .insert([nuevoActivo])
      .select("*");

    if (error) {
      throw error; // Lanza el error para que sea capturado por el catch
    }

    return data;
  };

  // Función para manejar el envío del formulario (Registro/Edición)
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!isEditMode) {
        const result = await addActivo(formData);

        if (result) {
          toast.success("Activo fijo registrado exitosamente.");
          fetchAssets(); // Actualiza la lista de activos
          cerrarModal(); // Cierra el modal después de registrar
        }
      } else {
        const { error } = await supabase
          .from("activos_fijos")
          .update({
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            fecha_adquisicion: formData.fecha_adquisicion,
            valor: parseFloat(formData.valor),
            vida_util: parseInt(formData.vida_util, 10),
            categoria: formData.categoria,
            ubicacion: formData.ubicacion,
            estado: formData.estado,
          })
          .eq("id", selectedAssetId);

        if (error) {
          throw error; // Lanza el error para que sea capturado por el catch
        }

        toast.success("Activo fijo actualizado exitosamente.");
        fetchAssets(); // Actualiza la lista de activos
        cerrarModal(); // Cierra el modal después de actualizar
      }
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      toast.error("Ocurrió un error al procesar la solicitud.");
    }
  };

  // Función para abrir el modal en modo de edición
  const openEditModal = (asset) => {
    setSelectedAssetId(asset.id);
    setFormData({
      nombre: asset.nombre,
      descripcion: asset.descripcion,
      categoria: asset.categoria,
      fecha_adquisicion: asset.fecha_adquisicion,
      valor: asset.valor,
      vida_util: asset.vida_util,
      ubicacion: asset.ubicacion,
      estado: asset.estado || "Activo", // Estado por defecto si no está definido
    });
    setIsEditMode(true);
    setShowModal(true);
  };

  // Función para abrir el modal en modo de registro
  const openModal = () => {
    setShowModal(true);
  };

  // Función para cerrar el modal
  const cerrarModal = () => {
    setShowModal(false);
    setShowDetailsModal(false); // Cierra el modal de detalles si está abierto
    setFormData({
      nombre: "",
      descripcion: "",
      categoria: "",
      fecha_adquisicion: "",
      valor: "",
      vida_util: "",
      ubicacion: "",
      estado: "Activo",
    });
    setSelectedAssetId(null);
    setIsEditMode(false);
  };

  // Función para manejar la selección de una fila en la tabla
  const handleRowSelect = (assetId) => {
    setSelectedAssetId((prevSelectedAssetId) =>
      prevSelectedAssetId === assetId ? null : assetId
    );
  };

  // Función para mostrar los detalles de un activo
  const showAssetDetails = async () => {
    if (!selectedAssetId) {
      toast.error("Debe seleccionar un activo.");
      return;
    }

    const { data, error } = await supabase
      .from("activos_fijos")
      .select("*")
      .eq("id", selectedAssetId)
      .single(); // Obtener un solo activo

    if (error) {
      toast.error("Error al obtener los detalles del activo.");
    } else {
      setSelectedAssetDetails(data);
      setShowDetailsModal(true); // Muestra el modal de detalles
    }
  };

  return (
    <div className="empleados-container">
      <h2>Gestión de Activos Fijos</h2>

      <div className="tabla-container">
        <Table
          headers={[
            "Nombre",
            "Categoría",
            "Valor Adquisitivo",
            "Vida Útil",
            "Ubicación",
            "Estado",
          ]}
          data={assets.map((asset) => ({
            nombre: asset.nombre || "N/A",
            descripción: asset.descripcion || "N/A",
            categoría: asset.categoria || "N/A",
            "fecha de adquisición": asset.fecha_adquisicion || "N/A",
            "valor adquisitivo": asset.valor
              ? `$${parseFloat(asset.valor).toFixed(2)}`
              : "N/A",
            "vida útil": asset.vida_util || "N/A",
            ubicación: asset.ubicacion || "N/A",
            estado: asset.estado || "N/A",
            onClick: () => handleRowSelect(asset.id), // Seleccionar la fila
            seleccionado: asset.id === selectedAssetId, // Flag para la fila seleccionada
          }))}
          exactKeys={false} // Permitir claves en minúsculas
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

        {calcularRangoPaginas().map((pagina) => (
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
        <button onClick={openModal} className="add-button">
          Agregar
        </button>
        <button
          onClick={() => openEditModal(assets.find((asset) => asset.id === selectedAssetId))}
          className="add-button"
          disabled={!selectedAssetId} // Solo habilitar si un activo está seleccionado
        >
          Editar
        </button>
        <button
          onClick={openDeleteConfirmModal}
          className="delete-button"
          disabled={!selectedAssetId} // Solo habilitar si un activo está seleccionado
        >
          Eliminar
        </button>
        <button
          onClick={showAssetDetails}
          className="add-button"
          disabled={!selectedAssetId} // Solo habilitar si un activo está seleccionado
        >
          Detalles
        </button>
      </div>

      {/* Modal de confirmación */}
      {isConfirmModalOpen && (
        <Modal abierto={isConfirmModalOpen} cerrarModal={closeDeleteConfirmModal}>
          <h2>Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar el Activo Fijo{" "}
            <strong>{assets.find((asset) => asset.id === selectedAssetId)?.nombre}</strong>?
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

      {/* Modal de registro/edición */}
      {showModal && (
        <Modal abierto={showModal} cerrarModal={cerrarModal}>
          <h2>{isEditMode ? "Editar Activo Fijo" : "Registrar Activo Fijo"}</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Descripción:</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Categoría:</label>
              <input
                type="text"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Fecha de Adquisición:</label>
              <input
                type="date"
                name="fecha_adquisicion"
                value={formData.fecha_adquisicion}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Valor Adquisitivo:</label>
              <input
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Vida Útil (años):</label>
              <input
                type="number"
                name="vida_util"
                value={formData.vida_util}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Ubicación:</label>
              <input
                type="text"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Estado:</label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En Reparación">En Reparación</option>
              </select>
            </div>
            <div>
              <button type="submit" className="add-button">
                {isEditMode ? "Actualizar" : "Registrar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de detalles */}
      {showDetailsModal && selectedAssetDetails && (
        <Modal abierto={showDetailsModal} cerrarModal={cerrarModal}>
          <h2>Detalles del Activo</h2>
          <div className="detalles-container">
            <div className="columna-detalles">
              <p><strong>Nombre:</strong> {selectedAssetDetails.nombre}</p>
              <p><strong>Descripción:</strong> {selectedAssetDetails.descripcion}</p>
              <p><strong>Categoría:</strong> {selectedAssetDetails.categoria}</p>
              <p><strong>Fecha de Adquisición:</strong> {selectedAssetDetails.fecha_adquisicion}</p>
              <p><strong>Valor Adquisitivo:</strong> {selectedAssetDetails.valor}</p>
              <p><strong>Vida Útil:</strong> {selectedAssetDetails.vida_util} años</p>
            </div>
            <div className="columna-detalles">
              <p><strong>Valor Residual:</strong> {selectedAssetDetails.valor_residual}</p>
              <p><strong>Depreciación Anual:</strong> {selectedAssetDetails.depreciacion_anual}</p>
              <p><strong>Depreciación Acumulada:</strong> {selectedAssetDetails.depreciacion_acumulada}</p>
              <p><strong>Ubicación:</strong> {selectedAssetDetails.ubicacion}</p>
              <p><strong>Estado:</strong> {selectedAssetDetails.estado}</p>
              <p><strong>Fecha de Baja:</strong> {selectedAssetDetails.fecha_baja}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Assets;
