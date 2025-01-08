import React, { useEffect } from "react";
import "../styles/Modal.css";

const Modal = ({ abierto, cerrarModal, children }) => {
  useEffect(() => {
    if (abierto) {
      document.body.style.overflow = "hidden"; // Evita el scroll
    } else {
      document.body.style.overflow = ""; // Restaura el scroll
    }

    return () => {
      document.body.style.overflow = ""; // Limpieza al desmontar el componente
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={cerrarModal}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Contenido del modal */}
        <div className="modal-content">{children}</div>
        {/* Botón de cierre */}
        <button className="modal-close" onClick={cerrarModal}>
          ×
        </button>
      </div>
    </div>
  );
};

export default Modal;
