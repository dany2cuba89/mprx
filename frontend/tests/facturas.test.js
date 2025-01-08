import { render, screen, fireEvent } from "@testing-library/react";
import Facturas from "../pages/Facturas";
import { AuthProvider } from "../context/AuthContext";

describe("Pruebas de Gestión de Facturas", () => {
  test("Renderiza la página de facturas correctamente", () => {
    render(
      <AuthProvider>
        <Facturas />
      </AuthProvider>
    );

    expect(screen.getByText(/gestión de facturas/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar factura/i })).toBeInTheDocument();
  });

  test("Permite agregar una factura de venta", () => {
    render(
      <AuthProvider>
        <Facturas />
      </AuthProvider>
    );

    const buttonAgregar = screen.getByRole("button", { name: /agregar factura/i });
    fireEvent.click(buttonAgregar);

    const inputCliente = screen.getByPlaceholderText(/nombre del cliente/i);
    const inputProducto = screen.getByPlaceholderText(/producto/i);
    const inputCantidad = screen.getByPlaceholderText(/cantidad/i);
    const inputPrecio = screen.getByPlaceholderText(/precio/i);
    const buttonGuardar = screen.getByRole("button", { name: /guardar/i });

    fireEvent.change(inputCliente, { target: { value: "Empresa ABC" } });
    fireEvent.change(inputProducto, { target: { value: "Monitor LED" } });
    fireEvent.change(inputCantidad, { target: { value: "5" } });
    fireEvent.change(inputPrecio, { target: { value: "1500" } });
    fireEvent.click(buttonGuardar);

    expect(screen.getByText(/factura creada exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/empresa abc/i)).toBeInTheDocument();
    expect(screen.getByText(/monitor led/i)).toBeInTheDocument();
  });

  test("Muestra detalles de una factura", () => {
    render(
      <AuthProvider>
        <Facturas />
      </AuthProvider>
    );

    const buttonVerDetalles = screen.getAllByRole("button", { name: /ver detalles/i })[0];
    fireEvent.click(buttonVerDetalles);

    expect(screen.getByText(/detalles de la factura/i)).toBeInTheDocument();
    expect(screen.getByText(/total/i)).toBeInTheDocument();
  });

  test("Permite eliminar una factura", () => {
    render(
      <AuthProvider>
        <Facturas />
      </AuthProvider>
    );

    const buttonEliminar = screen.getAllByRole("button", { name: /eliminar/i })[0];
    fireEvent.click(buttonEliminar);

    expect(screen.getByText(/factura eliminada exitosamente/i)).toBeInTheDocument();
  });
});
