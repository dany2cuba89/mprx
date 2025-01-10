import React from "react";
import { Link } from "react-router-dom";
import "../styles/NotFound.css";

function NotFound() {
  return (
    <div className="notfound-container">
      <h1>404</h1>
      <p>Lo sentimos, la página que buscas no existe.</p>
      <Link to="/" className="home-link">
        Volver al Inicio
      </Link>
    </div>
  );
}

export default NotFound;
