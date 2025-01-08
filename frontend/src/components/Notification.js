import React, { useEffect } from "react";
import "../styles/Notification.css";

function Notification({ message, type, onClose }) {
  useEffect(() => {
    // Configura un temporizador para cerrar automáticamente la notificación
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 3000); // 3 segundos

    return () => clearTimeout(timer); // Limpia el temporizador al desmontar
  }, [onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <p>{message}</p>
    </div>
  );
}

export default Notification;
