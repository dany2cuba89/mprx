import React from "react";
import "../styles/Dashboard.css";
import logo from "../assets/images/logo.png";
import { FaEnvelope, FaWhatsapp } from "react-icons/fa"; // Solo necesitamos estos íconos

function Dashboard() {
  return (
    <div className="dashboard-container">
      <img src={logo} alt="EmpreX Logo" className="dashboard-logo" />
      
      {/* Breve Reseña de la Aplicación */}
      <section className="dashboard-section">
        <p>
          EmpreX es tu solución integral para la gestión de ventas, inventario y reportes en tiempo real.
          Diseñado para negocios modernos, te ayuda a mantener el control de tus operaciones de manera eficiente y segura.
        </p>
      </section>

      {/* Forma de Contacto */}
      <section className="dashboard-section">
        <h2>Contacto</h2>
        <p>
          ¿Necesitas ayuda? Ponte en contacto con nosotros:
        </p>
        <div className="contact-info">
          <div className="contact-item">
            <a href="mailto:emprex.dev@gmail.com" className="icon-link">
              <FaEnvelope className="icon" />
            </a>
            <a href="https://wa.me/5354588422" target="_blank" rel="noopener noreferrer" className="icon-link">
              <FaWhatsapp className="icon" />
            </a>
          </div>
          
        </div>
      </section>

      {/* Mensaje Motivador */}
      <section className="dashboard-section motivational-message">
        <h2>¡Un mensaje para ti!</h2>
        <p>
          "El éxito de tu negocio comienza con una buena gestión. ¡EmpreX está aquí para ayudarte!"
        </p>
      </section>
    </div>
  );
}

export default Dashboard;
