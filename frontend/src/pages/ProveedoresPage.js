import React, { useState, useEffect } from "react";
import { supabase } from "../api/supabase";
import Table from "../components/Table";
import Modal from "../components/Modal";
import "../styles/ProveedoresPage.css";

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // 'add', 'edit', 'view'
  const [formErrors, setFormErrors] = useState({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // Modal de confirmación
  const [errorMessage, setErrorMessage] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [proveedoresPaginadas, setProveedoresPaginadas] = useState([]);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const proveedoresPorPagina = 5;
  useEffect(() => {
  if (selectedProveedor) {
    console.log("selectedProveedor actualizado:", selectedProveedor);
  }
}, [selectedProveedor]);
useEffect(() => {
    paginarProveedores();
  }, [proveedores, paginaActual]);
  // Encabezados de la tabla
  const headers = [
    "Nombre",
    "Tipo",
    "NIT",
    "Teléfono",
    "Estado",
  ];
  // Traer datos desde Supabase
  const fetchProveedores = async () => {
  const { data, error } = await supabase.from("proveedores").select("*");
  if (error) {
    console.error("Error al obtener proveedores:", error.message);
  } else {
    // Mantén los datos originales
    setProveedores(data);
    setTotalPaginas(Math.ceil(data.length / proveedoresPorPagina));
  }
};
const paginarProveedores = () => {
    const inicio = (paginaActual - 1) * proveedoresPorPagina;
    const fin = inicio + proveedoresPorPagina;
    setProveedoresPaginadas(proveedores.slice(inicio, fin));
  };
  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
      setPaginaActual(nuevaPagina);
    }
  };
  // Calcular el rango de páginas visibles
  const calcularRangoPaginas = () => {
    const rangoVisibles = 3; // Número de páginas a mostrar
    const mitadRango = Math.floor(rangoVisibles / 2);
    let inicio = paginaActual - mitadRango;
    let fin = paginaActual + mitadRango;
    
    if (inicio < 1) {
      inicio = 1;
      fin = Math.min(rangoVisibles, totalPaginas);
    }    
    if (fin > totalPaginas) {
      fin = totalPaginas;
      inicio = Math.max(1, totalPaginas - rangoVisibles + 1);
    }   
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  };
  const rangoPaginas = calcularRangoPaginas();
  // Validar formulario
  const validateForm = () => {
    const errors = {};
    if (!selectedProveedor?.nombre_o_razon_social) {
      errors.nombre_o_razon_social = "El nombre o razón social es obligatorio.";
    }
    if (!selectedProveedor?.tipo_proveedor) {
      errors.tipo_proveedor = "El tipo de proveedor es obligatorio.";
    }
    if (!selectedProveedor?.nit) {
      errors.nit = "El NIT es obligatorio.";
    }
    if (!selectedProveedor?.direccion) {
      errors.direccion = "La dirección es obligatoria.";
    }
    if (!selectedProveedor?.telefono) {
      errors.telefono = "El teléfono es obligatorio.";
    }
    if (!selectedProveedor?.correo_electronico) {
      errors.correo_electronico = "El correo electrónico es obligatorio.";
    }
    if (!selectedProveedor?.persona_contacto) {
      errors.persona_contacto = "La persona de contacto es obligatoria.";
    }
    if (!selectedProveedor?.cargo_persona_contacto) {
      errors.cargo_persona_contacto = "El cargo de la persona de contacto es obligatorio.";
    }
    if (!selectedProveedor?.telefono_persona_contacto) {
      errors.telefono_persona_contacto = "El teléfono de la persona de contacto es obligatorio.";
    }
    if (!selectedProveedor?.correo_electronico_persona_contacto) {
    errors.correo_electronico_persona_contacto =
      "El correo de la persona de contacto es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(selectedProveedor?.correo_electronico_persona_contacto)) {
    // Validación del formato de correo electrónico
    errors.correo_electronico_persona_contacto = "El correo de la persona de contacto no es válido.";
  }
    if (!selectedProveedor?.condiciones_pago) {
      errors.condiciones_pago = "Las condiciones de pago son obligatorias.";
    }
    if (!selectedProveedor?.condiciones_entrega) {
      errors.condiciones_entrega = "Las condiciones de entrega son obligatorias.";
    }
    if (!selectedProveedor?.productos_o_servicios_ofrecidos) {
      errors.productos_o_servicios_ofrecidos =
        "Los productos o servicios ofrecidos son obligatorios.";
    }
    return errors;
  };
  // Guardar proveedor
  const handleSaveProveedor = async () => {
  const errors = validateForm();
  setFormErrors(errors);
  if (Object.keys(errors).length > 0) {
    console.log("Errores en el formulario:", errors);
    return; // Detén la ejecución si hay errores
  }
  // Loguear datos antes de enviarlos
  console.log("Datos para guardar en Supabase:", selectedProveedor);
  try {
    const dataToSave = { ...selectedProveedor };
    delete dataToSave.fecha_registro; // No enviamos `fecha_registro`, lo maneja Supabase automáticamente

    let response;
    if (modalMode === "add") {
      response = await supabase.from("proveedores").insert([dataToSave]);
    } else if (modalMode === "edit") {
      response = await supabase
        .from("proveedores")
        .update(dataToSave)
        .eq("id", dataToSave.id);
    }
    if (response.error) {
      console.error("Error al interactuar con Supabase:", response.error.message);
    } else {
      console.log("Proveedor guardado correctamente:", response.data);
      fetchProveedores(); // Actualiza la tabla
      closeModal(); // Cierra el modal
    }
  } catch (error) {
    console.error("Error al guardar proveedor:", error.message);
  }
};
useEffect(() => {
  if (errorMessage) {
    const timeout = setTimeout(() => {
      setErrorMessage(null);
    }, 3000); // Limpia el mensaje después de 3 segundos
    return () => clearTimeout(timeout);
  }
}, [errorMessage]);
  const handleDelete = () => {
  if (!selectedProveedor) {
    setErrorMessage("Por favor, selecciona un proveedor para eliminar.");
    return;
  }
  setIsConfirmModalOpen(true);
};  
  const confirmDeleteProveedor = async () => {
    if (!selectedProveedor) return;
    const { error } = await supabase
      .from("proveedores")
      .delete()
      .eq("id", selectedProveedor.id);
    if (error) {
      console.error("Error al eliminar proveedor:", error.message);
    } else {
      fetchProveedores();
      setSelectedProveedor(null); // Limpia la selección
    }
    setIsConfirmModalOpen(false); // Cierra el modal de confirmación
  };
 const handleView = () => {
  if (!selectedProveedor) {
    setErrorMessage("Por favor, selecciona un proveedor para ver los detalles.");
    return;
  }
  setTimeout(() => {
    setModalMode("view");
    openModal();
  }, 0); // Asegura que `selectedProveedor` se sincronice antes del render
};
  const handleEdit = () => {
  if (!selectedProveedor) {
    setErrorMessage("Por favor, selecciona un proveedor para editar.");
    return;
  }
  setModalMode("edit");
  openModal();
};
  const handleAdd = () => {
  setModalMode("add");
  setSelectedProveedor({
    nombre_o_razon_social: "",
    tipo_proveedor: "", // Inicializar vacío
    nit: "",
    direccion: "",
    telefono: "",
    correo_electronico: "",
    persona_contacto: "",
    cargo_persona_contacto: "",
    telefono_persona_contacto: "",
    correo_electronico_persona_contacto: "", // Inicializar vacío
    condiciones_pago: "",
    condiciones_entrega: "",
    productos_o_servicios_ofrecidos: "",
    certificaciones_o_licencias: "",
    estado_proveedor: "Activo", // Valor predeterminado
  });
  openModal();
};
  const handleRowClick = (row) => {
  console.log("Proveedor seleccionado (antes):", selectedProveedor);
  setSelectedProveedor(row); // Actualiza el proveedor seleccionado
  console.log("Proveedor seleccionado (después):", row);
};
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
  setIsModalOpen(false);
  setFormErrors({});
  if (modalMode === "add") {
    setSelectedProveedor(null); // Limpia la selección después de cerrar el modal de agregar
  }
};
  useEffect(() => {
    fetchProveedores();
  }, []);
  return (
      <div className="empleados-container">
      <h2>Gestión de Proveedores</h2>
      <div className="tabla-container">
<Table
  headers={headers}
  data={proveedoresPaginadas.map((row) => ({
    "nombre": row.nombre_o_razon_social || "N/A",
    "tipo": row.tipo_proveedor || "N/A",
    nit: row.nit || "N/A",
    teléfono: row.telefono || "N/A",
    "estado": row.estado_proveedor || "N/A",
    id: row.id, // Mantén el ID para operaciones
    onClick: () => handleRowClick(row), // Evento para seleccionar la fila
    seleccionado: row.id === selectedProveedor?.id, // Resalta la fila seleccionada
  }))}
  exactKeys={false}
/></div>
<div className="pagination">
        <button
          disabled={paginaActual === 1}
          onClick={() => cambiarPagina(paginaActual - 1)}
        >
          Anterior
        </button>
        {rangoPaginas.map((pagina) => (
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
      {errorMessage && <div className="error-message">{errorMessage}</div>}
<div className="botones-acciones">
  <button className="add-button" onClick={handleAdd}>
    Agregar
  </button>
  <button
    className="add-button"
    onClick={() => handleEdit(selectedProveedor)}
    disabled={!selectedProveedor}
  >
    Editar
  </button>
  <button
    className="add-button"
    onClick={() => handleView(selectedProveedor)}
    disabled={!selectedProveedor}
  >
    Detalles
  </button>
  <button
    className="delete-button"
    onClick={() => handleDelete(selectedProveedor?.id)}
    disabled={!selectedProveedor}
  >
    Eliminar
  </button>
</div>
      <Modal abierto={isModalOpen} cerrarModal={closeModal}>
        {(modalMode === "add" || modalMode === "edit") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveProveedor(selectedProveedor);
            }}
          >
            <h2>{modalMode === "add" ? "Agregar" : "Editar"}</h2>
            <div>
              <label>Nombre</label>
              <input
                type="text"
                placeholder="Nombre"
                value={selectedProveedor?.nombre_o_razon_social || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    nombre_o_razon_social: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
  <label>Tipo de Proveedor</label>
  <select
    value={selectedProveedor?.tipo_proveedor || ""}
    onChange={(e) =>
      setSelectedProveedor({
        ...selectedProveedor,
        tipo_proveedor: e.target.value,
      })
    }
    required
  >
    <option value="">Seleccione</option> {/* Se agrega esta opción para evitar valores vacíos */}
    <option value="Nacional">Nacional</option>
    <option value="Extranjero">Extranjero</option>
  </select>
            <div>
              <label>NIT</label>
              <input
                type="text"
                placeholder="NIT"
                value={selectedProveedor?.nit || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    nit: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Dirección</label>
              <input
                type="text"
                placeholder="Dirección"
                value={selectedProveedor?.direccion || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    direccion: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Teléfono</label>
              <input
                type="text"
                placeholder="Teléfono"
                value={selectedProveedor?.telefono || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    telefono: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Correo Electrónico</label>
              <input
                type="text"
                placeholder="Correo Electrónico"
                value={selectedProveedor?.correo_electronico || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    correo_electronico: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Persona de Contacto</label>
              <input
                type="text"
                placeholder="Persona de Contacto"
                value={selectedProveedor?.persona_contacto || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    persona_contacto: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Cargo Persona de Contacto</label>
              <input
                type="text"
                placeholder="Cargo Persona de Contacto"
                value={selectedProveedor?.cargo_persona_contacto || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    cargo_persona_contacto: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Teléfono Persona de Contacto</label>
              <input
                type="text"
                placeholder="Teléfono Persona de Contacto"
                value={selectedProveedor?.telefono_persona_contacto || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    telefono_persona_contacto: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
  <label>Correo Electrónico Persona de Contacto</label>
  <input
    type="text"
    placeholder="Correo Electrónico Persona de Contacto"
    value={selectedProveedor?.correo_electronico_persona_contacto || ""}
    onChange={(e) =>
      setSelectedProveedor({
        ...selectedProveedor,
        correo_electronico_persona_contacto: e.target.value,
      })
    }
    required
  />
</div>
            <div>
              <label>Condiciones de Pago</label>
              <input
                type="text"
                placeholder="Condiciones de Pago"
                value={selectedProveedor?.condiciones_pago || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    condiciones_pago: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Condiciones de Entrega</label>
              <input
                type="text"
                placeholder="Condiciones de Entrega"
                value={selectedProveedor?.condiciones_entrega || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    condiciones_entrega: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Productos o Servicios Ofrecidos</label>
              <input
                type="text"
                placeholder="Productos o Servicios Ofrecidos"
                value={selectedProveedor?.productos_o_servicios_ofrecidos || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    productos_o_servicios_ofrecidos: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Certificaciones o Licencias</label>
              <input
                type="text"
                placeholder="Certificaciones o Licencias"
                value={selectedProveedor?.certificaciones_o_licencias || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    certificaciones_o_licencias: e.target.value,
                  })
                }
                required
              />
            </div>
            <div>
              <label>Estado</label>
              <select
                value={selectedProveedor?.estado_proveedor || ""}
                onChange={(e) =>
                  setSelectedProveedor({
                    ...selectedProveedor,
                    estado_proveedor: e.target.value,
                  })
                }
                required
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
</div>
            <div className="modal-buttons">
            <button className="add-button"type="submit">
              {modalMode === "add" ? "Agregar" : "Guardar"}
            </button>
            <button onClick={closeModal} className="cancel-button">
            Cancelar
          </button>
          </div>
          </form>
        )}
        {modalMode === "view" && selectedProveedor && (
          <div>
            <h2>Detalles del Proveedor</h2>
            <div className="modal-content-detalles">
            {/* Contenedor de dos columnas */}
			<div className="modal-column-detalles">
        <p><strong>Nombre:</strong> {selectedProveedor.nombre_o_razon_social}</p>
        <p><strong>Tipo:</strong> {selectedProveedor.tipo_proveedor}</p>
        <p><strong>NIT:</strong> {selectedProveedor.nit}</p>
        <p><strong>Dirección:</strong> {selectedProveedor.direccion}</p>
        <p><strong>Teléfono:</strong> {selectedProveedor.telefono}</p>
        <p><strong>Correo Electrónico:</strong> {selectedProveedor.correo_electronico}</p>
        <p><strong>Condiciones Pago:</strong> {selectedProveedor.condiciones_pago}</p>
        <p><strong>Condiciones Entrega:</strong> {selectedProveedor.condiciones_entrega}</p>
        <p><strong>Productos o Servicios Ofrecidos:</strong> {selectedProveedor.productos_o_servicios_ofrecidos}</p>
        <p><strong>Certificaciones o Licencias:</strong> {selectedProveedor.certificaciones_o_licencias}</p>
        <p><strong>Estado:</strong> {selectedProveedor.estado_proveedor}</p>
      </div>
      <div className="modal-column-detalles">
        <p><strong>Persona Contacto:</strong> {selectedProveedor.persona_contacto}</p>
        <p><strong>Cargo Persona Contacto:</strong> {selectedProveedor.cargo_persona_contacto}</p>
        <p><strong>Teléfono Persona Contacto:</strong> {selectedProveedor.telefono_persona_contacto}</p>
        <p><strong>Correo Electrónico Persona Contacto:</strong> {selectedProveedor.correo_electronico_persona_contacto}</p>
      </div>
			</div>
            {/*<div className="modal-buttons">
            <button onClick={closeModal} className="cancel-button">
            Cerrar
          </button>
          </div>  */}
          </div>
        )}
      </Modal>
      {isConfirmModalOpen && (
        <Modal abierto={isConfirmModalOpen} cerrarModal={() => setIsConfirmModalOpen(false)}>
          <h2>Confirmar Eliminación</h2>
          <p>
            ¿Estás seguro de que deseas eliminar al proveedor{" "}
            <strong>{selectedProveedor?.nombre_o_razon_social}</strong>?
          </p>
          <div className="modal-buttons">
          <button className="add-button" onClick={confirmDeleteProveedor}>
            Confirmar
          </button>
          <button
            className="delete-button"
            onClick={() => setIsConfirmModalOpen(false)}
          >
            Cancelar
          </button>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default ProveedoresPage;
