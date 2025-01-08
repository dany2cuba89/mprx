import { render, screen, fireEvent } from "@testing-library/react";
import Inventario from "../pages/Inventario";
import { AuthProvider } from "../context/AuthContext";

describe("Pruebas de Gestión del Inventario", () => {
  test("Renderiza la página de inventario correctamente", () => {
    render(
      <AuthProvider>
        <Inventario />
      </AuthProvider>
    );

    expect(screen.getByText(/gestión de inventario/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar producto/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar excel/i })).toBeInTheDocument();
  });

  test("Permite agregar un producto al inventario", () => {
    render(
      <AuthProvider>
        <Inventario />
      </AuthProvider>
    );

    const buttonAgregar = screen.getByRole("button", { name: /agregar producto/i });
    fireEvent.click(buttonAgregar);

    const inputNombre = screen.getByPlaceholderText(/nombre del producto/i);
    const inputPrecio = screen.getByPlaceholderText(/precio/i);
    const inputStock = screen.getByPlaceholderText(/stock/i);
    const buttonGuardar = screen.getByRole("button", { name: /guardar/i });

    fireEvent.change(inputNombre, { target: { value: "Laptop HP" } });
    fireEvent.change(inputPrecio, { target: { value: "45000" } });
    fireEvent.change(inputStock, { target: { value: "10" } });
    fireEvent.click(buttonGuardar);

    expect(screen.getByText(/producto agregado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/laptop hp/i)).toBeInTheDocument();
  });

  test("Permite editar un producto del inventario", () => {
    render(
      <AuthProvider>
        <Inventario />
      </AuthProvider>
    );

    const buttonEditar = screen.getAllByRole("button", { name: /editar/i })[0];
    fireEvent.click(buttonEditar);

    const inputPrecio = screen.getByPlaceholderText(/precio/i);
    fireEvent.change(inputPrecio, { target: { value: "50000" } });

    const buttonGuardar = screen.getByRole("button", { name: /guardar/i });
    fireEvent.click(buttonGuardar);

    expect(screen.getByText(/producto actualizado exitosamente/i)).toBeInTheDocument();
    expect(screen.getByText(/50000/i)).toBeInTheDocument();
  });

  test("Permite eliminar un producto del inventario", () => {
    render(
      <AuthProvider>
        <Inventario />
      </AuthProvider>
    );

    const buttonEliminar = screen.getAllByRole("button", { name: /eliminar/i })[0];
    fireEvent.click(buttonEliminar);

    expect(screen.getByText(/producto eliminado exitosamente/i)).toBeInTheDocument();
  });

  test("Permite exportar el inventario a Excel", () => {
    render(
      <AuthProvider>
        <Inventario />
      </AuthProvider>
    );

    const buttonExportar = screen.getByRole("button", { name: /exportar excel/i });
    fireEvent.click(buttonExportar);

    expect(screen.getByText(/archivo excel generado/i)).toBeInTheDocument();
  });
});
